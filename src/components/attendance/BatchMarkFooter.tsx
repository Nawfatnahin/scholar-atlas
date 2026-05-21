'use client';

import React from 'react';
import { Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BatchMarkFooterProps {
  isVisible: boolean;
  changeCount: number;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
}

export const BatchMarkFooter: React.FC<BatchMarkFooterProps> = ({
  isVisible,
  changeCount,
  onSave,
  onCancel,
  isPending,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4"
        >
          <div className="bg-zinc-900 border border-white/10 rounded-[30px] p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-4 pl-4">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-black">
                  {changeCount}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Session logs pending commit</p>
                  <p className="text-[10px] font-mono text-zinc-500 tracking-widest mt-0.5">Tap date tiles to cycle: Present → Absent → Medical → Excused → Cancelled</p>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={onCancel}
                  className="px-6 py-3 rounded-2xl text-sm font-black text-zinc-400 uppercase tracking-widest hover:text-red-400 transition-colors"
                >
                  Abort
                </button>
                <button
                  onClick={onSave}
                  disabled={isPending || changeCount === 0}
                  className="flex items-center gap-2 px-8 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-cyan-500/20"
                >
                  <Save className="w-4 h-4" />
                  {isPending ? 'Committing...' : 'Commit Sessions'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
