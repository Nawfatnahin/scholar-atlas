'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { addWeeks, parseISO, setDay, format, startOfDay } from "date-fns";
import { ADMIN_EMAILS, PRO_EMAILS, MAX_FREE_SUBJECTS } from "@/lib/constants";

const DAY_MAP: Record<string, number> = {
  'Sunday': 0,
  'Monday': 1,
  'Tuesday': 2,
  'Wednesday': 3,
  'Thursday': 4,
  'Friday': 5,
  'Saturday': 6,
};

export async function validateSchema() {
  const supabase = await createClient();
  
  // Check if columns exist in subjects table
  const { error } = await supabase
    .from('subjects')
    .select('course_code, semester_start_date, class_days')
    .limit(1);

  if (error && error.code === '42703') {
    return { valid: false, message: "Database columns missing. Please run the SQL migration script in your Supabase SQL Editor." };
  }

  // Check if class_sessions table exists
  const { error: sessionError } = await supabase
    .from('class_sessions')
    .select('id')
    .limit(1);

  if (sessionError && (sessionError.code === '42P01' || sessionError.message.includes('does not exist'))) {
    return { valid: false, message: "class_sessions table missing. Please run the SQL migration script in your Supabase SQL Editor." };
  }

  return { valid: true };
}

export async function addSubject(data: {
  name: string;
  courseCode?: string;
  targetPercentage: number;
  classDays: string[];
  semesterStartDate: string;
  totalWeeks: number;
  initialAttendedCount?: number;
}) {
  const supabase = await createClient();
  
  // Robust Auth Check
  const { data: authData } = await supabase.auth.getUser();
  let currentUser = authData?.user;

  if (!currentUser) {
    const { data: sessionData } = await supabase.auth.getSession();
    currentUser = sessionData?.session?.user || null;
  }

  if (!currentUser) {
    return { success: false, error: "Not authenticated. Please try logging out and back in." };
  }

  // 1. Granular Validation
  if (!data.name || data.name.trim() === "") return { success: false, error: "Subject name is required" };
  if (!data.classDays || data.classDays.length === 0) return { success: false, error: "At least one class day must be selected" };
  if (!data.semesterStartDate) return { success: false, error: "Semester start date is required" };

  const targetPercentage = Math.min(100, Math.max(0, Number(data.targetPercentage) || 75));
  const totalWeeks = Math.min(52, Math.max(1, Number(data.totalWeeks) || 15));

  // 2. Check Subject Limit - Bypass for PRO & ADMIN
  const { data: sub } = await supabase.from('subscriptions').select('*').eq('email', currentUser.email).maybeSingle();
  const isAdmin = currentUser.email ? ADMIN_EMAILS.includes(currentUser.email) : false;
  const isProHardcoded = currentUser.email ? PRO_EMAILS.includes(currentUser.email) : false;
  
  let isPro = sub?.plan === 'pro' || isProHardcoded;
  if (isPro && sub?.premium_until) {
    if (new Date(sub.premium_until) < new Date()) {
      isPro = false;
    }
  }

  if (!isPro && !isAdmin) {
    const { count, error: countError } = await supabase
      .from("subjects")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", currentUser.id);
    
    if (countError) return { success: false, error: `Database Error (Limit Check): ${countError.message}` };
    if (count !== null && count >= MAX_FREE_SUBJECTS) {
      return { success: false, error: `Limit reached: You can only track up to ${MAX_FREE_SUBJECTS} subjects. Upgrade to Pro for unlimited!` };
    }
  }

  // 3. Insert Subject
  const { data: subject, error: subjectError } = await supabase
    .from("subjects")
    .insert({
      name: data.name.trim(),
      course_code: data.courseCode?.trim() || null,
      target_percentage: targetPercentage,
      semester_start_date: data.semesterStartDate,
      total_weeks: totalWeeks,
      classes_per_day: 1, // Defaulting to 1 as requested
      class_days: data.classDays,
      user_id: currentUser.id,
    })
    .select()
    .single();

  if (subjectError) {
    return { success: false, error: `Failed to create subject: ${subjectError.message}` };
  }

  // 4. Generate Sessions
  return await generateSessionsForSubject(subject as Subject, data.initialAttendedCount || 0);
}

