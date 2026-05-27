'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SemesterTabsProps {
  totalSemesters: number;
  currentSemester: number;
  activeSemester: number;
  onTabChange: (sem: number) => void;
  /** Map of semester number -> GPA for past semesters with stored GPA (no courses) */
  previousGPAs: Record<string, number>;
  /** Set of semester numbers that have courses in the database */
  semestersWithCourses: Set<number>;
}

export function SemesterTabs({
  totalSemesters,
  currentSemester,
  activeSemester,
  onTabChange,
  previousGPAs,
  semestersWithCourses,
}: SemesterTabsProps) {
  return (
    <div className="relative">
      {/* Scrollable tab strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {Array.from({ length: totalSemesters }, (_, i) => i + 1).map(sem => {
          const isActive = activeSemester === sem;
          const isCurrent = sem === currentSemester;
          const isPast = sem < currentSemester;
          const isFuture = sem > currentSemester;
          const hasCourses = semestersWithCourses.has(sem);
          const storedGPA = previousGPAs[String(sem)];
          const hasStoredGPA = storedGPA !== undefined && storedGPA !== null;

          return (
            <button
              key={sem}
              onClick={() => onTabChange(sem)}
              className={`relative flex flex-col items-center shrink-0 min-w-[56px] px-4 py-2.5 rounded-2xl font-black text-sm transition-all duration-200 active:scale-95 group ${
                isActive
                  ? 'bg-[#92400e] text-white shadow-lg shadow-[#92400e]/25'
                  : isCurrent
                  ? 'bg-[#92400e]/10 dark:bg-[#92400e]/20 text-[#92400e] dark:text-amber-400 border border-[#92400e]/30 dark:border-amber-700/40 hover:bg-[#92400e]/20'
                  : isPast
                  ? 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 border border-stone-200 dark:border-zinc-700 hover:bg-stone-200 dark:hover:bg-zinc-700'
                  : 'bg-stone-50 dark:bg-zinc-900 text-stone-400 dark:text-zinc-600 border border-stone-100 dark:border-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-800 opacity-60'
              }`}
            >
              <span>S{sem}</span>

              {/* GPA badge for past semesters */}
              {isPast && (hasStoredGPA || hasCourses) && (
                <span className={`text-[9px] font-black tracking-tight leading-none mt-0.5 ${
                  isActive ? 'text-white/80' : 'text-stone-400 dark:text-zinc-500'
                }`}>
                  {hasCourses ? '●' : hasStoredGPA ? storedGPA.toFixed(2) : '—'}
                </span>
              )}

              {/* "Now" label for current */}
              {isCurrent && !isActive && (
                <span className="text-[8px] font-black text-[#92400e]/60 dark:text-amber-600/70 uppercase tracking-wider leading-none mt-0.5">
                  NOW
                </span>
              )}
              {isCurrent && isActive && (
                <span className="text-[8px] font-black text-white/70 uppercase tracking-wider leading-none mt-0.5">
                  NOW
                </span>
              )}

              {/* Active indicator pip */}
              {isActive && (
                <motion.div
                  layoutId="activeTabPip"
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#92400e]"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
