'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, XCircle, AlertCircle } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  level: 'warning' | 'critical' | 'fatal';
  subjectName: string;
  currentPct: number;
  projectedPct?: number;
  threshold: number;
  remaining?: number;
  maxPct?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  level,
  subjectName,
  currentPct,
  projectedPct,
  threshold,
  remaining,
  maxPct,
  onConfirm,
  onCancel,
}) => {
  const [understanding, setUnderstanding] = useState('');

  if (!isOpen) return null;

  const isCritical = level === 'critical';
  const isFatal = level === 'fatal';
  const canConfirm = !isCritical || understanding.toLowerCase() === 'i understand';

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={overlayVariants}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={!isFatal ? onCancel : undefined}
          />
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            className={`relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900 ${
              isFatal ? 'border-2 border-red-900' : ''
            }`}
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                {isCritical ? (
                  <XCircle className="h-8 w-8 text-red-600" />
                ) : isFatal ? (
                  <XCircle className="h-8 w-8 text-red-900" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                )}
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {subjectName}
                </h3>
              </div>

              <div className="mb-6">
                <div className="text-4xl font-black mb-2 text-zinc-900 dark:text-zinc-100">
                  {currentPct.toFixed(1)}%
                </div>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {level === 'warning' && (
                    `You only have 2 absences left in ${subjectName}. Your current attendance is ${currentPct.toFixed(1)}%. Be careful.`
                  )}
                  {level === 'critical' && (
                    `⚠️ Final warning — This is your LAST allowed absence in ${subjectName}. If you miss this class, you will fall to ${projectedPct?.toFixed(1)}%, which is below the ${threshold}% requirement.`
                  )}
                  {level === 'fatal' && (
                    `🚫 ${subjectName} is no longer recoverable. Even if you attend every remaining class (${remaining} left), your maximum possible attendance is ${maxPct?.toFixed(1)}%. Speak to your academic advisor.`
                  )}
                </p>
              </div>

              {isCritical && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                    Type "I understand" to confirm
                  </label>
                  <input
                    type="text"
                    value={understanding}
                    onChange={(e) => setUnderstanding(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    placeholder="I understand"
                  />
                </div>
              )}

              {!isFatal && (
                <div className="flex gap-3">
                  <button
                    onClick={onCancel}
                    className="flex-1 px-4 py-2 rounded-xl font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={!canConfirm}
                    className={`flex-1 px-4 py-2 rounded-xl font-bold transition-all ${
                      canConfirm
                        ? isCritical
                          ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/20'
                          : 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    {isCritical ? 'Confirm Absence' : 'Got it'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
