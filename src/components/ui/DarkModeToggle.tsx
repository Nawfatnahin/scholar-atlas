"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setHydrated] = useState(false);

  useEffect(() => {
    // Sync with the actual state applied by the no-flash script
    setIsDark(document.documentElement.classList.contains("dark"));
    setHydrated(true);
  }, []);

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);

    // 1. Temporarily suppress transitions during state sync
    document.documentElement.classList.add("no-transition");

    // 2. Flip the class
    if (nextIsDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("scholar-atlas-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("scholar-atlas-theme", "light");
    }

    // 3. Remove suppressor after 1 frame
    requestAnimationFrame(() => {
      document.documentElement.classList.remove("no-transition");
    });
  };

  // Prevent hydration mismatch by rendering a placeholder of the same dimensions
  if (!mounted) {
    return <div className="w-[52px] h-[28px]" aria-hidden="true" />;
  }

  return (
    <button
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleTheme}
      className={`
        relative w-[52px] h-[28px] rounded-full border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent/50
        ${isDark 
          ? "bg-[#3B4080] border-white/15" 
          : "bg-[#E8E9EC] border-black/10"}
      `}
    >
      <div
        className={`
          absolute top-[3px] w-[20px] h-[20px] rounded-full flex items-center justify-center shadow-md transition-transform duration-[220ms]
          ${isDark 
            ? "translate-x-[26px] bg-[#E8EAF0]" 
            : "translate-x-[4px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.18)]"}
        `}
        style={{
          transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)"
        }}
      >
        {isDark ? (
          <Moon size={11} className="text-[#6B7FD4] fill-[#6B7FD4]" />
        ) : (
          <Sun size={11} className="text-[#F59E0B] fill-[#F59E0B]" />
        )}
      </div>
    </button>
  );
}
