'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info } from 'lucide-react';

export interface InstructionOption {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

interface InstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  options: InstructionOption[];
}

export const InstructionModal: React.FC<InstructionModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  options,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-bg dark:bg-[#0a0a0a] rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh] border border-transparent dark:border-zinc-800/80 border-b-8 border-b-blue-600/10 dark:border-b-8 dark:border-b-[#0ea5e9]/30"
          >
            <div className="px-10 py-8 border-b border-border-strong dark:border-border-default/50 flex justify-between items-center bg-white/50 dark:bg-zinc-950/60 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 dark:bg-[#0ea5e9] flex items-center justify-center text-white shadow-lg shadow-blue-600/20 dark:shadow-[#0ea5e9]/30">
                  <Info className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-ink dark:text-white">{title}</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-zinc-900 rounded-xl transition-colors">
                <X className="w-6 h-6 text-ink-3 dark:text-zinc-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-white/30 dark:bg-zinc-900/10">
              {description && (
                <p className="text-lg text-ink-2 dark:text-zinc-300 font-medium leading-relaxed">
                  {description}
                </p>
              )}

              <div className="space-y-4">
                {options.map((option, index) => (
                  <div key={index} className="p-6 bg-white dark:bg-zinc-950/60 border border-border-strong dark:border-zinc-800/80 rounded-[28px] shadow-sm hover:shadow-md dark:hover:border-[#0ea5e9]/30 transition-all">
                    <div className="flex items-start gap-4">
                      {option.icon && (
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-[#0ea5e9] shrink-0 mt-1">
                          {option.icon}
                        </div>
                      )}
                      <div>
                        <h4 className="text-lg font-bold text-ink dark:text-white mb-2">{option.title}</h4>
                        <p className="text-ink-3 dark:text-zinc-400 text-sm leading-relaxed font-medium">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="px-10 py-6 border-t border-border-strong dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/60 backdrop-blur-md">
              <button
                onClick={onClose}
                className="w-full py-4 bg-ink hover:bg-ink-2 dark:bg-[#0ea5e9] dark:hover:bg-[#0284c7] text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl shadow-ink/20 dark:shadow-[#0ea5e9]/20 active:scale-[0.98]"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
};
