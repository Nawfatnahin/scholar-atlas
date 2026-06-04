import { createClient } from "@/lib/supabase/server";
import { TaskTracker } from "@/components/tasks/TaskTracker";
import Link from "next/link";
import { ArrowLeft, Home, LayoutList } from "lucide-react";
import Footer from "@/components/Footer";
import { InstructionButton } from "@/components/InstructionButton";

export const metadata = {
  title: "Task Tracker - Scholar Atlas",
};

export default async function TasksPage() {
  const supabase = await createClient();
  
  const { data: tasks } = await supabase
    .from("tasks")
    .select(`
      *,
      subjects (
        name
      )
    `)
    .order("created_at", { ascending: false });

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name")
    .order("name");

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
            <InstructionButton 
              title="Task Tracker"
              description="Organize your academic tasks, set priorities, and track your progress."
              options={[
                { title: "Create Tasks", description: "Add tasks with titles, select priority levels (Low, Medium, High), and set due dates." },
                { title: "Link to Subjects", description: "Connect tasks to your courses to keep track of assignments and homework for each subject." },
                { title: "Kanban Board", description: "Drag and drop tasks between 'To Do', 'In Progress', and 'Done' columns to track your work visually." }
              ]}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 py-12 px-8">
        <div className="max-w-[1600px] mx-auto">
          <TaskTracker initialTasks={tasks || []} subjects={subjects || []} />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
