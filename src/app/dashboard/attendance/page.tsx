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
      <header className="bg-bg-base/95 backdrop-blur-xl border-b border-border-subtle py-4 sm:py-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="/dashboard" className="p-2.5 sm:p-3 rounded-2xl bg-bg-elevated text-accent hover:scale-105 transition-all border border-border-strong shadow-sm dark:bg-bg-surface">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-accent/10 dark:bg-[#FD1D1D]/15 flex items-center justify-center text-[#92400e] dark:text-[#FD1D1D] shrink-0">
                <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex items-center">
                <h1 className="text-sm sm:text-xl font-black text-accent tracking-tight uppercase tracking-[0.05em] sm:tracking-[0.1em] leading-none">Attendance Tracker</h1>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <InstructionButton 
              title="Attendance Tracker"
              description="Track your attendance, stay above required thresholds, and view your patterns over time."
              options={[
                { title: "Attendance Health", description: "Monitors your overall attendance. If your percentage falls below the threshold, it flags subjects needing attention." },
                { title: "Log Sessions", description: "Click 'Present', 'Absent', or 'Cancelled' to record class status. Your attendance percentage updates instantly." },
                { title: "Holidays & Cancellations", description: "Add holidays or class cancellations. Cancelled classes don't count against your attendance score." },
                { title: "Trend Chart", description: "View your attendance trends over time to spot patterns and check when dips occurred." }
              ]}
            />
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
