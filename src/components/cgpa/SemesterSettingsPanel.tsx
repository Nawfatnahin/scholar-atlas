'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings2, Save, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { saveSemesterSetup, resetSemesterSetup } from '@/app/dashboard/cgpa/actions';
import type { SemesterSetup } from '@/lib/cgpa/cgpa-types';

interface SemesterSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  setup: SemesterSetup;
  onUpdate: (updated: SemesterSetup) => void;
  onReset: () => void;
}

export function SemesterSettingsPanel({
  isOpen,
  onClose,
  setup,
  onUpdate,
  onReset,
}: SemesterSettingsPanelProps) {
  const [totalSemesters, setTotalSemesters] = useState(setup.total_semesters);
  const [currentSemester, setCurrentSemester] = useState(setup.current_semester);
  const [gpas, setGPAs] = useState<Record<string, string>>(
    Object.fromEntries(
      Object.entries(setup.previous_gpas).map(([k, v]) => [k, String(v)])
    )
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSave = async () => {
    if (currentSemester > totalSemesters) {
      toast.error('Current semester cannot exceed total semesters, Sir.');
      return;
    }
    setIsSaving(true);
    try {
      const cleanGPAs: Record<string, number> = {};
      Object.entries(gpas).forEach(([k, v]) => {
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
        toast.success('Semester settings updated, Sir.');
        onUpdate({ ...setup, total_semesters: totalSemesters, current_semester: currentSemester, previous_gpas: cleanGPAs });
        onClose();
      } else {
        toast.error(`Failed: ${res.error}`);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const res = await resetSemesterSetup();
      if (res.success) {
        toast.success('Manager reset. Starting fresh, Sir.');
        onReset();
        onClose();
      } else {
        toast.error(`Failed: ${res.error}`);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsResetting(false);
      setShowResetConfirm(false);
    }
  };

  const prevSemesters = Array.from({ length: Math.max(0, currentSemester - 1) }, (_, i) => i + 1);

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="relative w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-[36px] sm:rounded-[36px] shadow-[0_-20px_60px_rgba(0,0,0,0.12)] dark:shadow-[0_-20px_60px_rgba(0,0,0,0.7)] overflow-hidden border border-stone-200 dark:border-zinc-700/60 max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-stone-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#92400e]/10 dark:bg-[#92400e]/20 flex items-center justify-center">
                  <Settings2 className="w-4.5 h-4.5 text-[#92400e] dark:text-amber-500" />
                </div>
                <h3 className="text-base font-black text-stone-900 dark:text-white">Semester Settings</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-7 space-y-6">
              {/* Degree Structure */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest">Degree Structure</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500 dark:text-zinc-400">Total Semesters</label>
                    <input
                      type="number"
                      value={totalSemesters}
                      onChange={e => setTotalSemesters(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-black text-lg text-center text-stone-900 dark:text-white outline-none focus:border-[#92400e] dark:focus:border-amber-600 transition-all"
                      min={1} max={20}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500 dark:text-zinc-400">Current Semester</label>
                    <input
                      type="number"
                      value={currentSemester}
                      onChange={e => setCurrentSemester(Math.max(1, Math.min(totalSemesters, parseInt(e.target.value) || 1)))}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-black text-lg text-center text-stone-900 dark:text-white outline-none focus:border-[#92400e] dark:focus:border-amber-600 transition-all"
                      min={1} max={totalSemesters}
                    />
                  </div>
                </div>
              </div>

              {/* Previous GPAs */}
              {prevSemesters.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest">Previous Semester GPAs</h4>
                  <div className="space-y-2.5">
                    {prevSemesters.map(sem => (
                      <div key={sem} className="flex items-center gap-3">
                        <div className="w-14 h-10 rounded-xl bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
                          <span className="text-xs font-black text-stone-500 dark:text-zinc-400">S{sem}</span>
                        </div>
                        <input
                          type="number"
                          placeholder="e.g. 3.75 — leave blank to skip"
                          value={gpas[String(sem)] || ''}
                          onChange={e => setGPAs(prev => ({ ...prev, [String(sem)]: e.target.value }))}
                          className="flex-1 px-4 py-2.5 rounded-xl border-2 border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-bold text-sm text-stone-900 dark:text-white outline-none focus:border-[#92400e] dark:focus:border-amber-600 transition-all placeholder:text-stone-300 dark:placeholder:text-zinc-600"
                          min={0} max={4} step={0.01}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reset Section */}
              <div className="pt-2 border-t border-stone-100 dark:border-zinc-800">
                <h4 className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-3">Danger Zone</h4>

                {!showResetConfirm ? (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-950/50 transition-all"
                  >
                    <Trash2 className="w-4 h-4" /> Reset Setup
                  </button>
                ) : (
                  <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      <p className="text-sm font-bold text-red-700 dark:text-red-400">
                        This will wipe all semester setup data. Your course cards will remain, but semester configuration will be lost. Are you sure, Sir?
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleReset}
                        disabled={isResetting}
                        className="flex-1 py-2.5 rounded-xl text-sm font-black text-white bg-red-600 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isResetting ? 'Resetting...' : 'Yes, Reset'}
                      </button>
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-stone-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 hover:bg-stone-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-7 py-5 border-t border-stone-100 dark:border-zinc-800 bg-stone-50/80 dark:bg-zinc-900/80">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#92400e] text-white font-black text-sm hover:bg-[#78350f] transition-all active:scale-95 shadow-lg shadow-[#92400e]/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(content, document.body);
}
