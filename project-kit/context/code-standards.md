# Code Standards

## General

- Root `ARTKINS_STYLE_GUIDE.md` is the authoritative code, UX, security, scalability, agent, and no-AI-slope policy. This file only adds Foundrie-specific constraints.
- Keep modules small and responsibility-focused.
- Prefer explicit types and validated boundaries over implicit assumptions.
- Fix root causes rather than layering UI or API workarounds.
- Do not mix unrelated concerns in one route, component, task, or helper.
- Update context files when architecture, scope, or standards change.
- No AI slope: comments explain *why*, never *what*; no decorative narration, no marketing-speak, no celebratory language.

## Planning Gate

- Plan before implementation-impacting work.
- Show the plan and wait for explicit approval before executing architecture generation, diagram generation, context/spec generation, project-specific skill generation, ZIP packaging, or coding-agent implementation.
- If the user requests changes, revise the plan and present the updated plan before executing.
- Discovery chat, upload intake, link collection, and research summarization continue before approval.

## Context7 Requirement

- Use installed Context7 skills for current library/API docs.
- Use `npx ctx7 library` first unless an exact Context7 library ID is already known, then `npx ctx7 docs` before writing code that depends on current library APIs.
- Record important version-specific findings in the relevant feature spec or context file.
- Never paste secrets, API keys, private project data, or proprietary prompts into Context7 queries.
- Before committing package versions, check Context7 and official release/install sources for the current stable version and compatibility.
- Generated project specs must not inherit Foundrie's stack by default; each project gets a researched, user-approved stack.
- Every recommendation cites a source (benchmark, case study, documented failure mode, or cited best practice). Never say "best practice" without a reference.

## TypeScript

- Strict mode required. Avoid `any`; prefer explicit interfaces, discriminated unions, narrow generics.
- Use `interface` for object contracts shared across modules; `type` for unions/primitives.
- Validate all external input with Zod at route/task boundaries.
- Keep generated AI outputs behind parse-and-validate functions before use.
- Typed environment variables in `types/env.d.ts`.

## Next.js

- Use the App Router. Default to server components.
- Add `"use client"` only for hooks, browser APIs, realtime state, canvas interactions, or animation.
- Route handlers authenticate, validate, authorize, delegate, and return predictable JSON. Keep them thin.
- Long-running AI, diagram, and ZIP work must be Trigger.dev tasks.
- Make cache behavior explicit (`cache: "no-store"`, `revalidate`, tags, or static generation).
- Use loading and error boundaries for meaningful async route segments.

## Polyglot Layer Discipline

Foundrie's own system spans four languages. When working in the deployed system rather than the Next.js app alone:
- ZIP generation, key rotation, file ingestion, diagram rendering, and the WASM sandbox belong in the Rust execution layer (Axum/Tokio). ZIP generation streams and never buffers a whole ZIP in RAM.
- Discovery orchestration, multi-model rotation, and RAG belong in the Python AI layer (LangGraph/PydanticAI) with PostgresSaver checkpointing.
- Inter-service routing, health checks, rate limiting, and NATS publishing belong in the Go gateway (Gin/gRPC).
- The TypeScript layer owns the web app, canvas, realtime collaboration, and animation.
- Layers communicate over gRPC. Hot-path Python computation is exposed from Rust via PyO3.
- Generated projects are stack-dynamic and follow the language decision matrix (`research/FOUNDRIE_RESEARCH.md` §8). Rust is mandatory for generated CLI tools; GSAP is mandatory for Awwwards-level web UIs.

## Authentication and Authorization

- Clerk is the identity authority. Authentication answers who; authorization answers what — keep them separate.
- Clerk webhooks synchronize a local `User` record; Clerk remains the source of session truth. Verify webhooks with Svix headers before any user row is created, updated, or deleted.
- Every route touching user data calls `requireAuth()` or equivalent. `getAuthUser()` reads the Clerk session and returns the local `User` with at least `id`, `clerkId`, `email`, `plan`, `role`.
- Every read, update, and delete on user-owned data includes local `user.id` in the Prisma `where` clause. Never trust `userId` from request JSON, route params, or query params.
- Return 404, not 403, when an ownership check fails. Deletes use scoped `deleteMany({ where: { id, userId } })`.
- Every generated artifact read checks project ownership before returning URLs or content.
- Plan gates live in `lib/auth/plan-limits.ts` via `canUseFeature()`; project creation calls `canCreateProject()` before writing. Tier drives AI model selection (FREE → DeepSeek R1, PRO/ENTERPRISE → Claude Sonnet 4).
- Admin checks live in `lib/auth/is-admin.ts` using `ADMIN_EMAILS`.
- 2-role model: Owner-only operations use `requireProjectOwner()`; shared operations use `requireProjectMember()`; `getProjectRole()` returns `OWNER`/`COLLABORATOR`/`null` for UI.
- Do not build PostgreSQL RLS, ABAC, audit logging, or hardware-key admin controls unless a later spec requires them.

