"use client";

import React, { useState } from "react";
import { Plus, Trash2, Calendar, CheckCircle2, Circle, Clock, Play, Check, RotateCcw } from "lucide-react";
import { addTask, updateTaskStatus, deleteTask } from "@/app/dashboard/tasks/actions";
import { toast } from "sonner";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  subjects?: { name: string } | null;
  subject_id: string | null;
}

interface Subject {
  id: string;
  name: string;
}

export function TaskTracker({ initialTasks, subjects }: { initialTasks: Task[], subjects: Subject[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newSubject, setNewSubject] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsPending(true);
    try {
      await addTask(newTitle, newPriority, newSubject || undefined, newDueDate || undefined);
      setNewTitle("");
      setNewSubject("");
      setNewDueDate("");
      setIsAdding(false);
      toast.success("Task added!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add task";
      toast.error(errorMessage);
    } finally {
      setIsPending(false);
    }
  };

  const columns: { id: Task['status']; title: string; icon: React.ElementType }[] = [
    { id: 'todo', title: 'To Do', icon: Circle },
    { id: 'in-progress', title: 'In Progress', icon: Clock },
    { id: 'done', title: 'Done', icon: CheckCircle2 },
  ];

  return (
    <div className="flex flex-col gap-6 sm:gap-8 no-tap-highlight text-text-primary">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">Task Board</h2>
          <p className="text-text-tertiary text-sm font-medium">Organise your assignments and deadlines.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center justify-center gap-2 bg-accent text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#78350f] transition-all shadow-lg shadow-accent/20 active:scale-95 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-bg-surface p-6 sm:p-8 rounded-[32px] border border-border-strong shadow-xl animate-in fade-in slide-in-from-top-4 duration-300 dark:bg-bg-elevated">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2">Task Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-border-strong bg-bg-base focus:outline-none focus:border-accent transition-all font-bold text-text-primary dark:bg-bg-surface"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as Task['priority'])}
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-border-strong focus:outline-none focus:border-accent transition-all font-bold appearance-none bg-bg-base text-text-primary dark:bg-bg-surface"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2">Subject</label>
              <select
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-border-strong focus:outline-none focus:border-accent transition-all font-bold appearance-none bg-bg-base text-text-primary dark:bg-bg-surface"
              >
                <option value="">None</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2">Due Date</label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-border-strong focus:outline-none focus:border-accent transition-all font-bold bg-bg-base text-text-primary dark:bg-bg-surface"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-6 py-3.5 text-xs font-black text-text-tertiary hover:text-text-primary uppercase tracking-widest order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="bg-accent text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#78350f] transition-all disabled:opacity-50 shadow-lg shadow-accent/10 order-1 sm:order-2"
            >
              {isPending ? "Adding..." : "Add Task"}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {columns.map((col) => (
          <div key={col.id} className="flex flex-col gap-5">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${col.id === 'done' ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' : col.id === 'in-progress' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' : 'bg-bg-surface text-text-tertiary dark:bg-bg-elevated'}`}>
                  <col.icon className="w-4 h-4" />
                </div>
                <h3 className="font-black text-text-primary uppercase text-[10px] tracking-[0.2em]">{col.title}</h3>
                <span className="bg-bg-surface px-2 py-0.5 rounded-lg border border-border-strong text-text-tertiary text-[10px] font-black dark:bg-bg-elevated">
                  {initialTasks.filter(t => t.status === col.id).length}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4 min-h-[100px] sm:min-h-[200px]">
              {initialTasks
                .filter(t => t.status === col.id)
                .map((task) => (
                  <div key={task.id} className={`bg-bg-surface p-6 rounded-[32px] border border-border-subtle shadow-sm group hover:border-accent/30 hover:shadow-xl dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition-all duration-300 dark:bg-bg-elevated ${task.status === 'done' ? 'opacity-60' : ''}`}>
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <h4 className={`text-base font-bold text-text-primary leading-tight tracking-tight ${task.status === 'done' ? 'line-through' : ''}`}>
                        {task.title}
                      </h4>
                      <div className="flex gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                         <button 
                           onClick={() => {
                             const nextStatus = task.status === 'todo' ? 'in-progress' : task.status === 'in-progress' ? 'done' : 'todo';
                             updateTaskStatus(task.id, nextStatus);
                           }}
                           className={`p-2.5 rounded-xl transition-all active:scale-90 ${
                             task.status === 'todo' ? 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white dark:bg-blue-900/20 dark:text-blue-400' :
                             task.status === 'in-progress' ? 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white dark:bg-green-900/20 dark:text-green-400' :
                             'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white dark:bg-amber-900/20 dark:text-amber-400'
                           }`}
                         >
                           {task.status === 'todo' && <Play className="w-4 h-4 fill-current" />}
                           {task.status === 'in-progress' && <Check className="w-4 h-4 stroke-[3]" />}
                           {task.status === 'done' && <RotateCcw className="w-4 h-4 stroke-[3]" />}
                         </button>
                         <button 
                           onClick={() => {
                             if(confirm("Delete task?")) deleteTask(task.id);
                           }}
                           className="p-2.5 bg-red-50 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-all active:scale-90 dark:bg-red-900/20 dark:text-red-400"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-auto">
                      {task.subjects && (
                        <span className="text-[9px] font-black uppercase tracking-widest bg-accent-light text-accent px-2.5 py-1.5 rounded-xl border border-accent/10 dark:bg-accent/10 dark:text-accent-amber">
                          {task.subjects.name}
                        </span>
                      )}
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl border ${
                        task.priority === 'high' ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30' :
                        task.priority === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30' :
                        'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30'
                      }`}>
                        {task.priority}
                      </span>
                      {task.due_date && (
                        <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest flex items-center gap-1.5 ml-auto">
                          <Calendar className="w-3.5 h-3.5 opacity-40" />
                          {format(new Date(task.due_date), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              
              {initialTasks.filter(t => t.status === col.id).length === 0 && (
                <div className="border-2 border-dashed border-border-subtle rounded-[32px] py-10 text-center bg-bg-surface/30 dark:bg-bg-elevated/30">
                  <p className="text-[10px] text-text-tertiary font-black uppercase tracking-widest opacity-40">No Tasks</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
