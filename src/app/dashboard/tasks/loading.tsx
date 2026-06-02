import { TaskColumnSkeleton } from "@/components/ui/Skeleton";
import Link from "next/link";
import { ArrowLeft, LayoutList } from "lucide-react";
import Footer from "@/components/Footer";

export default function TasksLoading() {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col font-body text-text-primary">
      <header className="bg-bg-base/95 backdrop-blur-xl border-b border-border-subtle py-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-8 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="p-3 rounded-2xl bg-bg-surface text-text-secondary hover:bg-bg-elevated transition-all border border-border-strong dark:bg-bg-elevated dark:hover:bg-bg-surface">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 dark:bg-blue-900/20 dark:text-blue-500">
                <LayoutList className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-black text-text-primary tracking-tight uppercase tracking-[0.1em]">Task Tracker</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-border-subtle animate-pulse" />
          </div>
        </div>
      </header>

      <main className="flex-1 py-12 px-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="w-40 h-8 bg-border-subtle rounded-xl animate-pulse" />
            <div className="w-32 h-10 bg-border-subtle rounded-xl animate-pulse" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TaskColumnSkeleton count={4} />
            <TaskColumnSkeleton count={3} />
            <TaskColumnSkeleton count={2} />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