## AI

- Every AI call goes through `callAI` or `callAIStream`. Provider adapters live in `lib/ai/providers`; no direct external AI calls elsewhere.
- Fallback chains are configuration, not ad hoc try/catch in product code.
- Log provider, model, task, duration, and success/failure.
- Keep prompts in `lib/ai/prompts` and output schemas in `lib/ai/schemas` or `lib/diagrams/schemas`.
- Model IDs are pinned to exact versions, never `"latest"`, recorded in `config/model.yaml`.
- Visual and motion research analysis preserves source asset paths and produces implementation constraints, not just aesthetic descriptions.
- Research synthesis distinguishes direct source facts, AI inference, user preferences, and unresolved questions.
- The three AI engineering disciplines stay distinct: context engineering (prune between phases, structured over prose), memory engineering (Mem0 taxonomy, version contradictions with `superseded_by`), harness engineering (FastMCP tool exposure, tool-gateway security, structured logging observability). Tools validate parameters before execution and return structured errors, never crashes.

## Database and Storage

- Neon Postgres is the required relational database. PostgreSQL stores metadata, ownership, relationships, statuses, and generated text records.
- Runtime queries use pooled `DATABASE_URL` (`-pooler`); Prisma migrations/CLI use `DIRECT_URL`. Runtime code never uses the direct connection.
- One Prisma client `db` (pooled), cached on `globalThis` in development. Logging: dev logs query/error/warn, production logs error only.
- Vercel Blob stores large artifacts (ZIPs, PNGs, canvas snapshots, export assets). Store Blob URLs/paths in Prisma, not raw binary.
- MongoDB Atlas (isolated, zero access to Neon) stores anonymized training data only; user identifiers are one-way hashed.
- Use transactions for multi-record updates. Never expose Blob URLs without access checks unless intentionally public.
- Research uploads go to Blob; PostgreSQL stores metadata, extracted text, summaries, and AI summaries. Do not accept raw animation files — references enter as image assets, frame ZIPs, extracted frames, links, or documents.
- All uploaded files pass the 6-step file security pipeline before content is extracted. Size/type validate before upload. Do not scrape authenticated/private pages or bypass access controls; respect robots, source terms, and copyright; store source attribution; avoid copying full copyrighted pages into specs.
- Tavily, Obscura, Firecrawl, and Context7 connectors are optional and degrade gracefully when keys/endpoints are absent.
- Every foreign key and hot filter path is indexed. Use cursor pagination (never offset). Use `select` in list queries; avoid large JSON fields unless needed. Avoid N+1 queries. `EXPLAIN ANALYZE` queries over 100ms. Add raw SQL migrations for partial indexes and autovacuum tuning.

## Dependency Security

- Run the dependency audit (`npm audit` / `pip-audit` / `safety check`) before feature work; resolve all critical and high findings.
- Never delete or gitignore the lock file (`package-lock.json`, `poetry.lock`, `Cargo.lock`). Always commit it. Lock-file changes require review. CI uses `npm ci`, not `npm install`.
- `.npmrc` uses `save-exact=true`, `engine-strict=true`.
- Monthly cadence: `npm audit` → `npm outdated` → patch safe versions → flag risky ones → log in `CHANGE_LOG.md`. Dependabot and SBOM generation are configured. Dependency audit is a hard CI gate — no critical or high CVEs.

## Logging

- Structured JSON logging only. `console.log` is never the logging mechanism in production paths — this is a generation error.
- Log levels: DEBUG (dev only), INFO (normal ops), WARN (recoverable), ERROR (needs attention), FATAL (cannot continue), AUDIT (security/compliance, always on, immutable).
- Every API request generates a UUID request ID attached to every log entry; logs correlate by `trace_id`.
- PII (passwords, tokens, API keys, emails, card numbers) is scrubbed before emission.
- Foundrie's layers use Pino (TS), Logfire (Python), `tracing` crate (Rust), all emitting to one central aggregator chosen in discovery Phase 4.

## Idempotency

- Client actions use the `useIdempotentAction` hook (ignore double-clicks, UUID per action); the server dedupes via the Rust `IdempotencyStore` with TTL.
- Stripe payment initiation uses an idempotency key; emails check `sent_at`; database writes prefer upsert; Trigger.dev tasks are idempotent by task ID; mutations check resource existence before creating.
- All buttons disable immediately on click and re-enable only on error.

## Canvas and Diagrams

