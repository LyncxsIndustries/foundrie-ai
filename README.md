# Foundrie AI

Foundrie AI is a pre-IDE architectural workspace for AI-assisted engineering. It turns a raw idea into a research-backed, implementation-ready project package that another AI coding agent can build from.

The product flow is:

```text
idea
-> research intake
-> discovery interview
-> approved implementation plan
-> requirements
-> architecture
-> diagrams
-> context files
-> feature specs
-> project-specific skills
-> ZIP export
-> coding agent implementation
```

## What This Folder Is

This repository is currently Foundrie's planning and implementation kit. It is not yet a runnable Next.js app. The active source of truth is intentionally small:

```text
foundrie-ai/
|-- AGENTS.md
|-- ARTKINS_STYLE_GUIDE.md
|-- README.md
|-- .agents/
|   `-- skills/
|-- research/
|   |-- PROJECT_RESEARCH.md
|   `-- FOUNDRIE_RESEARCH.md
`-- project-kit/
    |-- context/
    `-- feature-specs/
```

There is one active agent entry point: root `AGENTS.md`. There is one full engineering policy: root `ARTKINS_STYLE_GUIDE.md`.

## Required Reading Order

Every implementation session starts here:

1. `AGENTS.md`
2. `ARTKINS_STYLE_GUIDE.md`
3. `research/PROJECT_RESEARCH.md`
4. `research/FOUNDRIE_RESEARCH.md`
5. `project-kit/context/project-overview.md`
6. `project-kit/context/architecture-context.md`
7. `project-kit/context/code-standards.md`
8. `project-kit/context/ui-context.md`
9. `project-kit/context/ai-workflow-rules.md`
10. `project-kit/context/progress-tracker.md`
11. The single current feature spec in numeric order

## Plan Before Implementation

Foundrie must always plan before implementation-impacting work.

- The AI presents a concrete plan before architecture generation, diagram generation, context/spec generation, skill generation, ZIP packaging, or coding-agent implementation.
- Work proceeds only after explicit user approval.
- If the user revises the plan, Foundrie updates the plan and shows the revised version before executing.
- Discovery chat, research upload intake, link collection, and passive research summarization can continue without approval.

Generated projects inherit the same rule through their exported `AGENTS.md` and `ARTKINS_STYLE_GUIDE.md`.

## Canonical Policy

`ARTKINS_STYLE_GUIDE.md` is copied from the full Artkins programming style guide and enriched with Context7-verified Foundrie stack rules. It is not a summary.

It governs:

- no-AI-slope output
- research-first development
- dynamic stack selection for generated projects
- latest-version checks before package versions are committed
- Next.js App Router structure
- Clerk authentication
- Prisma and Neon database strategy
- security and ownership rules
- high-concurrency backend practices
- UI and animation standards
- generated project agent behavior

## Research Model

`research/` is docs-only until real assets exist.

Current files:

- `research/PROJECT_RESEARCH.md`: the research index and usage rules for Foundrie itself.
- `research/FOUNDRIE_RESEARCH.md`: the consolidated product, architecture, backend, auth, AI, research, and roadmap research.

Generated projects also receive `research/PROJECT_RESEARCH.md`. Supporting research folders are created only when populated. Foundrie accepts image assets, screenshots, inspiration images, frame ZIPs, extracted frames, Markdown, pasted notes, PDFs, Word documents, Excel workbooks, PowerPoint decks, links, Tavily results, Obscura captures, and Context7 findings.

Raw animation files are rejected. Users provide extracted frames or frame ZIPs.

**Media Storage:**
- User-uploaded discovery files (images, videos, documents) are stored in Cloudinary, organized by project in folders: `Foundrie AI Files/{projectId}/{images|videos|markdown|documents}/`
- Generated artifacts (ZIPs, diagram PNGs, canvas snapshots) are stored in Vercel Blob
- Neon stores metadata, Cloudinary URLs, extracted text, summaries, tags, source attribution, and ownership