export async function updateSubject(id: string, data: {
  name: string;
  courseCode?: string;
  targetPercentage: number;
  classDays: string[];
  semesterStartDate: string;
  totalWeeks: number;
}) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) return { success: false, error: "Not authenticated" };

  // 1. Update Subject Details
  const { data: subject, error: updateError } = await supabase
    .from("subjects")
    .update({
      name: data.name.trim(),
      course_code: data.courseCode?.trim() || null,
      target_percentage: Number(data.targetPercentage),
      semester_start_date: data.semesterStartDate,
      total_weeks: Number(data.totalWeeks),
      class_days: data.classDays,
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) return { success: false, error: updateError.message };

  // 2. Wipe existing upcoming sessions and regenerate
  // We preserve 'present' and 'absent' logs to prevent historical data loss.
  await supabase
    .from("class_sessions")
    .delete()
    .eq("subject_id", id)
    .in("status", ["upcoming", "holiday", "cancelled"]);

  return await generateSessionsForSubject(subject as Subject, 0);
}

interface Subject {
  id: string;
  user_id: string;
  name: string;
  course_code: string | null;
  target_percentage: number;
  semester_start_date: string;
  total_weeks: number;
  class_days: string[];
}

interface ClassSession {
  subject_id: string;
  user_id: string;
  date: string;
  status: 'present' | 'absent' | 'cancelled' | 'upcoming' | 'holiday';
}

async function generateSessionsForSubject(subject: Subject, initialAttendedCount: number) {
  const supabase = await createClient();
  try {
    const startDate = parseISO(subject.semester_start_date);
    const today = startOfDay(new Date());
    const pastSessionsList: ClassSession[] = [];
    const futureSessionsList: ClassSession[] = [];

    for (let week = 0; week < subject.total_weeks; week++) {
      for (const dayName of subject.class_days) {
        const dayIndex = DAY_MAP[dayName];
        if (dayIndex === undefined) continue;

        const currentWeekStart = addWeeks(startDate, week);
        const sessionDate = setDay(currentWeekStart, dayIndex, { weekStartsOn: 0 });
        
        let initialStatus: ClassSession['status'] = 'upcoming';
        if (week === 0 && sessionDate < startDate) {
          initialStatus = 'holiday';
        }
        
        const dateString = format(sessionDate, 'yyyy-MM-dd');
        const session: ClassSession = {
          subject_id: subject.id,
          user_id: subject.user_id,
          date: dateString,
          status: initialStatus,
        };

        if (sessionDate < today && initialStatus !== 'holiday') {
          pastSessionsList.push(session);
        } else {
          futureSessionsList.push(session);
        }
      }
    }

    const attended = Math.min(pastSessionsList.length, initialAttendedCount);
    pastSessionsList.forEach((s, idx) => {
      s.status = idx < attended ? 'present' : 'absent';
    });

    const allSessions = [...pastSessionsList, ...futureSessionsList];

    if (allSessions.length > 0) {
      const BATCH_SIZE = 50;
      for (let i = 0; i < allSessions.length; i += BATCH_SIZE) {
        const batch = allSessions.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from("class_sessions").insert(batch);
        if (error) return { success: false, error: error.message };
      }
    }

    revalidatePath("/dashboard/attendance");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function updateSessionStatus(sessionId: string, status: 'present' | 'absent' | 'cancelled' | 'upcoming' | 'holiday') {
  const supabase = await createClient();
  const { error } = await supabase
    .from("class_sessions")
    .update({ status })
    .eq("id", sessionId);

  if (error) throw error;
  revalidatePath("/dashboard/attendance");
}

export async function addExtraClass(subjectId: string, date: string, status: 'present' | 'absent') {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("class_sessions")
    .insert({
      subject_id: subjectId,
      user_id: user.id,
      date,
      status,
      is_extra: true
    });

  if (error) throw error;
  revalidatePath("/dashboard/attendance");
}

export async function deleteSubject(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard/attendance");
}

export async function getTodaysSessions() {
  try {
    const supabase = await createClient();
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from("class_sessions")
      .select(`
        *,
        subjects (
          name,
          course_code
        )
      `)
      .eq("date", today)
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("getTodaysSessions error (likely missing table):", error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Critical error in getTodaysSessions:", err);
    return [];
  }
}

export async function markHolidayRange(startDate: string, endDate: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("class_sessions")
    .update({ status: 'holiday' })
    .eq("user_id", user.id)
    .gte("date", startDate)
    .lte("date", endDate)
    .in("status", ["upcoming", "cancelled", "holiday"]);

  if (error) throw error;
  revalidatePath("/dashboard/attendance");
}

