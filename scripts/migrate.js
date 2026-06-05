const fs = require('fs');

let content = fs.readFileSync('src/app/dashboard/admin/AdminPanel.tsx', 'utf8');

// 1. Typography
// Safely replace font-serif with font-sans ONLY in className strings
content = content.replace(/font-serif/g, 'font-sans');
// Safely remove inline fontFamily for Space Grotesk
content = content.replace(/fontFamily:\s*['"]Space Grotesk['"]/g, 'fontFamily: "sans-serif"');

// 2. Glassmorphism globally
content = content.replace(/bg-\[#F3E5AB\] dark:bg-\[#1A1A1A\]/g, 'bg-[#F3E5AB]/70 backdrop-blur-2xl dark:bg-[#1A1A1A]/70');
content = content.replace(/bg-\[#4169E1\] dark:bg-gradient-to-br dark:from-indigo-600 dark:via-purple-600 dark:to-accent text-white shadow-2xl transition-colors/g, 'bg-[#4169E1]/80 backdrop-blur-3xl border border-white/30 dark:bg-black/60 dark:bg-gradient-to-br dark:from-indigo-600/80 dark:via-purple-600/80 dark:to-accent/80 text-white shadow-2xl transition-colors');
content = content.replace(/bg-white\/50 border-white\/60 dark:bg-\[#262626\] dark:border-\[#333\]/g, 'bg-white/40 border-white/60 backdrop-blur-xl dark:bg-[#262626]/60 dark:border-white/10');
content = content.replace(/bg-white\/50 dark:bg-\[#262626\]/g, 'bg-white/40 backdrop-blur-xl dark:bg-[#262626]/60');

// 3. Grid Structure
content = content.replace('<section className="grid grid-cols-1 md:grid-cols-3 gap-8">', '<section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-max">');

// 4. Change 3D boxes to normal divs with grid col spans
content = content.replace('{/* Active Nodes */}\n           <Interactive3DBox className="group">', '{/* Active Nodes */}\n           <div className="col-span-1 group h-full">');
content = content.replace('{/* Admin Glorification Box */}\n           <Interactive3DBox className="group">', '{/* Admin Glorification Box */}\n           <div className="col-span-2 group h-full">');
content = content.replace('{/* Elite Sub-Nodes */}\n           <Interactive3DBox className="group">', '{/* Elite Sub-Nodes */}\n           <div className="col-span-1 group h-full">');

// Fix the closing tags for these three stats boxes manually since they might be tricky
// The exact string matching avoids the regex greedy matching bug.
content = content.replace('</div>\n           </Interactive3DBox>\n\n           {/* Admin Glorification Box */}', '</div>\n           </div>\n\n           {/* Admin Glorification Box */}');
content = content.replace('</div>\n           </Interactive3DBox>\n\n           {/* Elite Sub-Nodes */}', '</div>\n           </div>\n\n           {/* Elite Sub-Nodes */}');
content = content.replace('</div>\n           </Interactive3DBox>\n        </section>', '</div>\n           </div>\n        </section>');

// Waitlist Grid wrappers
content = content.replace('<div className="grid grid-cols-1 xl:grid-cols-2 gap-12">', '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-6">');
content = content.replace(/max-h-\[400px\]/g, 'h-[350px]');

fs.writeFileSync('src/app/dashboard/admin/AdminPanel.tsx', content);
