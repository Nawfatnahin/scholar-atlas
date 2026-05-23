# Changelog
All notable changes to Scholar Atlas are documented here.
Format: [version] — YYYY-MM-DD

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
