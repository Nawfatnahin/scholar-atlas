import { SubjectCardSkeleton } from "@/components/ui/Skeleton";
import Link from "next/link";
import { ArrowLeft, CalendarCheck } from "lucide-react";
import Footer from "@/components/Footer";

export default function AttendanceLoading() {
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
            <div className="w-10 h-10 rounded-xl bg-border-subtle animate-pulse" />
          </div>
        </div>
      </header>

      <main className="flex-1 py-12 px-4 sm:px-8">
        <div className="max-w-[1600px] mx-auto space-y-8">
          <div className="flex justify-between items-center mb-8">
            <div className="w-40 h-8 bg-border-subtle rounded-xl animate-pulse" />
            <div className="w-32 h-10 bg-border-subtle rounded-xl animate-pulse" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <SubjectCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
