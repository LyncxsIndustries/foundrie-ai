# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Project Setup. The full versioned research corpus (v1.0.0 → v14.0.0) has been consolidated into the master research files, AGENTS.md, the six context files, and all 52 feature specs. The Next.js project has been scaffolded. No feature implementation has started yet.

## Current Goal

- Begin implementation with **Feature 01 - Design System**, the first spec in the strict numeric order.

## Completed

- **Initial Scaffold**: Created the Next.js project. No feature work beyond the base project scaffold has been done.
- **Documentation Foundation**: Consolidated the full versioned research corpus into the master research files, AGENTS.md, the six context files, and all 52 feature specs.

## In Progress

- `[ ]` Nothing in progress. Implementation has not started.

## Next Up

- `[ ]` **Feature 01 - Design System**: Build the structural shells and base Foundrie visual components per the spec.
- `[ ]` **Feature 02 - Auth**: Next.js Clerk integration, protected routes, sign-in/sign-up pages.
- `[ ]` **Feature 03 - Database Schema**: Prisma + Neon Postgres data layer.

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

- **Session 2026-06-07**: Reset the progress tracker to reflect the true state — the Next.js project has been scaffolded and no feature implementation has started. Implementation will begin from Feature 01 in strict numeric order.
