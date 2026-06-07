# AGENTS.md - Foundrie AI Project Context

## Read This First

You are an AI coding agent working on Foundrie AI, a pre-IDE architectural workspace that turns a raw software idea into a complete, implementation-ready package. Foundrie conducts Socratic discovery, surfaces requirements, proposes architecture, generates the full UML/C4/data/infrastructure diagram suite, writes the six context files, writes ordered feature specs, and exports everything as a ZIP that a downstream coding agent (RUWA) can build from with zero ambiguity.

The division of responsibility is absolute: **Foundrie owns what and why; RUWA owns how and when; the human owns approval and judgment.**

The active project kit lives under `project-kit/`. Foundrie's own research corpus lives under `research/`. The full Artkins engineering policy lives at `ARTKINS_STYLE_GUIDE.md`.

## Mandatory Reading Order

1. `ARTKINS_STYLE_GUIDE.md` — full engineering, UX, security, scalability, agent, and no-AI-slope policy.
2. `research/PROJECT_RESEARCH.md` — research index and how the versioned corpus informs implementation.
3. `research/FOUNDRIE_RESEARCH.md` — consolidated master product and implementation research (v1.0.0 → v14.0.0 flattened).
4. `research/FOUNDRIE_V*.md` — the specific versioned file(s) relevant to the current feature, when you need the changelog or exact wording.
5. `project-kit/context/project-overview.md` — product definition, users, the 8-phase flow, scope, success criteria.
6. `project-kit/context/architecture-context.md` — four-layer stack, system boundaries, AI orchestration, storage, database, APIs, invariants.
7. `project-kit/context/code-standards.md` — Foundrie-specific standards that extend the Artkins guide.
8. `project-kit/context/ui-context.md` — dark workspace UI, diagram canvas, node/edge visual language, interaction rules.
9. `project-kit/context/ai-workflow-rules.md` — how agents work, split tasks, use Context7, and keep docs synchronized.
10. `project-kit/context/progress-tracker.md` — current state, next steps, open questions, session notes.

## The Research Corpus Is Cumulative

The `research/FOUNDRIE_V*.md` files are append-only. `FOUNDRIE_V1.0.0.md` is the foundation; each later version documents only what changed, and all prior content remains in force. `FOUNDRIE_RESEARCH.md` flattens the whole history into the current state. When two sources disagree, the higher-numbered versioned file wins. Two material shifts you must internalize:

- **Foundrie's own stack is a four-layer polyglot architecture** (v2.0.0): Rust execution layer (Axum/Tokio — ZIP, key rotation, file ingestion, diagram rendering, WASM sandbox), Python AI layer (LangGraph/PydanticAI — discovery, multi-model rotation, RAG), TypeScript web layer (Next.js 16/React Flow/Liveblocks/GSAP), and a Go API gateway (Gin/gRPC). The old v1 Python+FastAPI / TypeScript+JSZip stack is deprecated.
- **Foundrie is diagram-first** (v6.0.0): discovery is 8 phases, no feature spec is written before all applicable diagrams are generated and approved, and every ZIP includes `diagrams/`.

## Required Skills

Project-local Context7 skills are installed in `.agents/skills/`: `context7-cli`, `context7-mcp`, `find-docs`. Before implementing or changing any library-specific code, use the skills or the CLI:

```bash
npx ctx7 library <name> "<specific implementation question>"
npx ctx7 docs <libraryId> "<specific implementation question>"
```

Use known library IDs from `project-kit/context/architecture-context.md` when available. Do not rely on memory for current APIs, setup, middleware, storage, Trigger.dev task syntax, Liveblocks patterns, React Flow APIs, Prisma migrations, or Next.js App Router behavior. When working with the database, use the project's defined NPM scripts (`npm run db:generate`, `npm run db:migrate`). For generated projects, never assume Foundrie's own stack is the right stack — use Context7 and official sources to research current stable versions before recommending or committing any framework, language, SDK, library, or package version.

## Feature Implementation Order

Feature specs are in `project-kit/feature-specs/`. Implement them in strict numeric order, one spec at a time. Phase names are roadmap labels, not implementation batches. Do not implement `01-06` as a group, do not bundle multiple specs into one pull request, and do not start the next spec until the current one passes review.

For every single feature spec:

1. Read only the current numbered spec and its required context.
2. Create the feature branch before writing any code: `git checkout master && git pull && git checkout -b feature/NN-slug`.
3. Present a concrete implementation plan (with Context7-discovered prerequisites and required inputs) and wait for explicit user approval.
4. Implement that spec within its scope.
5. Write unit tests for the feature's core logic, API routes, and critical paths. Run `npm run test` and `npm run build`.
6. Update `project-kit/context/progress-tracker.md`.
7. Run `coderabbit review --agent` locally. This is a mandatory pre-push gate.
8. Fix every CodeRabbit finding (critical and warning). Re-run until only info-level or no findings remain.
9. Push the branch to GitHub.
10. Let CodeRabbit review the GitHub PR for anything the local review missed.
11. Fix every GitHub CodeRabbit finding and push again. Repeat until there are no unresolved findings.
12. Mark the feature done only after tests pass, build passes, and CodeRabbit has no unresolved findings. Merge to `master`, then move to the next spec.

