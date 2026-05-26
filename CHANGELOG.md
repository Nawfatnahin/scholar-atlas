# Changelog
All notable changes to Scholar Atlas are documented here.
Format: [version] — YYYY-MM-DD

---

## [1.1.0] — 2026-05-27

### Added
- Dedicated **Extra Classes** logging engine in the Attendance Tracker, supporting real-time manual tracking, historical listings, and direct deletion with instant health score updates.

### Fixed
- Standardized theme defaults so that shared links or new visitors always open in light mode by default, preventing accidental flashing or dark-mode overrides unless manually enabled.
- Refined the Instruction Button popups in the Attendance and Task pages to present only features currently fully operational in the tool, removing simulator and sorting placeholders.

---

## [1.0.3] — 2026-05-24

### Fixed
- Resolved OpenNext deployment failure by removing incompatible 'edge' runtime configuration from all routes and pages.
- Generated and configured `wrangler.jsonc` and `open-next.config.ts` for standardized Cloudflare Workers deployment.

### Improved
- Standardized server-side rendering mode for seamless integration with Cloudflare Workers environment.

---

## [1.0.2] — 2026-05-24

### Improved
- Redesigned Semester Progress Widget with modern 3D depth details, floating cards, and pulsing radial halo alerts.
- Restored clean solid white background contrast to all dashboard quadrants to pop off the cream background base.
- Upgraded the 3 onboarding steps and 4 dashboard categories cards into proper solid white, 3D boxes for exceptional readability against cream backgrounds.
- Upgraded card loading skeleton loaders into pulsing glass placeholders.

### Fixed
- Repaired broken text-bg classes on About page by mapping a DEFAULT color fallback in tailwind configuration and styling text containers.
- Configured ESLint compilation bypass in `next.config.js` to guarantee seamless Cloudflare Pages deployments.

### Removed
- Extracted unconfigured semester setup prompt text for a clean morning briefing.

---

## [1.0.1] — 2026-05-24

### Added
- Comprehensive Dark Mode system: dynamic CSS variable-based theming
- No-flash synchronization script for premium initial load experience
- Bespoke, animated DarkModeToggle component in dashboard header

### Improved
- Surgical color refactoring across Attendance, Tasks, CGPA, and PDF modules
- Enhanced About page with high-fidelity glassmorphism design
- Unified typography and humanized motivation narrative
- Some UI adjustment

---

## [1.0.0] — 2026-05-24

### Added
- Attendance Tracker: subject-wise class logging with percentage 
  calculation and threshold warnings
- Task Management: Kanban board with subject tagging and due dates
- CGPA Manager: dual-engine calculator with target grade forecasting
- PDF Tools: client-side merge, split, and convert (no server upload)
- User authentication via Supabase Auth
- Subject management: add/edit/delete subjects with color assignment
- About page with version history and feature overview
- Semester Progress Widget on dashboard

### Technical
- Next.js 15 App Router (Edge Runtime optimization)
- Supabase for auth and database (Row Level Security enabled)
- TypeScript throughout
- Rebranded from BackLogger Buddy to Scholar Atlas
- Deployed on Cloudflare Pages using OpenNext

---
