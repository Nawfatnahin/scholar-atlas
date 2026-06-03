# Scholar Atlas Developer Reference

## Deployment Architecture & CI/CD
- **Platform**: Cloudflare Workers (Next.js using `@opennextjs/cloudflare`).
- **Main Script**: `npm run deploy` (builds Next.js via OpenNext and deploys the resulting worker/assets via Wrangler).
- **CI/CD Workflow**: Pushing to the `main` branch triggers `.github/workflows/deploy.yml` which automates the build and deployment.
  - **Runner Node.js Requirement**: The GitHub Actions runner MUST be configured with **Node.js v22** or higher (Wrangler v4 requirements).
  - **Wrangler Token Requirements**: The GitHub Secret `CLOUDFLARE_API_TOKEN` must be a Cloudflare API Token with Workers permissions:
    - `Account -> Workers Scripts -> Edit`
    - `Account -> Workers KV Storage -> Edit`
    - `User -> User Details -> Read`
    - `User -> Memberships -> Read`
  - **Manual Trigger**: The workflow is configured with `workflow_dispatch` so it can be run manually via the GitHub CLI or web UI.

## Database Schema (Supabase)
- **Primary References**:
  - `supabase/migrations/20260517001_attendance_upgrade.sql` is the core migration file.
  - `setup_db.sql` (aligned with the active schema) is the unified database setup.
- **Key Tables**:
  - `public.subjects`: Contains required fields `required_threshold` (Numeric), `personal_target` (Numeric), `total_classes_planned` (Integer), `semester_start_date` (Date), and `schedule_days` (Text[]).
  - `public.attendance_records`: Contains attendance entries. Requires a unique constraint `UNIQUE (subject_id, class_date)` to enable the application's `upsert` queries on attendance status.
  - `public.holidays`: Contains scope ('global' | 'subject') and corresponding subject reference.

## Project Guidelines & Patterns
- **Attestation Calculations**: Consolidated calculations to unify around personal targets by updating inputs to assign the same value to both `required_threshold` and `personal_target` upon creation, maintaining full backwards compatibility.
- **Database Operations**: Use the `createClient` utility from `@/lib/supabase/server` for database transactions. Always enforce Row Level Security (RLS) on new tables.

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
| ------ | ---------- |
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.
