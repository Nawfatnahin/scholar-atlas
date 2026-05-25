'use client';

import React from 'react';
import { format } from 'date-fns';
import { Check, X, Clock } from 'lucide-react';
import { markAttendance } from '@/app/dashboard/attendance/actions';
import { toast } from 'sonner';

interface TodayScheduleProps {
  subjects: any[];
}

export const TodaySchedule: React.FC<TodayScheduleProps> = ({ subjects }) => {
  const today = new Date();
  const dayName = format(today, 'EEEE');

  const todaysSubjects = subjects.filter(s => 
    s.schedule_days?.includes(dayName)
  );

  const handleQuickMark = async (subjectId: string, type: 'present' | 'unexcused' | 'cancelled') => {
    try {
      const res = await markAttendance({
        subjectId,
        absenceType: type,
        classDate: format(today, 'yyyy-MM-dd')
      });

      if (res.success) {
        toast.success(`Marked as ${type}`);
      } else if (res.requiresConfirmation) {
        // Trigger modal logic (this would need to be handled by a parent or via state)
        toast.info('Attendance requires confirmation due to low percentage');
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[40px] p-8 border border-border-strong shadow-[0_20px_50px_rgba(0,0,0,0.04)] mb-10 overflow-hidden relative">
      <div className="relative z-10">
        <h3 className="text-sm font-black text-[#92400e] uppercase tracking-[0.3em] mb-4">
          Today — {format(today, 'EEEE, MMMM do')}
        </h3>

        {todaysSubjects.length === 0 ? (
          <p className="text-ink-3 font-medium">No classes scheduled for today, Sir.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {todaysSubjects.map(subject => (
              <div 
                key={subject.id}
                className="bg-white border border-border-strong rounded-3xl p-6 flex flex-col gap-4 min-w-[260px] shadow-sm hover:shadow-md transition-shadow dark:bg-zinc-900"
              >
                <div>
                  <h4 className="font-bold text-ink mb-1">{subject.name}</h4>
                  <p className="text-xs text-ink-3 font-bold uppercase tracking-wider">
                    {subject.schedule_time || 'No time set'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 w-full">
                  <button 
                    onClick={() => handleQuickMark(subject.id, 'present')}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800/30 rounded-xl hover:bg-green-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-wider"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Present</span>
                  </button>
                  <button 
                    onClick={() => handleQuickMark(subject.id, 'unexcused')}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/30 rounded-xl hover:bg-red-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-wider"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Absent</span>
                  </button>
                  <button 
                    onClick={() => handleQuickMark(subject.id, 'cancelled')}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/30 rounded-xl hover:bg-amber-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-wider"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Cancelled</span>
                  </button>
                  <button 
                    onClick={() => handleQuickMark(subject.id, 'cancelled')}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/30 rounded-xl hover:bg-blue-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-wider"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Holiday</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
