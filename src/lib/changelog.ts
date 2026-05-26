export type ChangeType = 'NEW' | 'IMPROVED' | 'FIXED' | 'REMOVED';

export interface ChangeEntry {
  type: ChangeType;
  description: string;
}

export interface VersionEntry {
  version: string;
  date: string;        // ISO format: "YYYY-MM-DD"
  summary: string;     // one-line description of this release
  changes: ChangeEntry[];
}

export const CHANGELOG: VersionEntry[] = [
  {
    version: "1.1.0",
    date: "2026-05-27",
    summary: "Extra Classes logging in Attendance and popup aligned improvements",
    changes: [
      { type: "NEW", description: "Added capability to log and delete extra class sessions in the Attendance Tracker, automatically recalculating all stats dynamically" },
      { type: "FIXED", description: "Corrected theme defaults so that shared links or new visits always open in light mode by default, respecting manual toggles" },
      { type: "FIXED", description: "Aligned the instruction popups in the Attendance and Task pages to present only features currently fully operational in the tool" },
    ],
  },
  {
    version: "1.0.3",
    date: "2026-05-25",
    summary: "Premium Instagram-inspired dark theme redesign",
    changes: [
      { type: "NEW", description: "Bespoke premium Instagram-inspired dark theme redesign with signature gradient accenting and neon glows" },
      { type: "IMPROVED", description: "Upgraded all feature and info cards to 3D glassmorphism panels with custom gradient borders and hover depth lifting" },
      { type: "IMPROVED", description: "Standardized server-side rendering mode for seamless integration with Cloudflare Workers environment" },
    ],
  },
  {
    version: "1.0.2",
    date: "2026-05-22",
    summary: "Dashboard visual overhaul, theme contrast restoration, and deployment fixes",
    changes: [
      { type: "IMPROVED", description: "Redesigned Semester Progress Widget with modern 3D depth details, floating cards, and pulsing radial halo alerts" },
      { type: "IMPROVED", description: "Restored clean solid white background contrast to all dashboard quadrants to pop off the cream background base" },
      { type: "IMPROVED", description: "Upgraded onboarding steps and dashboard category cards to solid white 3D boxes for great visibility against the cream base background" },
      { type: "IMPROVED", description: "Upgraded card loading skeleton loaders into pulsing glass placeholders" },
    ],
  },
  {
    version: "1.0.1",
    date: "2026-05-24",
    summary: "High-fidelity Dark Mode system and UI refinements",
    changes: [
      { type: "NEW", description: "Comprehensive Dark Mode system with no-flash script" },
      { type: "NEW", description: "Bespoke, animated DarkModeToggle component" },
      { type: "IMPROVED", description: "Surgical color refactoring across all modules for theme compliance" },
      { type: "IMPROVED", description: "Refined About page aesthetics with high-fidelity design" },
      { type: "IMPROVED", description: "Some UI adjustment" },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-05-03",
    summary: "Initial public release of Scholar Atlas",
    changes: [
      { type: "NEW", description: "Attendance Tracker with threshold warnings" },
      { type: "NEW", description: "Task Management Kanban board" },
      { type: "NEW", description: "CGPA Manager with target forecasting" },
      { type: "NEW", description: "PDF Tools: merge, split, convert" },
      { type: "NEW", description: "Semester Progress Widget on dashboard" },
      { type: "NEW", description: "About page with version history" },
      { type: "NEW", description: "Complete rebranding to Scholar Atlas" },
    ],
  },
];
