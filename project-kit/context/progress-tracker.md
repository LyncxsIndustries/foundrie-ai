# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature implementation. The full versioned research corpus (v1.0.0 → v14.0.0) has been consolidated into the master research files, AGENTS.md, the six context files, and all 52 feature specs. **Feature 01 - Design System** is implemented on branch `feature/01-design-system` and pending review.

## Current Goal

- Complete the **Feature 01 - Design System** review loop (CodeRabbit local → push → GitHub review), then begin **Feature 02 - Auth**.

## Completed

- **Initial Scaffold**: Created the Next.js project. No feature work beyond the base project scaffold has been done.
- **Documentation Foundation**: Consolidated the full versioned research corpus into the master research files, AGENTS.md, the six context files, and all 52 feature specs.
- **Feature 01 - Design System** (pending review): Dark workspace token system in `app/globals.css` (Foundrie palette mapped onto shadcn semantic tokens via Tailwind v4 `@theme`), `lib/utils.ts` `cn()`, typed `design-system.ts` (typography/spacing/radius/motion tokens), 14 shadcn primitives in `components/ui/**` themed with Foundrie tokens, workspace shell + loading/error/empty state components, and base surfaces (dashboard, project shell, requirements review, diagram workspace placeholder). Vitest + React Testing Library test harness configured (`vitest.config.mts`, `vitest.setup.ts`, `test`/`test:watch`/`test:coverage` scripts) with 22 passing tests. Next.js patched to 16.2.7 (cleared high-severity CVE); GSAP, `@gsap/react`, and Framer Motion installed. `.npmrc` added (`save-exact`, `engine-strict`). `.gitignore` extended for editor/IDE, logs, and local CodeRabbit artifacts.

## In Progress

- `[~]` **Feature 01 - Design System**: Implementation complete and build/lint green; running the CodeRabbit review loop before merge.

## Next Up

- `[ ]` **Feature 02 - Auth**: Next.js Clerk integration, protected routes, sign-in/sign-up pages.
- `[ ]` **Feature 03 - Database Schema**: Prisma + Neon Postgres data layer.

## Architecture Decisions

- **Four-Layer Polyglot Architecture**: Foundrie's own system is Rust (execution: ZIP, key rotation, file ingestion, diagram rendering, WASM) + Python (AI: LangGraph orchestration, multi-model rotation, RAG) + TypeScript (web: Next.js 16, React Flow, Liveblocks, GSAP) + Go (gateway). The deprecated v1 Python/FastAPI + TypeScript/JSZip stack is superseded.
- **Diagram-First Generation**: No feature spec is written before all applicable diagrams are generated and approved. Discovery is 8 phases. Every ZIP includes `diagrams/`. The Feature DAG drives spec ordering.
- **Prisma 7 Standard**: Database URLs (Pooled/Direct) live in `prisma.config.ts`, not `schema.prisma`.
- **Authorization vs RLS**: Security is enforced at the application layer via ownership-scoped queries and helpers (`requireProjectOwner`, `requireProjectMember`). PostgreSQL RLS is out of scope for v1.
- **Generated stacks are dynamic**: Foundrie's own stack is never the default for generated projects; stacks are chosen through research, trade-off explanation, and approval, and recorded in ADRs.
- **CodeRabbit Pre-Push Gate**: Every feature requires a clean CodeRabbit review before merging. Errors are resolved by checking official docs (Context7) rather than relying on AI training data.
- **Tailwind v4 CSS-first tokens (Feature 01)**: The spec's `Files Owned` listed `tailwind.config.ts`, but the installed Tailwind v4 is CSS-first and shadcn no longer generates a JS config. Tokens are driven through `@theme` in `app/globals.css`; the `min-touch` (44×44px) utility is defined via `@utility`. No `tailwind.config.ts` is created. User approved this deviation on 2026-06-07.
- **Test harness is baked in (project-wide standard, 2026-06-07)**: A configured test runner ships from the first feature in Foundrie and in every generated project — testing is never deferred. The TypeScript layer uses Vitest + React Testing Library + jsdom with `test`/`test:watch`/`test:coverage` scripts (`npm run test` is non-watch). Generated non-TS stacks use the idiomatic equivalent (`pytest`, `cargo test`, `go test`) chosen through research. Captured in AGENTS.md (Hard Rule 20) and `code-standards.md` (Tests and Verification + Quality Gate).

## Open Questions

- None recorded. Record any missing product decision here before inventing behavior.

## Session Notes

- **Session 2026-06-07**: Reset the progress tracker to reflect the true state — the Next.js project has been scaffolded and no feature implementation has started. Implementation will begin from Feature 01 in strict numeric order.
- **Session 2026-06-07 (Feature 01)**: Implemented the design system on `feature/01-design-system`. Patched Next.js 16.2.4 → 16.2.7 to clear a high-severity middleware-bypass CVE (dependency-audit hard gate); 2 moderate transitive advisories remain inside Next's own tree (not fixable without a breaking downgrade). Initialized shadcn/ui (radix base), added 14 primitives, mapped the Foundrie dark palette onto shadcn semantic tokens in `globals.css`, added `design-system.ts`, workspace shell + state components, and four base surfaces. `npm run build` and `npm run lint` pass (0 errors; remaining lint warnings are pre-existing in `.agents/skills/**` templates, out of scope). Context7 was used to verify shadcn init and the `useGSAP` pattern. Next: CodeRabbit review loop.
