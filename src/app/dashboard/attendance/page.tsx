export const runtime = 'edge';
import { createClient } from "@/lib/supabase/server";
import { AttendanceTracker } from "@/components/attendance/AttendanceTracker";
import Link from "next/link";
import { ArrowLeft, Home, CalendarCheck } from "lucide-react";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Attendance Tracker — BackLogger Buddy",
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
    <div className="min-h-screen bg-bg flex flex-col font-body">
      <header className="bg-bg/95 backdrop-blur-xl border-b border-[#92400e]/10 py-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-8 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="p-3 rounded-2xl bg-white text-[#92400e] hover:scale-105 transition-all border border-border-strong shadow-sm">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#92400e]/10 flex items-center justify-center text-[#92400e]">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black text-[#92400e] tracking-tight uppercase tracking-[0.1em]">Attendance Tracker</h1>
              </div>
            </div>
          </div>
          
          <Link href="/dashboard" className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-ink-2 hover:bg-white border border-transparent hover:border-border-strong shadow-sm transition-all">
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
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
