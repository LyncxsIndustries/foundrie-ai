# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Documentation scaffold populated for Foundrie AI.

## Current Goal

- Begin implementation from `feature-specs/02-auth.md`.

## Completed

- Copied the source methodology and context folder structure into `foundrie-ai`.
- Installed project-local Context7 skills in `.agents/skills`.
- Rewrote active context files for Foundrie AI.
- Replaced the feature-spec roadmap with Foundrie features 01-34.
- Added root `AGENTS.md`, `README.md`, and consolidated research now stored at `research/FOUNDRIE_RESEARCH.md`.
- Added root `ARTKINS_STYLE_GUIDE.md` as the full canonical engineering policy.
- Added `research/` as Foundrie AI's own research corpus, mirroring the research folder exported for generated projects.
- Updated the architecture and feature specs to use Next.js 16 with root-level folders: `app/`, `components/`, `lib/`, `trigger/`, and `prisma/`.
- Integrated the authentication, authorization, RBAC-scope, and incremental feature-spec methodology into Foundrie's research, context, generated-output rules, and early auth/project specs.
- Added the generated project `research/` folder contract and research workspace plan for uploaded image assets, screenshots, frame ZIPs, research documents, pasted notes, Tavily, Obscura, Context7 findings, and synthesized research Markdown.
- Removed redundant legacy scaffolding, duplicate context-level agent entrypoint, and empty research asset placeholder folders.
- Added the plan-before-implementation approval gate to Foundrie and generated project contracts.
- **Feature 01 - Design System**: Initialized Next.js 16 app with Tailwind CSS v4, shadcn/ui, and base Foundrie visual components. Configured dark mode and CSS design tokens from `ui-context.md`. Built structural shells for dashboard, project workspace, document viewer, and canvas placeholder.
- **Feature 02 - Auth**: Added Next.js Clerk integration, wrapped app with `ClerkProvider`, created `proxy.ts` to protect routes by default, and scaffolded sign-in/sign-up pages.
- **Housekeeping**: Added root `LICENSE` (MIT) and `CONTRIBUTING.md` aligned with Artkins engineering standards.


## In Progress

- No active feature spec currently.

## Next Up

- `03-database-schema.md` - database schema and initial setup.

## Open Questions

- Confirm whether generated ZIP Blob URLs should be private by default with signed download routes.
- Confirm whether team/organization workspaces are intentionally out of scope for v1.

## Architecture Decisions

- Foundrie uses a role-based multi-model AI firm and a central rotation engine for every AI call.
- Long-running generation belongs in Trigger.dev.
- PostgreSQL stores metadata; Vercel Blob stores large artifacts.
- Diagram generation is sequential and category-organized.
- Context7 skills are mandatory for library/API documentation lookup.
- The app uses the Next.js 16 App Router folder structure at the project root, not the `src` directory layout.
- Implementation proceeds one feature spec at a time. Each spec must be implemented, tested, pushed to GitHub, reviewed by CodeRabbit, fixed until clean, and only then marked done before moving to the next spec.
- Neon Postgres is the required database provider. Runtime uses the Neon pooled `DATABASE_URL`; Prisma migrations use `DIRECT_URL`; read-heavy flows use `DATABASE_READ_REPLICA_URL` when configured.
- Clerk owns authentication; Foundrie application code owns authorization through local user ownership checks, plan gates, and tiny admin email gates.
- User-owned data queries must scope by authenticated local `user.id`; ownership failures return 404.
- Team workspaces, project-level RBAC, custom admin portals, RLS, ABAC, audit logs, and hardware-key admin controls are intentionally out of scope until a later feature explicitly requires them.
- Foundrie-generated feature specs must follow the incremental template: one feature, exact dependencies, exact files, out of scope, future modifications, and binary acceptance criteria.
- Generated ZIP packages include `research/PROJECT_RESEARCH.md` plus supporting research docs and assets.
- Research connectors are optional: Tavily for search/extract/crawl/map, Obscura for rendered browser capture, and Context7 for current library documentation.
- Generated project packages include `.agents/skills/` for project-specific workflows derived from research, context, and feature specs.
- Generated project packages include root `ARTKINS_STYLE_GUIDE.md`.
- Implementation-impacting work requires a user-approved plan. If the user revises the plan, the revised plan must be shown and approved before execution.
- Foundrie's own implementation workflow reads `research/PROJECT_RESEARCH.md` and `research/FOUNDRIE_RESEARCH.md` before context files, so the product architecture reflects the same research flow it generates for other projects.

## Session Notes

- This workspace is currently a planning/specification kit, not a runnable Next.js app.
- Use `AGENTS.md` as the entry point for any implementation session.
- Read `ARTKINS_STYLE_GUIDE.md` immediately after `AGENTS.md`.
- Context7 was checked for Clerk (`/clerk/clerk-docs`) and Svix (`/svix/svix-webhooks`) while refining auth and webhook guidance.
- Context7 was checked for Tavily (`/tavily-ai/tavily-js`, `/tavily-ai/tavily-mcp`) and GSAP (`/websites/gsap`, `/greensock/react`) while adding the research/visual-motion planning layer.
- Context7 was checked for Next.js, Tailwind CSS, Vue, and Angular while changing the Artkins guide from fixed web-stack defaults to dynamic, researched, user-approved stack selection.
- Housekeeping files (`LICENSE`, `CONTRIBUTING.md`) added and force-pushed to `origin/feature/02-auth`.

