"use client";

import React, { useState } from "react";
import { Check, X, Clock, PartyPopper } from "lucide-react";
import { updateSessionStatus } from "@/app/dashboard/attendance/actions";
import { toast } from "sonner";

interface Session {
  id: string;
  status: 'present' | 'absent' | 'cancelled' | 'upcoming' | 'holiday';
  subjects: {
    name: string;
    course_code: string | null;
  };
}

export default function TodaysClasses({ initialSessions }: { initialSessions: Session[] }) {
  const [sessions, setSessions] = useState(initialSessions);
  const [applyToAll, setApplyToAll] = useState(false);

  const handleStatusUpdate = async (sessionId: string, status: 'present' | 'absent' | 'cancelled' | 'holiday', applyToAllOverride: boolean = false) => {
    try {
      if (applyToAllOverride && (status === 'cancelled' || status === 'holiday')) {
        const promises = sessions.map(s => updateSessionStatus(s.id, status));
        await Promise.all(promises);
        setSessions(prev => prev.map(s => ({ ...s, status })));
        toast.success(`Marked all classes as ${status}`);
      } else {
        await updateSessionStatus(sessionId, status);
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status } : s));
        toast.success(`Marked as ${status}`);
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (sessions.length === 0) {
    return (
      <div className="bg-white/40 backdrop-blur-xl p-8 rounded-[40px] border border-border-strong flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-bg rounded-2xl flex items-center justify-center mb-4">
          <Clock className="w-6 h-6 text-ink-4" />
        </div>
        <h4 className="font-bold text-ink">No classes today</h4>
        <p className="text-sm text-ink-3">Enjoy your free time!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <h3 className="text-xl sm:text-2xl font-black text-ink tracking-tight flex items-center gap-3">
          <Clock className="w-5 h-5 sm:w-6 h-6 text-[#92400e]" />
          Today&apos;s Classes
        </h3>
        {sessions.length > 1 && (
          <label className="flex items-center gap-2 cursor-pointer bg-white/60 px-4 py-2 rounded-xl border border-border-strong hover:bg-white/80 transition-all">
            <input 
              type="checkbox" 
              checked={applyToAll} 
              onChange={(e) => setApplyToAll(e.target.checked)}
              className="w-4 h-4 rounded text-[#92400e] focus:ring-[#92400e]"
            />
            <span className="text-xs font-bold text-ink-2">Apply Holiday/Cancel to All</span>
          </label>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {sessions.map((session) => (
          <div 
            key={session.id} 
            className="bg-white/70 backdrop-blur-xl p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-border-strong shadow-sm group hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div>
                <h4 className="font-bold text-ink text-base sm:text-lg line-clamp-1">{session.subjects.name}</h4>
                {session.subjects.course_code && (
                  <p className="text-[10px] font-bold text-[#92400e]/60 uppercase tracking-widest">
                    {session.subjects.course_code}
                  </p>
                )}
              </div>
              <div className={
                `px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${
                  session.status === 'present' ? 'bg-green-100 text-green-700' :
                  session.status === 'absent' ? 'bg-red-100 text-red-700' :
                  session.status === 'cancelled' ? 'bg-amber-100 text-amber-700' :
                  session.status === 'holiday' ? 'bg-blue-100 text-blue-700' :
                  'bg-stone-100 text-stone-700'
                }`
              }>
                {session.status}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusUpdate(session.id, 'present')}
                  disabled={session.status === 'present'}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all ${
                    session.status === 'present' 
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                    : 'bg-stone-50 text-ink-2 hover:bg-green-50 hover:text-green-700'
                  }`}
                >
                  <Check className="w-3 h-3 sm:w-4 h-4" />
                  Yes
                </button>
                <button
                  onClick={() => handleStatusUpdate(session.id, 'absent')}
                  disabled={session.status === 'absent'}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all ${
                    session.status === 'absent' 
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                    : 'bg-stone-50 text-ink-2 hover:bg-red-50 hover:text-red-700'
                  }`}
                >
                  <X className="w-3 h-3 sm:w-4 h-4" />
                  No
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusUpdate(session.id, 'cancelled', applyToAll)}
                  disabled={session.status === 'cancelled'}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all ${
                    session.status === 'cancelled' 
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
                    : 'bg-stone-50 text-ink-2 hover:bg-amber-50 hover:text-amber-700'
                  }`}
                >
                  Canceled
                </button>
                <button
                  onClick={() => handleStatusUpdate(session.id, 'holiday', applyToAll)}
                  disabled={session.status === 'holiday'}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all ${
                    session.status === 'holiday' 
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                    : 'bg-stone-50 text-ink-2 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <PartyPopper className="w-3 h-3 sm:w-4 h-4" />
                  Holiday
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
