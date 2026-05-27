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
        { title: "Predictive Assessment Tracker (Auto Counter)", description: "Configure your active course syllabus structure by assigning percentage weights to Class Tests, Assignments, Attendance, and Exams. Enter your actual obtained marks to let the system compute your continuous scores in real-time." },
        { title: "Target Grade & Exam Score Forecast", description: "Declare your target grade point (e.g., 4.00 for A). Based on your continuous marks, the system simulates exactly what percentage you need in your final written exam to achieve that grade point, signaling if it is achievable." },
        { title: "Semester Tab Navigation", description: "Use the S1, S2 … SN tab strip to switch between semesters. Past semesters display their stored GPA. If you used the tracker in a past semester, you can fully manage those courses too." },
        { title: "Dynamic Grade Scale Customizer", description: "Every institution has a unique system. Create custom grade scale mappings (e.g., 80%+ = A/4.00, 75%+ = A-/3.75). Setting a scale as global automatically applies it to all of your course calculations." },
        { title: "Synchronized Attendance Linking", description: "Link your predictive course card directly to a subject from your Attendance Tracker. The system automatically imports your real-time attendance percentage to compute your attendance weight points dynamically." },
      ]
    : [
        { title: "Step 1 — Set Degree Length", description: "Tell the manager how many semesters your degree spans (e.g. 8 for a 4-year programme). Use the + / − buttons or type directly into the input." },
        { title: "Step 2 — Select Current Semester", description: "Tap the chip that represents the semester you are currently enrolled in. The manager will structure your tracking around this." },
        { title: "Step 3 — Previous GPAs (Optional)", description: "If you have prior semester GPAs, enter them now. These are used for an accurate cumulative CGPA calculation. You can skip and add them later from Semester Settings." },
        { title: "After Setup", description: "Once initialized, the main CGPA interface unlocks. You'll see your semester tabs, degree progress bar, and the + Add Course button. Courses are tied to specific semesters for precise semester-by-semester tracking." },
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
