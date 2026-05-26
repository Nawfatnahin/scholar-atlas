"use client";

import React, { useEffect, useState } from "react";
import { X, ShieldAlert, Sparkles, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

interface LimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  limit?: number;
}

export function LimitModal({ isOpen, onClose, limit = 5 }: LimitModalProps) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return `${hours}h ${minutes}m ${seconds}s`;
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Escape key listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-stone-950/40 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-[500px] bg-white dark:bg-bg-elevated rounded-[40px] shadow-[0_30px_70px_rgba(0,0,0,0.15)] border border-stone-200/80 dark:border-border-strong/50 overflow-hidden transform transition-all duration-300 scale-100 flex flex-col p-8 sm:p-10 animate-in fade-in-50 zoom-in-95 duration-200">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 blur-[50px] rounded-full -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/5 blur-[50px] rounded-full -ml-16 -mb-16 pointer-events-none" />
        
        {/* Top Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-bg-surface transition-all active:scale-95 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center mt-4">
          
          {/* Warning Icon Badge */}
          <div className="w-20 h-20 rounded-[28px] bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 flex items-center justify-center mb-8 relative group">
            <ShieldAlert className="w-10 h-10 text-amber-600 dark:text-amber-500 animate-pulse" />
            <div className="absolute inset-0 rounded-[28px] bg-amber-500/10 scale-95 opacity-0 group-hover:scale-110 group-hover:opacity-100 transition-all duration-300 pointer-events-none" />
          </div>

          <h3 className="font-display font-black text-3xl text-ink dark:text-white tracking-tight mb-3">
            Daily Limit Reached
          </h3>
          
          <p className="text-stone-600 dark:text-text-secondary text-[16px] leading-[1.6] font-medium max-w-[380px] mb-8">
            You have reached your free daily allocation of <span className="text-amber-700 dark:text-amber-500 font-bold">{limit} actions</span> in this toolkit.
          </p>


          {/* Reset Timer Box */}
          <div className="w-full bg-stone-50 dark:bg-bg-surface/50 border border-stone-200/60 dark:border-border-subtle rounded-3xl p-5 mb-8 flex flex-col items-center justify-center gap-2">
            <span className="text-[10px] font-black text-stone-400 dark:text-text-tertiary uppercase tracking-widest flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              Resets Tomorrow in
            </span>
            <span className="text-2xl font-black text-ink dark:text-white font-mono tracking-wider tabular-nums">
              {timeLeft}
            </span>
          </div>

          {/* CTAs */}
          <div className="w-full flex flex-col gap-4">
            <Link
              href="/signup"
              onClick={onClose}
              className="group relative w-full flex items-center justify-center gap-3 px-8 py-4 rounded-[20px] bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_8px_20px_rgba(245,158,11,0.2)] hover:shadow-[0_12px_28px_rgba(245,158,11,0.3)] hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-white drop-shadow-md" />
              <span>Get Unlimited Pro Access</span>
              <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1.5 transition-transform" />
            </Link>

            <button
              onClick={onClose}
              className="w-full py-3.5 text-xs font-bold text-stone-500 hover:text-stone-700 dark:text-text-tertiary dark:hover:text-white transition-colors"
            >
              Close and wait for tomorrow
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