- React Flow owns viewport interactions and rendering; Liveblocks owns realtime collaboration and presence.
- Diagram nodes and edges are type-aware and schema-validated. `nodeTypes`/`edgeTypes` are defined outside render scope or memoized.
- Do not manually mutate React Flow state in a way that bypasses collaborative state. Node renderers are pure and visual; business logic belongs in hooks/helpers.
- Persistent diagram data lives in the database, not Liveblocks presence. Presence is for cursors, selections, and ephemeral state, and degrades gracefully when realtime auth/connection fails.
- The System Context Diagram is generated first; the diagram-first gate holds until all applicable diagrams are approved.

## Trigger.dev

- Use durable tasks for AI generation, diagram batches, and ZIP creation. Tasks validate payloads before work starts.
- Tasks define retry behavior and use idempotency keys for expensive or externally visible operations.
- Tasks update project/job status at meaningful checkpoints and persist status before and after each major step.
- Failed diagram jobs do not fail the whole batch unless the planner itself cannot run. Retries must not corrupt metadata, duplicate records, or orphan artifacts.

## UI

- Use Tailwind tokens and shadcn/ui components; Lucide icons; Framer Motion for meaningful transitions and progress states; GSAP for Awwwards-level motion.
- Do not hardcode raw colors in components. Do not make the product look like a marketing page once users are in the app.
- GSAP rules: register plugins at module level; use `useLayoutEffect`; scope with `gsap.context()`; always `return () => ctx.revert()`; animate only transform/opacity with `force3D: true`.
- Every async surface has loading, error, and empty states. Core Web Vitals targets (LCP < 2.5s, FID < 100ms, CLS < 0.1) are acceptance criteria for UI features.

## Tests and Verification

- **A test harness is mandatory and baked in.** Every Foundrie codebase and every generated project ships with a configured test runner from its first feature — testing is never deferred or treated as optional. For the TypeScript/Next.js layer the baseline is Vitest + React Testing Library + jsdom (`@testing-library/jest-dom`, `@testing-library/user-event`), configured via `vitest.config.mts` and a `vitest.setup.ts` that registers jest-dom matchers and cleans up between tests. Generated projects in other stacks use the idiomatic equivalent for that stack (e.g., `pytest` for Python, `cargo test` for Rust, `go test` for Go), selected through research and recorded in the architecture context — never copy Foundrie's runner into a project that does not use that stack.
- Required NPM scripts: `test` (single run, CI-safe — `vitest run`), `test:watch`, and `test:coverage`. `npm run test` must be non-watch so it terminates in CI.
- The first feature spec of every project (Foundrie's `01-design-system` and each generated project's first spec) provisions and verifies the test harness as part of its scope, so no later feature inherits an unconfigured runner.
- Add unit tests for pure helpers: slugging, fallback chain selection, output parsing, ZIP path generation, diagram job planning.
- Add integration tests for API auth and ownership boundaries.
- Add component tests where interaction risk is high. For agentic behavior, use LLM-as-judge plus a behavioral golden set.
- Every feature is done only when its new logic has tests and `npm run test` passes. `npm run build` must also pass before moving to the next feature.
- Run `coderabbit review --agent` locally before every push. Fix all critical and warning findings. Re-run until only info-level or no findings remain. This is a mandatory pre-push gate.
- After pushing, let CodeRabbit review the GitHub PR and fix additional findings before merging.

## Quality Gate

Every deliverable passes the three-category quality gate before it is considered complete:
- **Documents**: placeholders populated, internally consistent, legally coherent, consistently formatted, version-accurate, brand-aligned, actionable.
- **Code/Technical**: test harness configured and `npm run test` green (new logic covered), structured logging (no `console.log`), dependency audit passes (no critical/high CVEs), complete README, env vars documented, no hardcoded secrets, CI green.
- **Research/Intelligence**: sources cited and accessible, data points dated, recommendations actionable with specific numbers, conflicting sources acknowledged.

Gate failures are logged in `docs/QUALITY-GATE.md`, classified, routed to the correct upstream step, and re-checked through the full gate.

## Feature Spec Methodology

- One feature spec describes one feature only. Every spec states `Type`: `NEW FEATURE`, `MODIFICATION`, or `REMOVAL`. Modification/removal specs name which earlier feature they affect.
- Dependencies are exact and must exist before implementation starts.
- Files are listed as `CREATE`, `MODIFY`, or `RUN`. Every spec declares `Files Owned`; no two active specs own the same file.
- Out of Scope is mandatory. Future Modifications is mandatory when the feature is intentionally minimal. Acceptance criteria are binary pass/fail.
- Specs are traced to the diagram that governs them. Specs must not reference auth, logout, user menus, plan gates, admin routes, or collaboration permissions before their dependency specs exist.
- Prefer the smallest working increment that can be implemented, tested, pushed, reviewed, fixed, and marked done. Never put project initialization commands in feature specs.
