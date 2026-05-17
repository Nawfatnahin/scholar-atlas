'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, AlertTriangle } from 'lucide-react';
import { calculateStats, Subject, AttendanceRecord } from '@/lib/attendance/calculator';

interface WhatIfSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject;
  records: AttendanceRecord[];
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  isOpen,
  onClose,
  subject,
  records,
}) => {
  const [additionalAbsences, setAdditionalAbsences] = useState(0);

  const simulationResults = useMemo(() => {
    const results = [];
    for (let i = 0; i <= 10; i++) {
      const hypotheticalRecords: AttendanceRecord[] = [
        ...records,
        ...Array(i).fill({ absence_type: 'unexcused', class_date: 'hypothetical' })
      ];
      const stats = calculateStats(subject, hypotheticalRecords);
      results.push({
        skips: i,
        percentage: stats.currentPercentage,
        status: stats.healthStatus,
        skipsLeft: stats.safeSkipsLeft,
        classesNeeded: stats.classesNeededToRecover
      });
    }
    return results;
  }, [subject, records]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-zinc-900 shadow-2xl z-[70] overflow-y-auto"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                  What-If Simulator
                </h3>
                <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                  <X className="w-6 h-6 text-zinc-400" />
                </button>
              </div>

              <div className="space-y-8">
                <div>
                  <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">
                    Additional absences in {subject.name}
                  </p>
                  <div className="space-y-6">
                    <input 
                      type="range" 
                      min="0" 
                      max="10" 
                      value={additionalAbsences}
                      onChange={(e) => setAdditionalAbsences(parseInt(e.target.value))}
                      className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <div className="flex justify-between text-xs font-black text-zinc-400 uppercase tracking-widest">
                      <span>0 more</span>
                      <span className="text-cyan-500 text-lg">{additionalAbsences}</span>
                      <span>10 more</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Projection Table</p>
                  <div className="rounded-3xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                    {simulationResults.map((res) => (
                      <div 
                        key={res.skips}
                        className={`flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0 ${
                          res.skips === additionalAbsences ? 'bg-cyan-50 dark:bg-cyan-900/10' : ''
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-black text-zinc-400 w-12">+{res.skips}</span>
                          <span className={`text-sm font-bold ${
                            res.status === 'danger' || res.status === 'unreachable' ? 'text-red-500' : 'text-zinc-900 dark:text-zinc-100'
                          }`}>
                            {res.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {res.status === 'safe' && <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">✅ Safe</span>}
                          {res.status === 'caution' && <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">🟡 Caution</span>}
                          {res.status === 'danger' && <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">🔴 Danger</span>}
                          {res.status === 'unreachable' && <span className="text-[10px] font-black text-red-900 uppercase tracking-widest">🚫 Unreachable</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {additionalAbsences > 0 && simulationResults[additionalAbsences].classesNeeded && (
                  <div className="p-6 rounded-[32px] bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-start gap-4">
                    <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                      To recover from skipping <span className="font-bold text-zinc-900 dark:text-zinc-100">{additionalAbsences}</span> more classes, you would need to attend <span className="font-bold text-cyan-500">{simulationResults[additionalAbsences].classesNeeded}</span> consecutive classes without missing any.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
