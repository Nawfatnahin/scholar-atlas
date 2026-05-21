export const runtime = 'edge';
import { createClient } from "@/lib/supabase/server";
import { AttendanceTracker } from "@/components/attendance/AttendanceTracker";
import Link from "next/link";
import { ArrowLeft, Home, CalendarCheck } from "lucide-react";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Precision Monitoring System — BackLogger Buddy",
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col font-body">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 py-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-8 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all border border-zinc-100 dark:border-zinc-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight uppercase tracking-[0.15em]">Precision Monitoring System</h1>
                <p className="text-[10px] font-mono text-cyan-500/70 tracking-widest hidden sm:block">ATTENDANCE COMMAND CENTER — ONLINE</p>
              </div>
            </div>
          </div>
          
          <Link href="/dashboard" className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
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
