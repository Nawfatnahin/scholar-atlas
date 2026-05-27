'use client';

import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, GraduationCap, ChevronRight, ChevronLeft,
  Layers, CheckCircle2, SkipForward, BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { saveSemesterSetup } from '@/app/dashboard/cgpa/actions';
import type { SemesterSetup } from '@/lib/cgpa/cgpa-types';

interface InitManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (setup: SemesterSetup) => void;
}

const SLIDE_VARIANTS = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export function InitManagerModal({ isOpen, onClose, onComplete }: InitManagerModalProps) {
  const [step, setStep] = useState(0); // 0=semesters, 1=current, 2=prevGPAs, 3=summary
  const [dir, setDir] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const [totalSemesters, setTotalSemesters] = useState<number>(8);
  const [currentSemester, setCurrentSemester] = useState<number | null>(null);
  const [prevGPAs, setPrevGPAs] = useState<Record<string, string>>({}); // string values for inputs

  const goNext = (nextStep: number) => { setDir(1); setStep(nextStep); };
  const goBack = (prevStep: number) => { setDir(-1); setStep(prevStep); };

  const handleSemChipClick = (sem: number) => {
    setCurrentSemester(sem);
    // Pre-fill keys for previous GPA fields
    const newGPAs: Record<string, string> = {};
    for (let i = 1; i < sem; i++) newGPAs[String(i)] = prevGPAs[String(i)] || '';
    setPrevGPAs(newGPAs);
  };

  const handleStartTracking = async () => {
    if (!currentSemester) return;
    setIsSaving(true);
    try {
      // Convert string GPA inputs to numbers (skip empties)
      const cleanGPAs: Record<string, number> = {};
      Object.entries(prevGPAs).forEach(([k, v]) => {
        const n = parseFloat(v);
        if (!isNaN(n) && n >= 0 && n <= 4.0) cleanGPAs[k] = n;
      });

      const res = await saveSemesterSetup({
        total_semesters: totalSemesters,
        current_semester: currentSemester,
        previous_gpas: cleanGPAs,
        initialized: true,
      });

      if (res.success) {
        toast.success('Semester tracking initialized, Sir.');
        onComplete({
          id: '',
          user_id: '',
          total_semesters: totalSemesters,
          current_semester: currentSemester,
          previous_gpas: cleanGPAs,
          initialized: true,
        });
      } else {
        toast.error(`Failed: ${res.error}`);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const missingPrev = currentSemester
    ? Array.from({ length: currentSemester - 1 }, (_, i) => i + 1)
        .filter(n => !prevGPAs[String(n)] || isNaN(parseFloat(prevGPAs[String(n)])))
    : [];

  const totalSteps = currentSemester && currentSemester > 1 ? 4 : 3;
  const stepLabels = currentSemester && currentSemester > 1
    ? ['Degree Length', 'Current Semester', 'Previous GPAs', 'Summary']
    : ['Degree Length', 'Current Semester', 'Summary'];

  // Map logical steps to display (skip step 2 if sem=1)
  const logicalStep = step === 3 && !(currentSemester && currentSemester > 1) ? 2 : step;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[36px] shadow-[0_32px_80px_rgba(0,0,0,0.18)] dark:shadow-[0_32px_80px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col border border-stone-200/80 dark:border-zinc-700/60"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-7 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#92400e]/10 dark:bg-[#92400e]/20 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-[#92400e] dark:text-amber-500" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-stone-900 dark:text-white tracking-tight">Initialize Manager</h2>
                  <p className="text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest">
                    {stepLabels[step]} · Step {step + 1} of {totalSteps}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-2 px-8 pb-5">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step
                      ? 'bg-[#92400e] w-8'
                      : i < step
                      ? 'bg-[#92400e]/40 dark:bg-amber-700/50 w-4'
                      : 'bg-stone-200 dark:bg-zinc-700 w-4'
                  }`}
                />
              ))}
            </div>

            {/* Step Content */}
            <div className="flex-1 overflow-hidden px-8 pb-4 min-h-[240px]">
              <AnimatePresence mode="wait" custom={dir}>
                {/* STEP 0 — Total Semesters */}
                {step === 0 && (
                  <motion.div
                    key="step0"
                    custom={dir}
                    variants={SLIDE_VARIANTS}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="space-y-6"
                  >
                    <div className="text-center pt-2">
                      <div className="w-16 h-16 rounded-3xl bg-[#92400e]/10 dark:bg-[#92400e]/20 flex items-center justify-center mx-auto mb-4">
                        <Layers className="w-8 h-8 text-[#92400e] dark:text-amber-500" />
                      </div>
                      <h3 className="text-xl font-black text-stone-900 dark:text-white mb-2">How many semesters in your degree?</h3>
                      <p className="text-sm text-stone-500 dark:text-zinc-400 font-medium">e.g. 8 for a typical 4-year programme</p>
                    </div>
                    <div className="flex items-center justify-center gap-4 pt-2">
                      <button
                        onClick={() => setTotalSemesters(n => Math.max(1, n - 1))}
                        className="w-12 h-12 rounded-2xl border-2 border-stone-200 dark:border-zinc-700 flex items-center justify-center text-2xl font-black text-stone-700 dark:text-white hover:border-[#92400e] hover:text-[#92400e] transition-all active:scale-95"
                      >−</button>
                      <div className="w-28 h-20 rounded-3xl bg-[#92400e]/8 dark:bg-[#92400e]/15 border-2 border-[#92400e]/30 dark:border-amber-700/40 flex items-center justify-center">
                        <span className="text-5xl font-black text-[#92400e] dark:text-amber-400">{totalSemesters}</span>
                      </div>
                      <button
                        onClick={() => setTotalSemesters(n => Math.min(20, n + 1))}
                        className="w-12 h-12 rounded-2xl border-2 border-stone-200 dark:border-zinc-700 flex items-center justify-center text-2xl font-black text-stone-700 dark:text-white hover:border-[#92400e] hover:text-[#92400e] transition-all active:scale-95"
                      >+</button>
                    </div>
                    <p className="text-center text-xs text-stone-400 dark:text-zinc-500 font-medium">Or type directly:</p>
                    <input
                      type="number"
                      value={totalSemesters}
                      onChange={e => setTotalSemesters(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                      className="w-full px-5 py-3.5 rounded-2xl border-2 border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-bold text-lg text-center text-stone-900 dark:text-white outline-none focus:border-[#92400e] dark:focus:border-amber-600 transition-all"
                      min={1} max={20}
                    />
                  </motion.div>
                )}

                {/* STEP 1 — Current Semester */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    custom={dir}
                    variants={SLIDE_VARIANTS}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="space-y-5"
                  >
                    <div className="text-center pt-2">
                      <h3 className="text-xl font-black text-stone-900 dark:text-white mb-2">Which semester are you currently in?</h3>
                      <p className="text-sm text-stone-500 dark:text-zinc-400 font-medium">Tap the chip for your current semester</p>
                    </div>
                    <div className="flex flex-wrap gap-2.5 justify-center py-2">
                      {Array.from({ length: totalSemesters }, (_, i) => i + 1).map(sem => (
                        <button
                          key={sem}
                          onClick={() => handleSemChipClick(sem)}
                          className={`px-5 py-2.5 rounded-2xl font-black text-sm transition-all duration-200 active:scale-95 ${
                            currentSemester === sem
                              ? 'bg-[#92400e] text-white shadow-lg shadow-[#92400e]/30 scale-105'
                              : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 hover:bg-[#92400e]/10 dark:hover:bg-[#92400e]/20 hover:text-[#92400e] dark:hover:text-amber-400 border border-stone-200 dark:border-zinc-700'
                          }`}
                        >
                          S{sem}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* STEP 2 — Previous GPAs */}
                {step === 2 && currentSemester && currentSemester > 1 && (
                  <motion.div
                    key="step2"
                    custom={dir}
                    variants={SLIDE_VARIANTS}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="space-y-4"
                  >
                    <div className="pt-2">
                      <h3 className="text-xl font-black text-stone-900 dark:text-white mb-1">Previous semester GPAs</h3>
                      <p className="text-sm text-stone-500 dark:text-zinc-400 font-medium flex items-center gap-1.5">
                        <SkipForward className="w-3.5 h-3.5 shrink-0" />
                        Optional — you can skip and add these later
                      </p>
                    </div>
                    <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                      {Array.from({ length: currentSemester - 1 }, (_, i) => i + 1).map(sem => (
                        <div key={sem} className="flex items-center gap-3">
                          <div className="w-14 h-10 rounded-xl bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 flex items-center justify-center">
                            <span className="text-xs font-black text-stone-500 dark:text-zinc-400">S{sem}</span>
                          </div>
                          <input
                            type="number"
                            placeholder="GPA (e.g. 3.75) — optional"
                            value={prevGPAs[String(sem)] || ''}
                            onChange={e => setPrevGPAs(prev => ({ ...prev, [String(sem)]: e.target.value }))}
                            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-bold text-sm text-stone-900 dark:text-white outline-none focus:border-[#92400e] dark:focus:border-amber-600 transition-all placeholder:text-stone-300 dark:placeholder:text-zinc-600"
                            min={0} max={4} step={0.01}
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* STEP 3 — Summary */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    custom={dir}
                    variants={SLIDE_VARIANTS}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="space-y-4"
                  >
                    <div className="text-center pt-2">
                      <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="text-xl font-black text-stone-900 dark:text-white mb-2">Ready to start tracking!</h3>
                      <p className="text-sm text-stone-500 dark:text-zinc-400 font-medium">Here's a summary of your configuration</p>
                    </div>
                    <div className="rounded-2xl border border-stone-200 dark:border-zinc-700 overflow-hidden">
                      <div className="grid grid-cols-2">
                        <div className="p-4 border-r border-b border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800/60">
                          <p className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Total Semesters</p>
                          <p className="text-3xl font-black text-[#92400e] dark:text-amber-400">{totalSemesters}</p>
                        </div>
                        <div className="p-4 border-b border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800/60">
                          <p className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Current Semester</p>
                          <p className="text-3xl font-black text-[#92400e] dark:text-amber-400">S{currentSemester}</p>
                        </div>
                      </div>
                      {currentSemester && currentSemester > 1 && (
                        <div className="p-4 bg-white dark:bg-zinc-900">
                          <p className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Previous GPAs</p>
                          <div className="flex flex-wrap gap-2">
                            {Array.from({ length: currentSemester - 1 }, (_, i) => i + 1).map(sem => {
                              const gpa = prevGPAs[String(sem)];
                              const hasGPA = gpa && !isNaN(parseFloat(gpa));
                              return (
                                <div key={sem} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${hasGPA ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'}`}>
                                  S{sem}: {hasGPA ? parseFloat(gpa).toFixed(2) : '—'}
                                </div>
                              );
                            })}
                          </div>
                          {missingPrev.length > 0 && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
                              ⚠ {missingPrev.length} semester GPA{missingPrev.length > 1 ? 's' : ''} missing — you can add them later
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between px-8 py-6 border-t border-stone-100 dark:border-zinc-800 bg-stone-50/80 dark:bg-zinc-900/80 backdrop-blur-sm">
              {step > 0 ? (
                <button
                  onClick={() => {
                    if (step === 3 && currentSemester === 1) goBack(1);
                    else goBack(step - 1);
                  }}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-zinc-800 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              ) : <div />}

              {step === 0 && (
                <button
                  onClick={() => goNext(1)}
                  className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-[#92400e] text-white font-black text-sm hover:bg-[#78350f] transition-all active:scale-95 shadow-lg shadow-[#92400e]/20"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
              {step === 1 && (
                <button
                  disabled={!currentSemester}
                  onClick={() => {
                    if (!currentSemester) return;
                    if (currentSemester === 1) goNext(3);
                    else goNext(2);
                  }}
                  className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-[#92400e] text-white font-black text-sm hover:bg-[#78350f] transition-all active:scale-95 shadow-lg shadow-[#92400e]/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
              {step === 2 && (
                <button
                  onClick={() => goNext(3)}
                  className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-[#92400e] text-white font-black text-sm hover:bg-[#78350f] transition-all active:scale-95 shadow-lg shadow-[#92400e]/20"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
              {step === 3 && (
                <button
                  onClick={handleStartTracking}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-[#92400e] text-white font-black text-sm hover:bg-[#78350f] transition-all active:scale-95 shadow-xl shadow-[#92400e]/25 disabled:opacity-50"
                >
                  <BookOpen className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Start Tracking'}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(content, document.body);
}
