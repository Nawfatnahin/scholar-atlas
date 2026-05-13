"use client";

import React, { useState } from 'react';
import { User, Users, UserCircle, Contact, UserRound } from "lucide-react";

export default function SocialProof() {
  const [isPaused, setIsPaused] = useState(false);

  const icons = [
    { icon: User, bg: "bg-emerald-500", glow: "shadow-emerald-500/30" },
    { icon: Users, bg: "bg-blue-500", glow: "shadow-blue-500/30" },
    { icon: UserCircle, bg: "bg-violet-500", glow: "shadow-violet-500/30" },
    { icon: Contact, bg: "bg-amber-500", glow: "shadow-amber-500/30" },
    { icon: UserRound, bg: "bg-rose-500", glow: "shadow-rose-500/30" },
  ];

  const content = (
    <div className="flex items-center gap-6 sm:gap-8 px-4 whitespace-nowrap">
      <div className="flex -space-x-2">
        {icons.map((item, i) => (
          <div 
            key={i} 
            className={`w-8 h-8 rounded-full ${item.bg} text-white flex items-center justify-center border-2 border-white shadow-lg ${item.glow}`}
          >
            <item.icon className="w-3.5 h-3.5" />
          </div>
        ))}
      </div>
      <p className="text-[14px] sm:text-[15px] font-bold text-ink-2 tracking-tight">
        Trusted by <span className="text-ink font-black">100+ students</span> already mastering their academic journey.
      </p>
      <div className="w-1.5 h-1.5 rounded-full bg-border-strong/40 mx-4" />
    </div>
  );

  return (
    <div className="relative py-4 overflow-hidden my-4">
      {/* Semi-Transparent Glass Background with Blue Neon Glow */}
      <div 
        onClick={() => setIsPaused(!isPaused)}
        className="relative py-4 bg-white/30 backdrop-blur-md border-y border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] cursor-pointer select-none"
      >
        {/* Edge Fades */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-bg via-bg/40 to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-bg via-bg/40 to-transparent z-10" />

        <div 
          className="flex w-fit animate-marquee"
          style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
        >
          {content}
          {content}
          {content}
          {content}
          {content}
          {content}
        </div>
      </div>
    </div>
  );
}
