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
    version: "2.0.6",
    date: "2026-06-02",
    summary: "Implemented dynamic robots.txt crawler protection policy for search and AI scraper management",
    changes: [
      { type: "NEW", description: "Created dynamic Next.js robots.ts crawling control system to define granular scraping guidelines" },
      { type: "IMPROVED", description: "Allowed reputable AI search services (Claude, GPT, Perplexity) and standard search engines (Googlebot, Applebot) to access public links to drive search discoverability" },
      { type: "REMOVED", description: "Blocked raw model collectors and aggressive bandwidth leeches (Common Crawl CCBot, Bytespider, Amazonbot, FacebookBot, Cohere-ai) from crawling" },
      { type: "IMPROVED", description: "Secured dynamic private routes (/api, /dashboard, /auth) from standard search engine indexing" },
    ],
  },
  {
    version: "2.0.5",
    date: "2026-05-31",
    summary: "Simplified and improved dashboard Optimization Tips for enhanced user experience",
    changes: [
      { type: "IMPROVED", description: "Rewrote Optimization Tips on the dashboard in simplified, action-oriented, student-friendly language" },
      { type: "NEW", description: "Introduced a new action-oriented tip highlighting CGPA prediction feature mapping to the CGPA Manager module" },
      { type: "IMPROVED", description: "Broadened tips coverage to target all four primary modules: PDF Toolkit, Attendance Tracker, Task Board, and CGPA Manager" },
    ],
  },
  {
    version: "2.0.4",
    date: "2026-05-30",
    summary: "Integrated premium Scholar Atlas themed LoggerOS admin dashboard upper section",
    changes: [
      { type: "NEW", description: "Successfully migrated and integrated the newly designed LoggerOS control panel directly into the Next.js web application admin dashboard" },
      { type: "IMPROVED", description: "Configured real-time, reactive circular MetricRings for Edge CPU computing, DB load, and network latency status tracking" },
      { type: "IMPROVED", description: "Constructed dynamic command shell terminal output showing J.A.R.V.I.S. greeting responses synchronized with client typewriter rendering" },
      { type: "IMPROVED", description: "Implemented structured type-colored log items in the Live API Stream terminal with automatic scrolling viewport tracking" },
    ],
  },
  {
    version: "2.0.3",
    date: "2026-05-28",
    summary: "Removed PDF Tools link from mobile navigation menu",
    changes: [
      { type: "REMOVED", description: "Removed PDF Tools navigation option from the three-line mobile menu list to optimize mobile UX layout" },
    ],
  },
  {
    version: "2.0.2",
    date: "2026-05-27",
    summary: "Responsive UserBadge mobile layout and dark mode styling updates",
    changes: [
      { type: "NEW", description: "Created an elegant, space-efficient UserBadge mobile layout visible only on phone/tablet viewport widths" },
      { type: "IMPROVED", description: "Refined both mobile and desktop badges with full CSS dark mode support for perfect color contrast" },
    ],
  },
  {
    version: "2.0.1",
    date: "2026-05-27",
    summary: "Restored Dashboard SemesterProgressWidget overview counts and progress bar",
    changes: [
      { type: "FIXED", description: "Repaired the SemesterProgressWidget database query and calculations, ensuring it pulls target CGPA from cgpa_settings and calculates attendance stats from attendance_records instead of a non-existent table" },
      { type: "NEW", description: "Implemented dynamic semester start date and total weeks estimation based on earliest course start date" },
      { type: "NEW", description: "Replicated high-fidelity cumulative CGPA forecasting calculation inside the dashboard widget to sync overall CGPA accurately with the CGPA Manager page" },
    ],
  },
  {
    version: "2.0.0",
    date: "2026-05-27",
    summary: "CGPA Manager Multi-Semester Redesign & Schema Upgrade",
    changes: [
      { type: "NEW", description: "Introduced high-fidelity, multi-step InitManagerModal wizard to initialize target CGPA and set current semester tracking" },
      { type: "NEW", description: "Created horizontal SemesterTabs navigation bar to switch fluidly between academic semesters" },
      { type: "NEW", description: "Designed clean, animated DegreeProgressBar featuring premium terracotta/amber gradients and numeric progress displays" },
      { type: "NEW", description: "Developed dynamic CGPASummaryCard showing real-time CGPA, total credits, target difference, and encouraging target-based notifications" },
      { type: "NEW", description: "Added SemesterSettingsPanel for custom target overrides and full CGPA resets with visual double-confirmation" },
      { type: "NEW", description: "Reworked AutoCGPACounter to be fully semester-aware, supporting isolated semester courses and cumulative, multi-semester calculation" },
      { type: "NEW", description: "Implemented new PostgreSQL table public.cgpa_semester_setup and updated public.cgpa_courses_auto schema with RLS and index optimizations" },
      { type: "IMPROVED", description: "Optimized entire CGPA Manager with robust, professional dark mode and light mode color mapping for seamless theme toggling" },
    ],
  },
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