## Context Files

`project-kit/context/` contains Foundrie's active product context:

- `project-overview.md`: what Foundrie is, who uses it, scope, non-goals, and success metrics.
- `architecture-context.md`: stack, system boundaries, model routing, storage, database, APIs, ZIP contract, and invariants.
- `ui-context.md`: product UI, canvas interaction, diagram visual language, and responsiveness.
- `code-standards.md`: Foundrie-specific standards that extend `ARTKINS_STYLE_GUIDE.md`.
- `ai-workflow-rules.md`: agent workflow, planning gate, Context7 usage, one-feature-at-a-time implementation, and review loop.
- `progress-tracker.md`: current state, decisions, open questions, and session notes.

## Feature Specs

Feature specs live in `project-kit/feature-specs/` and are implemented one at a time:

```text
01 design system
02 auth
03 database schema
04 project CRUD
05 AI rotation engine
06 layout shell
07 research library
08 visual and motion research analysis
09 web research connectors
10 discovery chat
11 requirements generation
12 requirements review UI
13 architecture proposal
14 React Flow canvas
15 diagram type selector
16 custom node types
17 custom edge types
18 diagram planning
19 sequential generation
20 diagram storage
21 canvas export
22 project overview generation
23 architecture context generation
24 UI context generation
25 code standards generation
26 feature specs generation
27 project-specific agent skills generation
28 AGENTS.md generation
29 progress tracker generation
30 ZIP builder
31 Trigger ZIP job
32 download button
33 Liveblocks presence
34 project settings
```

The roadmap labels do not authorize batching. Each feature must be planned, approved, implemented, tested, reviewed locally with `coderabbit review --agent`, pushed to GitHub, reviewed again by CodeRabbit on the PR, fixed until clean, then marked done.

## Generated Project Output

Foundrie exports a ZIP named:

```text
{project-slug}_{YYYY-MM-DD_HH-mm-ss}.zip
```

The package contract is:

```text
{project-slug}_{timestamp}/
|-- AGENTS.md
|-- ARTKINS_STYLE_GUIDE.md
|-- context/
|-- feature-specs/
|-- research/
|   `-- PROJECT_RESEARCH.md
|-- diagrams/
`-- requirements/
```

Conditional folders:

- `.agents/skills/` exists only when project-specific skills were generated.
- Research asset subfolders exist only when populated.
- Diagram category folders exist only when diagrams exist for that category.

## Technology Commitments

Foundrie AI itself uses this stack. Generated projects do not inherit it by default.

- Next.js 16 App Router with root-level `app/`, not `src/app`.
- TypeScript strict mode.
- Clerk for authentication.
- Application-layer authorization with local user ownership checks.
- Neon Postgres with Prisma.
- Runtime DB traffic uses pooled `DATABASE_URL`.
- Prisma CLI and migrations use direct `DIRECT_URL`.
- Vercel Blob stores generated artifacts (ZIPs, diagram PNGs, canvas snapshots).
- Cloudinary stores user-uploaded media (images, videos, documents) with automatic optimization and CDN delivery.
- Trigger.dev handles durable long-running work.
- React Flow and Liveblocks power the canvas.
- Tavily, Obscura, and Context7 enrich research when configured.
- Every AI call goes through the rotation engine.

Generated project stacks are chosen through discovery, Context7 research, official version/install checks, trade-off explanation, and user approval. A generated project may be web, mobile, API-only, CLI, AI/ML, automation, data, or another software shape.

## Validation

Use these checks after docs/spec cleanup:

```bash
find project-kit/feature-specs -maxdepth 1 -type f -name '*.md' | sort
grep -RIn "deleted-folder-marker" . --include='*.md'
grep -RIn "disallowed-media-marker" . --include='*.md'
```

Expected result: sequential specs from `01` through `34`, no deleted-folder references, and no disallowed media wording.
