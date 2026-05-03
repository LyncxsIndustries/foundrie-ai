# Code Standards

## General

- Root `ARTKINS_STYLE_GUIDE.md` is the authoritative code, UX, security, scalability, agent, and no-AI-slope policy. This file only adds Foundrie-specific constraints.
- Keep modules small and responsibility-focused.
- Prefer explicit types and validated boundaries over implicit assumptions.
- Fix root causes rather than layering UI or API workarounds.
- Do not mix unrelated concerns in one route, component, task, or helper.
- Update context files when architecture, scope, or standards change.

## Planning Gate

- Plan before implementation-impacting work.
- Show the plan to the user and wait for explicit approval before executing architecture generation, diagram generation, context/spec generation, project-specific skill generation, ZIP packaging, or coding-agent implementation.
- If the user requests changes, revise the plan and present the updated plan before executing.
- Discovery chat, upload intake, link collection, and research summarization can continue before approval.

## Context7 Requirement

- Use installed Context7 skills for current library/API docs.
- Use `npx ctx7 library` first unless an exact Context7 library ID is already known.
- Use `npx ctx7 docs` before writing code that depends on current library APIs.
- Record any important version-specific finding in the relevant feature spec or context file.
- Never paste secrets, API keys, private project data, or proprietary user prompts into Context7 queries.
- Before committing package versions, check Context7 and official release/install sources for the current stable version and compatibility.
- Generated project specs must not inherit Foundrie's stack by default; each project gets a researched, user-approved stack.

## TypeScript

- Strict mode is required.
- Avoid `any`; prefer explicit interfaces, discriminated unions, and narrow generic types.
- Use `interface` for object contracts shared across modules.
- Validate all external input with Zod or an equivalent schema at route/task boundaries.
- Keep generated AI outputs behind parse-and-validate functions before using them.

## Next.js

- Use the App Router.
- Default to server components.
- Add `"use client"` only for hooks, browser APIs, realtime state, canvas interactions, or animation.
- Route handlers should authenticate, validate, authorize, delegate, and return predictable JSON.
- Long-running AI, diagram, and ZIP work must be Trigger.dev tasks.

## Authentication and Authorization

- Clerk is the identity authority.
- Authentication answers who the user is; authorization answers what the user can do. Keep those concerns separate.
- Webhooks synchronize a local `User` record, but Clerk remains the source of session truth.
- Clerk webhooks must be verified with Svix headers before any user row is created, updated, or deleted.
- Every route that touches user data calls `requireAuth()` or an equivalent helper.
- `getAuthUser()` must read the Clerk session and return the local `User` with at least `id`, `clerkId`, `email`, `plan`, and `role`.
- Every read, update, and delete on user-owned data includes local `user.id` in the Prisma `where` clause.
- Never trust `userId` from request JSON, route params, or query params.
- Return 404, not 403, when an ownership check fails so the API does not reveal whether another user's resource exists.
- Deletes of owned records use scoped `deleteMany({ where: { id, userId } })` or an equivalent owner-filtered operation.
- Every generated artifact read checks project ownership before returning URLs or content.
- Plan gates live in `lib/auth/plan-limits.ts`; project creation must call `canCreateProject()` before writing.
- Admin checks live in `lib/auth/is-admin.ts` and use `ADMIN_EMAILS`. Do not build custom admin RBAC until a feature spec requires it.
- Do not build team workspaces, project owner/editor/viewer roles, PostgreSQL RLS, ABAC, audit logging, or hardware-key admin controls in v1.

## AI

- Every AI call goes through `callAI` or `callAIStream`.
- Provider adapters live in `lib/ai/providers`.
- Fallback chains are configuration, not ad hoc try/catch blocks inside product code.
- Log provider, model, task, duration, and success/failure for observability.
- Keep prompts in `lib/ai/prompts`.
- Keep generated output schemas in `lib/ai/schemas` or `lib/diagrams/schemas`.
- Visual and motion research analysis must preserve source asset paths and produce implementation constraints, not just aesthetic descriptions.
- Research synthesis must distinguish direct source facts, AI inference, user preferences, and unresolved questions.

