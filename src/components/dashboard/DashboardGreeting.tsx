"use client";

import { useState } from "react";
import { Check, X, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function DashboardGreeting({ initialName }: { initialName: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [newName, setNewName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleUpdateName = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      data: { display_name: newName }
    });

    if (!error) {
      setName(newName);
      setIsEditing(false);
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="flex-1">
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-4 sm:mb-6">
        {isEditing ? (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 w-full max-w-xl">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="text-2xl sm:text-4xl md:text-5xl font-black text-ink bg-white/50 backdrop-blur-sm border-2 border-[#92400e]/20 rounded-2xl px-4 py-2 outline-none focus:border-[#92400e] transition-all w-full"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
            />
            <div className="flex gap-2">
              <button 
                onClick={handleUpdateName}
                disabled={loading}
                className="p-2.5 sm:p-3 rounded-2xl bg-green-600 text-white hover:bg-green-700 transition-all shadow-lg shadow-green-900/10 disabled:opacity-50"
              >
                <Check className="w-5 h-5 sm:w-6 h-6" />
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="p-2.5 sm:p-3 rounded-2xl bg-red-100 text-red-600 hover:bg-red-200 transition-all shadow-sm"
              >
                <X className="w-5 h-5 sm:w-6 h-6" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 sm:gap-6 group">
            <h2 className="text-3xl sm:text-5xl md:text-7xl font-black text-ink tracking-tighter leading-tight">
              Hey, <span className="text-[#92400e]">{name}</span>
            </h2>
            <button 
              onClick={() => setIsEditing(true)}
              className="p-2 sm:p-3 rounded-2xl bg-amber-100/50 text-[#92400e] opacity-0 group-hover:opacity-100 transition-all hover:bg-amber-100 shadow-sm hover:shadow-md active:scale-95 border border-[#92400e]/10"
              title="Edit name"
            >
              <Pencil className="w-5 h-5 sm:w-6 h-6" />
            </button>
          </div>
        )}
      </div>

      <p className="text-[#92400e]/80 text-lg sm:text-2xl md:text-3xl font-serif italic max-w-3xl leading-relaxed tracking-tight">
        Your academic command center is ready. <br />
        <span className="text-ink-2 not-italic font-sans font-bold text-[10px] sm:text-base md:text-xl uppercase tracking-[0.12em] sm:tracking-[0.2em] opacity-60">Here&apos;s your semester overview at a glance.</span>
      </p>
    </div>
  );
}
