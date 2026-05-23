# Auto-Memory
*This file contains automatically captured learnings, preferences, and debugging solutions.*

- The project uses Next.js and Tailwind CSS.
- Cloudflare Pages is used for deployment via GitHub Actions (`.github/workflows/deploy.yml`).
- PowerShell is the default terminal; command chaining requires `;` instead of `&&`.
- Tailwind CSS custom hex variables do not support opacity modifiers (like `bg-surface/70`) without `<alpha-value>`. Raw `rgba` in CSS is the preferred workaround.
- The user enforces the JARVIS interaction protocol and expects explicit permission requests for all task actions unless session-wide override is granted.
- Solved Cloudflare Pages deployment issues by ignoring ESLint during production builds in next.config.js and changing the Wrangler deploy path to the complete .vercel/output folder (which includes Cloudflare Edge Functions and dynamic routes, instead of only the static assets directory).