## Database and Storage

- Neon Postgres is the required relational database provider.
- PostgreSQL stores metadata, ownership, relationships, statuses, and generated text records.
- Runtime application queries use `DATABASE_URL`, the Neon pooled `-pooler` URL.
- Prisma migrations and CLI commands use `DIRECT_URL`, the direct Neon URL.
- Read-heavy code imports `dbRead`; writes and strong read-after-write paths import `dbWrite`.
- If `DATABASE_READ_REPLICA_URL` is missing, `dbRead` falls back to `DATABASE_URL`.
- Vercel Blob stores large generated artifacts: ZIPs, PNGs, canvas snapshots, and export assets.
- Store Blob URLs or paths in Prisma, not raw binary content.
- Use transactions when a task updates multiple related records.
- Never expose Blob URLs without access checks unless an artifact is intentionally public.
- Research uploads, screenshots, image assets, frame ZIPs, extracted frames, research document files, and browser captures go to Vercel Blob; PostgreSQL stores metadata, extracted text, and AI summaries.
- Do not accept raw animation file uploads. Animation references enter Foundrie as image assets, frame ZIPs, extracted frames, links, or research documents.
- Research source records must preserve source URL, provider, capture status, extracted summary, and ownership.
- Tavily, Obscura, and Context7 connectors must be optional and degrade gracefully when keys/endpoints are absent.
- Uploaded assets must be size/type validated before Blob upload.
- Do not scrape authenticated/private pages or bypass access controls.
- Respect robots, source terms, and copyright risk. Store source attribution and avoid copying full copyrighted pages into generated specs.
- Every foreign key and hot filter path must be indexed in Feature 03.
- Use cursor pagination for list endpoints. Never use offset pagination.
- Use `select` in Prisma list queries and avoid fetching large JSON fields unless the view needs them.
- Avoid N+1 queries; use includes, grouped queries, or explicit batching.
- Run `EXPLAIN ANALYZE` for queries over 100ms and investigate anything over 50ms during load testing.
- Add raw SQL migrations for PostgreSQL partial indexes and autovacuum tuning where Prisma cannot express the database feature.

## Canvas and Diagrams

- React Flow owns viewport interactions and rendering.
- Liveblocks owns realtime collaboration and presence.
- Diagram nodes and edges must be type-aware and schema-validated.
- Do not manually mutate React Flow state in a way that bypasses collaborative state.
- Keep node renderers pure and visual; business logic belongs in hooks/helpers.

## Trigger.dev

- Use durable tasks for AI generation, diagram batches, and ZIP creation.
- Tasks validate payloads before work starts.
- Tasks should update project/job status at meaningful checkpoints.
- Failed diagram jobs should not fail the whole batch unless the planner itself cannot run.

## UI

- Use Tailwind tokens and shadcn/ui components.
- Use Lucide icons.
- Use Framer Motion only for meaningful transitions and progress states.
- Do not hardcode raw colors in components.
- Do not make the product look like a marketing page once users are in the app.

## Tests and Verification

- Add unit tests for pure helpers: slugging, fallback chain selection, output parsing, ZIP path generation, diagram job planning.
- Add integration tests for API auth and ownership boundaries.
- Add component tests where interaction risk is high.
- `npm run build` must pass before moving to the next feature unit.

## Feature Spec Methodology

- One feature spec describes one feature only.
- Every spec states `Type`: `NEW FEATURE` or `MODIFICATION`.
- Modification specs must name which earlier feature they modify.
- Dependencies must be exact and must exist before implementation starts.
- Files must be listed as `CREATE`, `MODIFY`, or `RUN`; avoid open-ended file scopes.
- Out of Scope is mandatory.
- Future Modifications is mandatory when the current feature is intentionally minimal.
- Acceptance criteria must be binary pass/fail.
- Generated specs must not reference auth, logout, user menus, plan gates, admin routes, or collaboration permissions before their dependency specs exist.
- Prefer the smallest working increment that can be implemented, tested, pushed, reviewed, fixed, and marked done.
