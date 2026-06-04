import { createClient } from "@/lib/supabase/server";
import { CGPAManager } from "@/components/cgpa/CGPAManager";
import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";
import Footer from "@/components/Footer";
import { InstructionButton } from "@/components/InstructionButton";
import { redirect } from "next/navigation";
import { ADMIN_EMAILS } from "@/lib/constants";

export const metadata = {
  title: "CGPA Manager — Scholar Atlas",
  description: "Smart CGPA calculator with assessment prediction and exam score forecasting.",
};

export default async function CGPAPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const isFreeTier = user.email ? !ADMIN_EMAILS.includes(user.email) : true;

  // Fetch all CGPA data in parallel
  let settings = null;
  let gradeScales: any[] = [];
  let manualCourses: any[] = [];
  let autoCourses: any[] = [];
  let attendanceSubjects: any[] = [];
  let semesterSetup: any = null;

  if (user) {
    try {
      const [settingsRes, scalesRes, manualRes, autoRes, subjectsRes, setupRes] = await Promise.all([
        supabase
          .from('cgpa_settings')
          .select('*')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('cgpa_grade_scales')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('cgpa_courses_manual')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('cgpa_courses_auto')
          .select('*, cgpa_class_tests(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('subjects')
          .select('id, name, course_code, attendance_records(absence_type)')
          .eq('user_id', user.id),
        supabase
          .from('cgpa_semester_setup')
          .select('*')
          .eq('user_id', user.id)
          .single(),
      ]);

      settings = settingsRes.data;
      gradeScales = scalesRes.data || [];
      manualCourses = manualRes.data || [];
      autoCourses = (autoRes.data || []).map((c: any) => ({
        ...c,
        semester_number: c.semester_number ?? 1,
      }));
      semesterSetup = setupRes.data || null;

      // Process attendance subjects with percentage calculation
      attendanceSubjects = (subjectsRes.data || []).map((s: any) => {
        const records = s.attendance_records || [];
        const active = records.filter((r: any) => r.absence_type !== 'cancelled');
        const present = active.filter((r: any) => r.absence_type === 'present').length;
        const total = active.length;
        return {
          id: s.id,
          name: s.name,
          course_code: s.course_code,
          attendance_percentage: total > 0 ? (present / total) * 100 : 0,
        };
      });
    } catch (err) {
      console.error("[JARVIS]: Critical CGPA data fetch error:", err);
    }
  }

  const isInitialized = semesterSetup?.initialized === true;

  // Context-aware instruction options
  const instructionOptions = isInitialized
    ? [
        { title: "Course Weight Tracker", description: "Set weight percentages for Class Tests, Assignments, Attendance, and Exams. Add your marks to see your running total automatically." },
        { title: "Exam Score Predictor", description: "Enter your target grade (like 4.00). The system will calculate the exact percentage you need in your final exam to achieve it." },
        { title: "Semester Switcher", description: "Use tabs (S1, S2, etc.) to switch semesters. Edit past semester courses or view stored GPAs easily." },
        { title: "Custom Grade Scales", description: "Create your own grading rules (e.g., 80%+ = A). Setting a scale as global applies it to all courses automatically." },
        { title: "Link Attendance", description: "Connect a course to the Attendance Tracker to sync your attendance percentage and auto-calculate attendance marks." },
      ]
    : [
        { title: "1. Set Semesters", description: "Select the total number of semesters in your degree program (e.g., 8 semesters for a 4-year degree)." },
        { title: "2. Current Semester", description: "Choose the semester you are currently in to set up your active tracking space." },
        { title: "3. Past GPAs (Optional)", description: "Enter your GPAs for previous semesters to compute an accurate overall CGPA. You can also add these later." },
        { title: "4. Add Courses", description: "Once set up, use the '+ Add Course' button in any semester tab to start tracking your grades." },
      ];

  return (
    <div className="min-h-screen bg-bg-base flex flex-col font-body text-text-primary">
      <header className="bg-bg-base/95 backdrop-blur-xl border-b border-border-subtle py-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 flex justify-between items-center">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/dashboard" className="p-3 rounded-2xl bg-bg-elevated text-accent hover:scale-105 transition-all border border-border-strong shadow-sm dark:bg-bg-surface">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-accent tracking-tight uppercase tracking-[0.1em]">CGPA Manager</h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <InstructionButton
              title={isInitialized ? "CGPA Manager — Course Tracking" : "CGPA Manager — Getting Started"}
              description={
                isInitialized
                  ? "Forecast your semester outcomes, manage institutional grading systems, and simulate exam targets."
                  : "Follow these steps to initialize your CGPA Manager and begin smart semester tracking."
              }
              options={instructionOptions}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 py-8 sm:py-12 px-4 sm:px-8">
        <div className="max-w-[1600px] mx-auto">
          <CGPAManager
            initialSettings={settings}
            initialGradeScales={gradeScales}
            initialManualCourses={manualCourses}
            initialAutoCourses={autoCourses}
            attendanceSubjects={attendanceSubjects}
            initialSemesterSetup={semesterSetup}
            isFreeTier={isFreeTier}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
