const fs = require('fs');

let content = fs.readFileSync('src/app/dashboard/admin/AdminPanel.tsx', 'utf8');

// 1. Typography
content = content.replace(/font-serif/g, 'font-sans');
content = content.replace(/fontFamily:.*'Space Grotesk'.*,/g, '');

// 2. Glassmorphism globally
content = content.replace(/bg-\[#F3E5AB\] dark:bg-\[#1A1A1A\]/g, 'bg-[#F3E5AB]/70 backdrop-blur-2xl dark:bg-[#1A1A1A]/70');
content = content.replace(/bg-\[#4169E1\] dark:bg-gradient-to-br dark:from-indigo-600 dark:via-purple-600 dark:to-accent/g, 'bg-[#4169E1]/80 backdrop-blur-3xl border border-white/30 dark:bg-black/60 dark:bg-gradient-to-br dark:from-indigo-600/80 dark:via-purple-600/80 dark:to-accent/80');
content = content.replace(/bg-white\/50 dark:bg-\[#262626\]/g, 'bg-white/40 backdrop-blur-xl dark:bg-[#262626]/60');
content = content.replace(/border border-black\/10 dark:border-\[#333\]/g, 'border border-white/60 dark:border-white/10');

// 3. Grid Restructuring
// Master Grid for stats
content = content.replace(/<section className="grid grid-cols-1 md:grid-cols-3 gap-8">/g, '<section className="grid grid-cols-1 lg:grid-cols-4 gap-6">');

// Active Nodes
content = content.replace(/{[\s\S]*?\/\* Active Nodes \*\/}[\s\S]*?<Interactive3DBox className="group">/g, '{/* Active Nodes */}\n           <div className="group col-span-1">');
// Reverting closing tag for Active Nodes
content = content.replace(/<\/Interactive3DBox>/, '</div>');

// Supreme Commander Box
content = content.replace(/{[\s\S]*?\/\* Admin Glorification Box \*\/}[\s\S]*?<Interactive3DBox className="group">/g, '{/* Admin Glorification Box */}\n           <div className="group col-span-2">');
content = content.replace(/<\/Interactive3DBox>/, '</div>');

// Elite Sub-Nodes
content = content.replace(/{[\s\S]*?\/\* Elite Sub-Nodes \*\/}[\s\S]*?<Interactive3DBox className="group">/g, '{/* Elite Sub-Nodes */}\n           <div className="group col-span-1">');
content = content.replace(/<\/Interactive3DBox>/, '</div>');

// Remove bottom Waitlist grid wrapper and make it 4 columns
content = content.replace(/<div className="grid grid-cols-1 xl:grid-cols-2 gap-12">/g, '<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">');

// Convert Lists to use shorter heights in the grid
content = content.replace(/max-h-\[400px\]/g, 'h-[300px]');

fs.writeFileSync('src/app/dashboard/admin/AdminPanel.tsx', content);
console.log('Migration complete.');
