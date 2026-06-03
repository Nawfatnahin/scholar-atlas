# Scholar Atlas Auto-Memory & Learnings

This file captures verified architectural decisions, hard-won debugging insights, and operational conventions learned during our engineering sessions.

## 1. Frontend & UX Optimizations
- **Skeleton Loaders**: Always utilize `src/components/ui/Skeleton.tsx` when configuring Next.js `loading.tsx` routes. Major feature pages (Main Dashboard, Attendance Tracker, Task Board, and CGPA Manager) now have dedicated loading states to prevent layout shifts during async fetches.

## 2. Server Deployment & OpenNext (Cloudflare Workers)
- **Deployment Build Cache**: Deployments are executed via `npm run deploy` using OpenNext. If build errors or lock collisions occur, ensure you forcefully clear the `.open-next/` cache directory before compiling.
- **Service Bindings**: Self-reference service bindings are configured in `wrangler.jsonc` (naming must match `scholar-atlas` to support regional caching).
- **Environment Variables**: Never hardcode credentials. Next.js configurations (`next.config.js`) must dynamically resolve process environment values (like `NEXT_PUBLIC_SUPABASE_URL`) to prevent credential leakage.

## 3. Supabase & Database Architecture
- **Row-Level Security (RLS) Optimization**:
  - **Indexing**: All columns involved in RLS filter conditions (especially foreign keys like `user_id` or `subject_id`) MUST be explicitly indexed to prevent costly sequential scans.
  - **Function Wrapping**: Optimize RLS policy calculations by wrapping database functions in subqueries, e.g., `(SELECT auth.uid())` instead of raw `auth.uid()`, to allow the query planner to cache the result as a constant.
- **Upsert Constraints**: The table `public.attendance_records` requires a strict unique key constraint on `(subject_id, class_date)` to enable secure application-level upserts and avoid duplicate logs.

## 4. Chat & Operations Continuity
- **Rolling 7-Day History**: Keep a high-density, rolling 7-day chronological daily summary format inside `C:\Users\ASUS\.gemini\CLI_HISTORY.md`, dynamically purging granular console logs older than 7 days to maintain peak context efficiency.

## 5. Web Crawling & AI Crawler Exclusions
- **AI Crawler Controls**: Implemented a dynamic `src/app/robots.ts` configuration to restrict scraping.
  - **Allowed AI/Search Agents**: Explicitly allowed reputable AI agents (`ClaudeBot`, `Claude-Web`, `GPTBot`, `OAI-SearchBot`, `PerplexityBot`, `Googlebot`, `Applebot`, `Applebot-Extended`) to visit and index public content to drive traffic.
  - **Disallowed AI Scrapers**: Strictly blocked raw training collectors and bandwidth leeches (`CCBot`, `Bytespider`, `Amazonbot`, `FacebookBot`, `Cohere-ai`, `Diffbot`, `Omegabot`, `ImagesiftBot`).
  - **General Exclusions**: Excluded standard bots from accessing private paths (`/api/`, `/dashboard/`, `/auth/`).

## 6. Operational Synchronization Rules
- **Deployment & Source Control Sync**: Deployment to Cloudflare and pushing to Git must only be executed for tasks that specifically modify the Scholar Atlas website, and only when explicitly instructed by Sir. Avoid auto-deploying or pushing for general system modifications, vocal tweaks, or other tasks.

## 7. About Section & Styling Redesign
- **WANDER.ph Grid Architecture**: Redesigned the main About section into a custom 2-column layout. The left column contains direct developer stack information and client-side metrics, while the right column houses a stacked three-card grid detailing the simulator, attendance tracker, and PDF tool.
- **Theme Color Safety**: Ensured card colors dynamically resolve correctly for both light theme and dark mode (using Next.js standard theme variables and tailwind overrides).

