'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, GraduationCap, BookOpen, AlertTriangle, ArrowRight } from 'lucide-react';

interface CGPASummaryCardProps {
  currentSemesterGPA: number;
  overallCGPA: number;
  totalCreditsCompleted: number;
  targetCGPA: number;
  currentSemester: number;
  totalSemesters: number;
  missingGPASemesters: number[];
  onFillMissingGPA: () => void;
}

export function CGPASummaryCard({
  currentSemesterGPA,
  overallCGPA,
  totalCreditsCompleted,
  targetCGPA,
  currentSemester,
  totalSemesters,
  missingGPASemesters,
  onFillMissingGPA,
}: CGPASummaryCardProps) {
  const isOnTrack = overallCGPA >= targetCGPA;
  const remainingSemesters = totalSemesters - currentSemester;

  // Calculate required avg GPA for remaining semesters
  let feedbackLine = '';
  if (remainingSemesters > 0 && !isOnTrack) {
    // Using equal-weight-per-semester model
    const semestersAccountedFor = currentSemester; // semesters done (including current approximation)
    const cgpaDeficit = (targetCGPA * totalSemesters) - (overallCGPA * semestersAccountedFor);
    const requiredAvg = cgpaDeficit / remainingSemesters;
    if (requiredAvg > 4.0) {
      feedbackLine = `Target unreachable at current pace`;
    } else if (requiredAvg <= 0) {
      feedbackLine = 'On track ✓';
    } else {
      feedbackLine = `Need ${requiredAvg.toFixed(2)} avg GPA in remaining ${remainingSemesters} semester${remainingSemesters > 1 ? 's' : ''} to hit target`;
    }
  } else if (isOnTrack) {
    feedbackLine = 'On track ✓';
  } else {
    feedbackLine = 'Last semester — give it everything!';
  }

  return (
    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[28px] border border-stone-200 dark:border-zinc-700/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone-100 dark:border-zinc-800 bg-stone-50/80 dark:bg-zinc-800/50">
        <h4 className="text-xs font-black text-[#92400e] dark:text-amber-500 uppercase tracking-[0.3em]">
          Semester Summary
        </h4>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 divide-x divide-stone-100 dark:divide-zinc-800">
        {/* Current Semester GPA */}
        <div className="p-5">
          <p className="text-[9px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 leading-tight">
            Sem. {currentSemester} GPA
          </p>
          <motion.p
            key={currentSemesterGPA}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-3xl font-black tracking-tighter ${
              currentSemesterGPA >= targetCGPA
                ? 'text-emerald-600 dark:text-emerald-400'
                : currentSemesterGPA > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-stone-400 dark:text-zinc-500'
            }`}
          >
            {currentSemesterGPA > 0 ? currentSemesterGPA.toFixed(2) : '—'}
          </motion.p>
          <p className="text-[9px] text-stone-400 dark:text-zinc-600 font-medium mt-1">current semester</p>
        </div>

        {/* Overall CGPA */}
        <div className="p-5">
          <p className="text-[9px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 leading-tight">
            Overall CGPA
          </p>
          <motion.p
            key={overallCGPA}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-3xl font-black tracking-tighter ${
              overallCGPA >= targetCGPA
                ? 'text-emerald-600 dark:text-emerald-400'
                : overallCGPA > 0
                ? 'text-[#92400e] dark:text-amber-400'
                : 'text-stone-400 dark:text-zinc-500'
            }`}
          >
            {overallCGPA > 0 ? overallCGPA.toFixed(2) : '—'}
          </motion.p>
          <p className="text-[9px] text-stone-400 dark:text-zinc-600 font-medium mt-1">
            target: {targetCGPA.toFixed(2)}
          </p>
        </div>

        {/* Credits */}
        <div className="p-5">
          <p className="text-[9px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 leading-tight">
            Credits Done
          </p>
          <motion.p
            key={totalCreditsCompleted}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-black tracking-tighter text-stone-700 dark:text-zinc-200"
          >
            {totalCreditsCompleted > 0 ? totalCreditsCompleted : '—'}
          </motion.p>
          <p className="text-[9px] text-stone-400 dark:text-zinc-600 font-medium mt-1">credit hours</p>
        </div>
      </div>

      {/* Target Feedback */}
      <div className={`px-6 py-3.5 flex items-center gap-3 border-t ${
        isOnTrack
          ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40'
          : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40'
      }`}>
        {isOnTrack ? (
          <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        ) : (
          <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
        )}
        <p className={`text-xs font-bold ${
          isOnTrack ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
        }`}>
          {feedbackLine}
        </p>
      </div>

      {/* Missing GPA Warning */}
      {missingGPASemesters.length > 0 && (
        <div className="px-6 py-3.5 bg-amber-50/60 dark:bg-amber-950/20 border-t border-amber-100 dark:border-amber-900/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              GPA missing for Semester{missingGPASemesters.length > 1 ? 's' : ''}{' '}
              <span className="font-black">{missingGPASemesters.map(s => `S${s}`).join(', ')}</span>
              {' '}— CGPA may be inaccurate
            </p>
          </div>
          <button
            onClick={onFillMissingGPA}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors shrink-0 whitespace-nowrap"
          >
            Fill in <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
