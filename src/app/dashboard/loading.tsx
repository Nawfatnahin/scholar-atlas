import { DashboardWidgetSkeleton, StatsBarSkeleton, PageHeaderSkeleton } from "@/components/ui/Skeleton";
import { Home, BookOpen, Clock } from "lucide-react";
import DarkModeToggle from "@/components/ui/DarkModeToggle";
import Link from "next/link";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col font-body">
      <header className="bg-bg-base/95 backdrop-blur-xl border-b border-border-subtle py-3 sm:py-6 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-accent text-white hover:scale-105 shadow-lg shadow-accent/20 transition-all flex-shrink-0">
              <Home className="w-5 h-5 sm:w-6 h-6" />
            </div>
            <div className="flex items-center gap-4 sm:gap-8">
              <h1 className="text-xl sm:text-2xl font-black text-accent tracking-tight hidden xs:block uppercase tracking-[0.1em]">Dashboard</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-8">
            <DarkModeToggle />
            <div className="w-8 h-8 rounded-full bg-border-subtle animate-pulse" />
          </div>
        </div>
      </header>

      <main className="flex-1 py-10 sm:py-20 px-4 sm:px-8">
        <div className="max-w-[1600px] mx-auto">
          {/* Semester Progress Skeleton */}
          <div className="mb-12">
            <DashboardWidgetSkeleton />
          </div>

          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10 sm:gap-12 mb-12 sm:mb-20">
            {/* Greeting Skeleton */}
            <div className="w-full xl:w-1/2">
              <PageHeaderSkeleton />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 w-full xl:w-auto">
              <div className="bg-bg-surface/60 backdrop-blur-xl px-6 md:px-12 py-6 md:py-10 rounded-3xl md:rounded-[50px] border border-border-strong md:min-w-[240px]">
                <div className="w-24 h-3 bg-blue-600/20 rounded-full mb-4 animate-pulse" />
                <div className="w-16 h-12 md:h-16 bg-blue-600/10 rounded-xl animate-pulse" />
              </div>
              <div className="bg-bg-surface/60 backdrop-blur-xl px-6 md:px-12 py-6 md:py-10 rounded-3xl md:rounded-[50px] border border-border-strong md:min-w-[240px]">
                <div className="w-24 h-3 bg-red-600/20 rounded-full mb-4 animate-pulse" />
                <div className="w-16 h-12 md:h-16 bg-red-600/10 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>

          <div className="mb-12">
            <StatsBarSkeleton />
          </div>

          {/* Cards Skeleton Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="glass-card p-6 sm:p-10 rounded-[30px] sm:rounded-[50px] flex flex-col min-h-[300px]">
                <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-[18px] sm:rounded-[24px] bg-border-subtle animate-pulse mb-6 sm:mb-8" />
                <div className="w-3/4 h-6 sm:h-8 bg-border-subtle rounded-xl animate-pulse mb-3" />
                <div className="w-full h-16 bg-border-subtle rounded-xl animate-pulse mb-6 sm:mb-10" />
                <div className="w-1/2 h-4 bg-border-subtle rounded-xl animate-pulse mt-auto" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
