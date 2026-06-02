import { CGPACourseCardSkeleton } from "@/components/ui/Skeleton";
import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";
import Footer from "@/components/Footer";

export default function CGPALoading() {
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
            <div className="w-10 h-10 rounded-xl bg-border-subtle animate-pulse" />
          </div>
        </div>
      </header>

      <main className="flex-1 py-8 sm:py-12 px-4 sm:px-8">
        <div className="max-w-[1600px] mx-auto space-y-8">
          {/* Top Bar / Semester Setup Skeleton */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="w-10 h-10 rounded-xl bg-border-subtle animate-pulse" />
              ))}
            </div>
            <div className="w-32 h-10 bg-border-subtle rounded-xl animate-pulse" />
          </div>

          {/* GPA Display Skeleton */}
          <div className="bg-bg-surface p-6 sm:p-10 rounded-3xl border border-border-strong flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="w-full sm:w-1/3 space-y-2">
              <div className="w-32 h-4 bg-border-subtle rounded-full animate-pulse" />
              <div className="w-48 h-12 bg-border-subtle rounded-xl animate-pulse" />
            </div>
            <div className="w-full sm:w-2/3 h-4 bg-border-subtle rounded-full animate-pulse" />
          </div>

          {/* Courses Grid */}
          <div className="flex justify-between items-center mb-4">
            <div className="w-40 h-6 bg-border-subtle rounded-xl animate-pulse" />
            <div className="w-32 h-10 bg-border-subtle rounded-xl animate-pulse" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CGPACourseCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