Never skip ahead, batch specs, or mark a spec done before the GitHub review loop is clean unless the user explicitly changes the plan.

## Hard Rules

1. Root `AGENTS.md` is the only active agent entry point. Do not create duplicate context-level AGENTS files.
2. `ARTKINS_STYLE_GUIDE.md` is mandatory and must be preserved verbatim in Foundrie and every generated project export — never summarized.
3. Plan before implementation. Show the user a concrete plan before architecture generation, diagram generation, context/spec generation, skill generation, ZIP packaging, or coding-agent implementation. Execute implementation-impacting work only after explicit approval; if the user revises the plan, update and re-present it before executing. Passive discovery chat, upload intake, link collection, and research summarization may continue before approval.
4. Foundrie's own stack is fixed by `architecture-context.md` (four-layer polyglot). Generated project stacks are dynamic and selected through research, user preference, trade-off explanation, and approval. Never copy Foundrie's stack into a generated project unless the user chooses it or research justifies it.
5. Before committing package versions in generated specs, use Context7 and official release/install sources. Do not hardcode stale framework baselines. Model IDs are always pinned to an exact version — never `"latest"`.
6. Diagram-first gate: no feature spec is written and no ZIP is assembled until all applicable diagrams are generated and human-approved. Every ZIP includes `diagrams/`; a ZIP without it is invalid. The Feature DAG drives spec ordering. RUWA reads diagrams before context files and never implements a table, route, or component not present in the corresponding diagram.
7. All AI calls go through the rotation engine. Direct provider calls are allowed only inside provider adapters. Free-tier users route to DeepSeek R1; paid users to Claude Sonnet 4 — derived from the subscription plan, never hardcoded per endpoint.
8. Route handlers stay thin. Long-running work (AI generation, diagram batches, context/spec generation, ZIP packaging) belongs in Trigger.dev tasks with retries and idempotency keys.
9. Clerk owns authentication; Foundrie code owns authorization. Every user-owned read, update, and delete must scope by authenticated local `user.id`; never trust `userId` from request input. Ownership failures return 404, not 403.
10. Foundrie uses a 2-role authorization model: **Owner** (creates the project, manages settings and members) and **Collaborator** (edits canvas, diagrams, uses AI generation, downloads ZIP). Use `requireProjectOwner()` for owner-only operations and `requireProjectMember()` for shared operations. Do not build custom admin portals, PostgreSQL RLS, ABAC, audit logs, or hardware-key admin controls unless a later spec explicitly requires them.
11. Every feature spec and generated project spec is one feature only, with exact dependencies, exact files, `Files Owned`, Out of Scope, Future Modifications, and binary acceptance criteria. No two active specs own the same file.
12. PostgreSQL stores relational metadata. Vercel Blob stores generated artifacts (ZIPs, diagram PNGs, canvas snapshots, large generated documents). MongoDB Atlas (isolated from Neon) stores anonymized training data only.
13. Diagram generation is sequential, status-driven, and recoverable. One failed diagram must not cancel the batch. Diagrams are versioned; `progress-tracker.md` records which diagram version each spec was written from.
14. Run `security:all` (SAST, dependency audit, secret detection) before every push. Dependency audit is a hard CI gate — no critical or high CVEs. Never delete or gitignore the lock file; lock-file changes require review.
15. Structured JSON logging only — `console.log` is never the logging mechanism in Foundrie code or generated code. Every request carries a UUID request ID; logs correlate by `trace_id`. PII is scrubbed before emission.
16. The exported ZIP structure is a product contract. Do not rename folders or omit required files without updating the architecture context. Generated packages must include root `AGENTS.md`, root `ARTKINS_STYLE_GUIDE.md`, `context/`, `feature-specs/`, `diagrams/`, `requirements/`, `project-management/`, `docs/`, and `research/PROJECT_RESEARCH.md`. Include `.agents/skills/`, `tools/`, `evals/`, and research subfolders only when populated.
17. Research artifacts are part of the implementation contract. Feature specs reference relevant `research/` files and assets when design, motion, source, or technical decisions depend on them. Foundrie's own features must also use `research/` as input whenever research influenced the architecture or spec.
18. Every recommendation cites a source (benchmark, case study, documented failure mode, or cited best practice). Foundrie never says "best practice" without a reference.
19. Update `context/progress-tracker.md` after meaningful implementation changes. If a requirement is missing, record it in `progress-tracker.md` before inventing behavior — do not invent product behavior that is not documented.
20. A configured test harness is mandatory and baked in from the first feature, in Foundrie and in every generated project. The TypeScript layer uses Vitest + React Testing Library + jsdom with `test`/`test:watch`/`test:coverage` scripts (`npm run test` is a non-watch single run); generated non-TS stacks use the idiomatic equivalent (`pytest`, `cargo test`, `go test`) selected through research and recorded in the architecture context. A feature is done only when its new logic has tests and `npm run test` and `npm run build` both pass. Never copy Foundrie's runner into a project that does not use that stack, and never defer the harness to a later feature.

## When To Split A Task

Split work that combines: auth changes and AI workflow changes; canvas interaction and ZIP packaging; database schema and UI redesign; multiple unrelated API route groups; or behavior not defined in the context files or current spec. Prefer the smallest verifiable increment over broad speculative rewrites. Build only what the current spec requires; never prebuild future behavior.
