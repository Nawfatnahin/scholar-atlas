const fs = require('fs');

let content = fs.readFileSync('src/app/dashboard/admin/AdminPanel.tsx', 'utf8');

// The goal is to replace all the hardcoded colors:
// bg-[#F3E5AB]/70 backdrop-blur-2xl dark:bg-[#1A1A1A]/70 text-[#333333] dark:text-white
// with standard theme classes: glass-card text-text-primary rounded-[40px]
// Let's systematically replace them.

content = content.replace(/bg-\[#F3E5AB\]\/70 backdrop-blur-2xl dark:bg-\[#1A1A1A\]\/70/g, 'glass-card');
content = content.replace(/text-\[#333333\] dark:text-white/g, 'text-text-primary');

// Inner boxes like inputs/search/lists:
// bg-white/40 backdrop-blur-xl border-white/60 dark:bg-[#262626]/60 dark:border-white/10
// We can use glass-card for these too, but maybe with less rounding. They already have their own classes.
// Let's replace the hardcoded ones.
content = content.replace(/bg-white\/40 border-white\/60 backdrop-blur-xl dark:bg-\[#262626\]\/60 dark:border-white\/10/g, 'glass-card');
content = content.replace(/bg-white\/40 backdrop-blur-xl dark:bg-\[#262626\]\/60/g, 'bg-white/40 dark:bg-bg-surface backdrop-blur-xl border border-border-subtle');

// The Supreme Commander Box:
// Currently: bg-[#4169E1]/80 backdrop-blur-3xl border border-white/30 dark:bg-black/60 dark:bg-gradient-to-br dark:from-indigo-600/80 dark:via-purple-600/80 dark:to-accent/80 text-white shadow-2xl transition-colors
// Let's make it match the application's accent gradient (orange/red in dark mode, something premium in light mode).
// Wait, the globals.css defines .bg-accent and .text-accent.
// Let's replace it with a premium theme-aligned hero card.
content = content.replace(/bg-\[#4169E1\]\/80 backdrop-blur-3xl border border-white\/30 dark:bg-black\/60 dark:bg-gradient-to-br dark:from-indigo-600\/80 dark:via-purple-600\/80 dark:to-accent\/80 text-white shadow-2xl transition-colors/g, 
  'bg-gradient-to-br from-accent/90 to-accent-soft/90 backdrop-blur-3xl border border-white/20 dark:from-[#833AB4]/90 dark:via-[#FD1D1D]/90 dark:to-[#F77737]/90 text-white shadow-2xl transition-all');

// Text color inside the hero box
// text-white/90 dark:text-white/80 -> text-white/90
content = content.replace(/text-white\/90 dark:text-white\/80/g, 'text-white/90');

// Additional cleanup for `#333333` and `#1A1A1A` 
content = content.replace(/text-\[#333333\]/g, 'text-text-primary');
content = content.replace(/text-\[#555\] dark:text-gray-400/g, 'text-text-secondary');
content = content.replace(/bg-\[#1A1A1A\]\/70/g, 'bg-bg-elevated/70');
content = content.replace(/bg-\[#F3E5AB\]/g, 'bg-bg-surface');
content = content.replace(/dark:bg-\[#1A1A1A\]/g, 'dark:bg-bg-elevated');

// The Scholar System card has weird remaining colors:
content = content.replace(/bg-bg-surface dark:glass-card/g, 'glass-card');
content = content.replace(/text-text-primary dark:text-white/g, 'text-text-primary');

// Replace any leftover F3E5AB
content = content.replace(/\[#F3E5AB\]/g, 'bg-surface');

fs.writeFileSync('src/app/dashboard/admin/AdminPanel.tsx', content);
