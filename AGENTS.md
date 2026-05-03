# AGENTS.md - Foundrie AI Project Context

## Read This First

You are an AI coding agent working on Foundrie AI, a pre-IDE architectural workspace that turns a raw software idea into a complete implementation-ready package. The product conducts discovery, surfaces requirements, proposes architecture, generates UML/C4/data/infrastructure diagrams, writes the six context files, writes ordered feature specs, and exports everything as a ZIP that another AI coding agent can build from.

The active project kit lives under:

`Context_Features_Issues/`

Foundrie's own research corpus lives under:

`research/`

The full Artkins engineering policy lives at:

`ARTKINS_STYLE_GUIDE.md`

## Mandatory Reading Order

1. `ARTKINS_STYLE_GUIDE.md` - full engineering, UX, security, scalability, agent, and no-AI-slope policy
2. `research/PROJECT_RESEARCH.md` - research index and how research informs implementation
3. `research/FOUNDRIE_RESEARCH.md` - consolidated Foundrie product and implementation research
4. `Context_Features_Issues/context/project-overview.md` - product definition, users, flows, scope, and success criteria
5. `Context_Features_Issues/context/architecture-context.md` - stack, system boundaries, AI orchestration, storage, database, APIs, and invariants
6. `Context_Features_Issues/context/code-standards.md` - Foundrie-specific standards that extend the Artkins guide
7. `Context_Features_Issues/context/ui-context.md` - dark workspace UI, diagram canvas, node/edge visual language, and interaction rules
8. `Context_Features_Issues/context/ai-workflow-rules.md` - how agents must work, split tasks, use Context7, and keep docs synchronized
9. `Context_Features_Issues/context/progress-tracker.md` - current state, next steps, open questions, and session notes

## Required Skills

Project-local Context7 skills are installed in `.agents/skills/`:

- `context7-cli`
- `context7-mcp`
- `find-docs`

Before implementing or changing any library-specific code, use the skills or the CLI workflow:

```bash
npx ctx7 library <name> "<specific implementation question>"
npx ctx7 docs <libraryId> "<specific implementation question>"
```

Use known library IDs from `Context_Features_Issues/context/architecture-context.md` when available. Do not rely on memory for current APIs, setup, middleware, storage, Trigger.dev task syntax, Liveblocks patterns, React Flow APIs, Prisma migrations, or Next.js App Router behavior.

For generated projects, never assume Foundrie's own stack is the right stack. Use Context7 and official sources to research current stable versions before recommending or committing any framework, language, SDK, library, or package version.

## Feature Implementation Order

Feature specs are in `Context_Features_Issues/feature-specs/`. Implement them in strict numeric order, one feature spec at a time.

The phase names are only roadmap labels. They are not implementation batches. Do not implement `01-06` as a group, do not bundle multiple specs into one pull request, and do not start the next spec until the current one has passed review.

For every single feature spec:

1. Read only the current numbered spec and its required context.
2. Implement that spec within its scope.
3. Test it locally and run the required verification commands.
4. Update `Context_Features_Issues/context/progress-tracker.md`.
5. Push the branch or commit to GitHub.
6. Let CodeRabbit review the GitHub changes.
7. Fix every CodeRabbit issue and push again.
8. Repeat review/fix until there are no open issues.
9. Mark the feature as done only after tests pass and CodeRabbit has no unresolved findings.
10. Move to the next numbered spec.

Never skip ahead, batch specs, or mark a spec done before the GitHub review loop is clean unless the user explicitly changes the plan.

## Hard Rules

- Root `AGENTS.md` is the only active agent entry point. Do not create duplicate context-level AGENTS files.
- `ARTKINS_STYLE_GUIDE.md` is mandatory and must be preserved in Foundrie and generated project exports.
- Foundrie's own stack is fixed by `architecture-context.md`; generated project stacks are dynamic and must be selected through research, user preference, trade-off explanation, and approval.
- Before committing package versions in generated specs, use Context7 and official release/install sources. Do not hardcode stale framework baselines.
- Plan before implementation. Show the user a concrete implementation plan before architecture generation, diagram generation, context/spec generation, skill generation, ZIP packaging, or coding-agent implementation.
- Execute implementation-impacting work only after explicit user approval. If the user revises the plan, update the plan and present the revised version before executing.
- All AI calls go through the rotation engine. No direct provider calls outside provider adapters.
- Route handlers stay thin. Long-running work belongs in Trigger.dev tasks.
- Neon Postgres is the required relational database. Runtime uses pooled `DATABASE_URL`, migrations use direct `DIRECT_URL`, and read-heavy flows use `DATABASE_READ_REPLICA_URL` when configured.
- Clerk owns authentication. Foundrie code owns authorization.
- Every user-owned read, update, and delete must scope by authenticated local `user.id`; never trust `userId` from request input.
- Ownership failures return 404, not 403.
- Do not build team workspaces, project-level RBAC, custom admin portals, RLS, ABAC, audit logs, or hardware-key admin controls unless a later spec explicitly requires them.
- Every feature spec and generated project spec must be one feature only, with exact dependencies, exact files, Out of Scope, Future Modifications, and binary acceptance criteria.
- PostgreSQL stores relational metadata. Vercel Blob stores generated artifacts: ZIP files, diagram PNGs, canvas snapshots, and large generated documents.
- Diagram generation is sequential, status-driven, and recoverable. One failed diagram must not cancel the entire batch.
- The exported ZIP structure is a product contract. Do not rename folders or omit required files without updating the architecture context.
- Generated project packages must include root `AGENTS.md`, root `ARTKINS_STYLE_GUIDE.md`, `context/`, `feature-specs/`, `diagrams/`, `requirements/`, and `research/PROJECT_RESEARCH.md`. Include `.agents/skills/` and research subfolders only when populated.
- Research artifacts are part of the implementation contract. Feature specs should reference relevant `research/` files and assets when design, motion, source, or technical decisions depend on them.
- Foundrie's own features must also use `research/` as implementation input whenever research influenced the architecture or spec.
- Update `context/progress-tracker.md` after meaningful implementation changes.
- If a requirement is missing, record it in `progress-tracker.md` before inventing behavior.
