# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Documentation and Data Foundation. The full versioned research corpus (v1.0.0 → v14.0.0) has been consolidated into the master research files, AGENTS.md, the six context files, and all feature specs. Transitioning to Core Features.

## Current Goal

- Implement **Feature 04 - Project CRUD** with Owner-scoped security.

## Completed

- **Initial Scaffold**: Initialized Next.js 16 app with Tailwind CSS v4, shadcn/ui, and base Foundrie visual components.
- **Feature 01 - Design System**: Built structural shells for dashboard, project workspace, and canvas placeholder.
- **Feature 02 - Auth**: Added Next.js Clerk integration, protected routes, and scaffolded sign-in/sign-up pages.
- **Feature 03 - Database Schema**: Implemented the Prisma v7 and Neon Postgres data layer. Configured pooled/direct connection settings via `prisma.config.ts`. Confirmed `npm run build` pass and resolved all CodeRabbit findings.
- **Foundrie Collaboration Model**: Formalized the 2-role **Owner/Collaborator** authorization model. Application-layer ownership scoping (no RLS).
- **Quality Gates**: Synchronized all 42 feature specs with mandatory CodeRabbit pre-push verification.
- **Research Consolidation (2026-06-06)**: Rewrote `research/PROJECT_RESEARCH.md` and `research/FOUNDRIE_RESEARCH.md` as cumulative master files reflecting v1.0.0 → v14.0.0. Extensively rewrote root `AGENTS.md`, all six context files, and all feature specs to reflect the four-layer polyglot architecture (v2), the diagram-first 8-phase protocol (v6), seven-layer security and 22-step CI/CD (v3), data flywheel (v4), monorepo/ADRs/project types (v5), GitHub App and team topologies (v7), multi-user canvas/recovery/idempotency (v8), repo health and project-management docs (v9), Figma bidirectional and hidden-requirements catalog (v10), scale/MongoDB/pricing/Stripe (v11), context/memory/harness engineering with Mem0/FastMCP/Firecrawl and logging discipline (v12), dependency security and client lifecycle (v13), and the three-category quality gate, seven-section handoff, and retrospective framework (v14).

## In Progress

- `[ ]` **Feature 04 - Project CRUD**: Implementing project creation, list, update, and delete with strict owner-scoping.

## Next Up

- `[ ]` **Feature 05 - AI Rotation Engine**: Provider-agnostic LLM orchestration with the Rust key engine model, fallback chains, tier-based model selection, and NATS queuing semantics.
- `[ ]` **Feature 06 - Layout Shell**: Finalizing the dark workspace UI components.

## Architecture Decisions

- **Four-Layer Polyglot Architecture**: Foundrie's own system is Rust (execution: ZIP, key rotation, file ingestion, diagram rendering, WASM) + Python (AI: LangGraph orchestration, multi-model rotation, RAG) + TypeScript (web: Next.js 16, React Flow, Liveblocks, GSAP) + Go (gateway). The deprecated v1 Python/FastAPI + TypeScript/JSZip stack is superseded.
- **Diagram-First Generation**: No feature spec is written before all applicable diagrams are generated and approved. Discovery is 8 phases. Every ZIP includes `diagrams/`. The Feature DAG drives spec ordering.
- **Prisma 7 Standard**: Database URLs (Pooled/Direct) live in `prisma.config.ts`, not `schema.prisma`.
- **Authorization vs RLS**: Security is enforced at the application layer via ownership-scoped queries and helpers (`requireProjectOwner`, `requireProjectMember`). PostgreSQL RLS is out of scope for v1.
- **Generated stacks are dynamic**: Foundrie's own stack is never the default for generated projects; stacks are chosen through research, trade-off explanation, and approval, and recorded in ADRs.
- **CodeRabbit Pre-Push Gate**: Every feature requires a clean CodeRabbit review before merging. Errors are resolved by checking official docs (Context7) rather than relying on AI training data.

## Open Questions

- None recorded. Record any missing product decision here before inventing behavior.

## Session Notes

- **Session 2026-05-03**: Bulk-updated 42 feature specs with standardized quality-check language; resolved Prisma 7 validation by moving datasource URLs to `prisma.config.ts`; verified Feature 03 with a full production build.
- **Session 2026-06-06**: Consolidated the full versioned research corpus into the master research files and propagated it through AGENTS.md, the six context files, and all 42 feature specs. The specs now reflect the diagram-first pipeline, four-layer architecture awareness, security/CI/CD/dependency/logging discipline, project-management and docs outputs, and the quality gate. No code behavior changed; this was a documentation and specification synchronization pass.
