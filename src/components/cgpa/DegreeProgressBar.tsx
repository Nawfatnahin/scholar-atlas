'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface DegreeProgressBarProps {
  currentSemester: number;
  totalSemesters: number;
}

export function DegreeProgressBar({ currentSemester, totalSemesters }: DegreeProgressBarProps) {
  const percent = Math.min(100, ((currentSemester - 1) / totalSemesters) * 100);
  const remaining = totalSemesters - currentSemester + 1;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest">
          Degree Progress
        </span>
        <span className="text-[10px] font-bold text-stone-400 dark:text-zinc-500">
          {remaining} semester{remaining !== 1 ? 's' : ''} remaining
        </span>
      </div>

      {/* Track */}
      <div className="relative h-2 rounded-full bg-stone-200 dark:bg-zinc-800 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: 'linear-gradient(90deg, #92400e, #b45309, #d97706)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        />
        {/* Segment markers */}
        {Array.from({ length: totalSemesters - 1 }, (_, i) => {
          const markerPercent = ((i + 1) / totalSemesters) * 100;
          return (
            <div
              key={i}
              className="absolute top-0 h-full w-px bg-white/60 dark:bg-zinc-900/60"
              style={{ left: `${markerPercent}%` }}
            />
          );
        })}
      </div>

      {/* Semester pip labels */}
      <div className="relative" style={{ height: '14px' }}>
        {Array.from({ length: totalSemesters }, (_, i) => {
          const sem = i + 1;
          const leftPercent = ((sem - 0.5) / totalSemesters) * 100;
          return (
            <span
              key={sem}
              className={`absolute text-[8px] font-black -translate-x-1/2 transition-colors ${
                sem < currentSemester
                  ? 'text-[#92400e]/70 dark:text-amber-600/70'
                  : sem === currentSemester
                  ? 'text-[#92400e] dark:text-amber-400'
                  : 'text-stone-300 dark:text-zinc-700'
              }`}
              style={{ left: `${leftPercent}%` }}
            >
              {sem}
            </span>
          );
        })}
      </div>
    </div>
  );
}
