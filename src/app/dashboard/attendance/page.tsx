import { createClient } from "@/lib/supabase/server";
import { AttendanceTracker } from "@/components/attendance/AttendanceTracker";
import Link from "next/link";
import { ArrowLeft, Home, CalendarCheck } from "lucide-react";
import Footer from "@/components/Footer";
import { InstructionButton } from "@/components/InstructionButton";

export const metadata = {
  title: "Attendance Tracker — Scholar Atlas",
};

export default async function AttendancePage() {
  const supabase = await createClient();
  
  // 1. Fetch subjects with their attendance records
  const { data: subjects, error: subjectsError } = await supabase
    .from("subjects")
    .select(`
      *,
      attendance_records (*)
    `)
    .order("created_at", { ascending: false });

  if (subjectsError) {
    console.error("Supabase error on AttendancePage (subjects):", subjectsError);
  }

  // 2. Fetch holidays
  const { data: holidays, error: holidaysError } = await supabase
    .from("holidays")
    .select("*")
    .order("date", { ascending: true });

  if (holidaysError) {
    console.error("Supabase error on AttendancePage (holidays):", holidaysError);
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col font-body text-text-primary">
      <header className="bg-bg-base/95 backdrop-blur-xl border-b border-border-subtle py-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-8 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="p-3 rounded-2xl bg-bg-elevated text-accent hover:scale-105 transition-all border border-border-strong shadow-sm dark:bg-bg-surface">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 dark:bg-[#FD1D1D]/15 flex items-center justify-center text-[#92400e] dark:text-[#FD1D1D] shrink-0">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div className="flex items-center">
                <h1 className="text-xl font-black text-accent tracking-tight uppercase tracking-[0.1em] leading-none">Attendance Tracker</h1>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <InstructionButton 
              title="Attendance Tracker"
              description="Monitor your overall semester health with precision, log class statuses in real-time, and run advanced skip-simulations."
              options={[
                { title: "Automated Semester Health Tracking", description: "The system tracks your overall attendance percentage automatically. If it falls below your required threshold, subjects are flagged as 'Attention' or 'Critical' immediately, helping you stay ahead of policy drops." },
                { title: "Instant Log & Status Control", description: "Within the active course section, click 'Present', 'Absent', or 'Cancelled' on any day. The system logs the timestamped session and updates your cumulative tracker in real-time with absolute precision." },
                { title: "Holiday & Cancellation Manager", description: "Easily register scheduled university holidays or specific class cancellations. These logged adjustments reduce total planned class counts, ensuring that your health score isn't unfairly lowered by missed days." },
                { title: "What-If Simulation Engine", description: "Curious if skipping a lecture tomorrow will drop you below your threshold? Open the simulator, select the target course, input the number of future sessions to skip or attend, and forecast the precise impact beforehand." },
                { title: "Precision Attendance Trend Chart", description: "View a high-fidelity visual history of your course attendance progress over time. Spot attendance patterns, audit historical metrics, and check exactly where critical dips occurred." }
              ]}
            />
            <Link href="/dashboard" className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-text-secondary hover:bg-bg-surface border border-transparent hover:border-border-strong shadow-sm transition-all dark:hover:bg-bg-elevated">
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-12 px-4 sm:px-8">
        <div className="max-w-[1600px] mx-auto">
          <AttendanceTracker 
            initialSubjects={subjects || []} 
            initialHolidays={holidays || []} 
          />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
