# Foundrie AI - Master Research and Implementation Specification

## Product Vision

Foundrie AI is the upstream intelligence layer for AI-assisted engineering. It transforms any idea into a structured, machine-readable, implementation-ready package that can be downloaded as a ZIP and handed to any AI coding agent.

## Core Pipeline

```text
Idea
-> AI discovery interview
-> user-approved implementation plan
-> requirements document
-> architecture proposal
-> sequential UML/C4/data/infrastructure diagrams
-> ARTKINS_STYLE_GUIDE.md
-> six context files
-> ordered feature specs
-> AGENTS.md
-> ZIP download
-> AI-assisted implementation
```

## Technology Stack

- Next.js 16 App Router and TypeScript strict mode.
- Clerk for auth and user sync.
- PostgreSQL on Neon with Prisma. Neon is the required database provider for Foundrie AI.
- Liveblocks and React Flow for collaborative diagrams.
- Trigger.dev v4 for durable jobs.
- Gemini, OpenRouter, Groq, and DeepSeek for multi-model AI.
- JSZip for ZIP generation.
- Vercel Blob for generated artifacts.
- html-to-image for PNG export (The one real weakness of html-to-image is that it can struggle with external images (like AWS icons) due to CORS. The fix is simple - inline your icons as base64 SVGs rather than loading them from external URLs, which you should be doing anyway for a diagramming tool.).
- Tailwind CSS v4, shadcn/ui, Lucide React, and Framer Motion for UI.

## Required Environment Variables

```bash
GEMINI_API_KEY=...
OPENROUTER_API_KEY=...
GROQ_API_KEY=...
DEEPSEEK_API_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
CLERK_WEBHOOK_SECRET=...
ADMIN_EMAILS="founder@example.com"
# Neon Postgres
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

TRIGGER_SECRET_KEY=...
BLOB_READ_WRITE_TOKEN=...
NEXT_PUBLIC_APP_URL=https://foundrieai.com

# Optional research connectors
TAVILY_API_KEY=...
OBSCURA_ENDPOINT=...
```

## Context7 and Skills

Project-local Context7 skills are installed in `.agents/skills`. Agents must use them before implementation work that depends on current API behavior.


| Technology | Context7 library ID |
|---|---|
| Next.js | `/vercel/next.js` |
| Clerk | `/clerk/clerk-docs` |
| Svix webhooks | `/svix/svix-webhooks` |
| Prisma | `/prisma/web` |
| Neon Postgres | `/websites/neon` |
| Liveblocks | `/liveblocks/liveblocks` |
| React Flow / Xyflow | `/xyflow/web` |
| Trigger.dev | `/triggerdotdev/trigger.dev` |
| Tailwind CSS | `/tailwindlabs/tailwindcss.com` |
| shadcn/ui | `/shadcn-ui/ui` |
| Vercel Storage / Blob | `/vercel/storage` |
| JSZip | `/stuk/jszip` |
| html-to-image | `/bubkoo/html-to-image` |
| Tavily JS | `/tavily-ai/tavily-js` |
| Tavily MCP | `/tavily-ai/tavily-mcp` |
| GSAP | `/websites/gsap` |
| GSAP React | `/greensock/react` |


## Artkins Style Policy

Foundrie AI uses the full root `ARTKINS_STYLE_GUIDE.md` as a canonical policy artifact. It is copied from the full Artkins programming style guide and enriched with Context7-verified Foundrie stack rules. It is not summarized into the context files.

Every Foundrie implementation session and every generated project package must read the guide before implementation. Generated ZIP packages include root `ARTKINS_STYLE_GUIDE.md`.

Foundrie's own stack is fixed by its architecture context. Generated project stacks are dynamic. Foundrie must ask the user about preferences, explain technology trade-offs, research current versions with Context7 and official sources, and record the approved stack before generating implementation specs.

## Plan Before Implementation

Foundrie must plan before implementation-impacting work:

1. Generate a concrete plan.
2. Show the plan to the user.
3. Wait for explicit approval.
4. If the user requests changes, revise the plan and show the updated version.
5. Execute only after approval.

This gate applies to architecture proposals, diagram generation, context generation, feature-spec generation, project-specific skill generation, ZIP packaging, and coding-agent implementation. Passive discovery chat, upload intake, link collection, and research summarization can continue before approval.

## AI Firm

| Role | Model key | Responsibility |
|---|---|---|
| Principal Engineer | `gemini-2.5-pro` | discovery, planning, architecture |
| Staff Reviewer | `deepseek-r1` | critique, trade-offs, hidden risks |
| Tech Writer | `deepseek-v3` | context files, feature specs, RFCs |
| Senior SWE | `qwen-coder` | code-oriented implementation specs |
| Fast Chat | `groq-llama` | streaming UI responses |
| Research Team | `gemini-2.5-flash`, `kimi-k2` | comparisons and synthesis |

## Reliability Requirement

Every AI call goes through a provider abstraction and fallback chain. Foundrie should never surface raw model availability failures as the primary product experience. Attempts are logged and the next fallback is tried automatically.

## Research Workspace and Asset Corpus

Foundrie AI must treat research as a first-class project artifact. Every project has a research workspace where the user and AI collect the material that shaped the plan: conversation research, uploaded screenshots, image assets, frame ZIPs, extracted animation frames, research documents, pasted notes, web pages, Context7 documentation findings, scraped source summaries, technical comparisons, and model critiques.

Generated projects must export a `research/` folder, not a single loose research file. The main file is `research/PROJECT_RESEARCH.md`; additional research Markdown files and assets live beside it.

Foundrie AI itself follows the same rule. This repository has its own `research/` folder, and `research/PROJECT_RESEARCH.md` is read before the six context files during implementation. `research/FOUNDRIE_RESEARCH.md` is the master consolidated research document.

### Research Inputs

Foundrie should accept and analyze:

- User-uploaded screenshots, image assets, and inspiration images.
- Design reference screenshots from Pinterest, Dribbble, Awwwards, Behance, product sites, portfolios, and docs.
- ZIP archives of extracted image frames for animation planning.
- Markdown research documents and pasted research notes.
- PDF, Word, Excel, and PowerPoint research files.
- Image-frame sequences produced outside Foundrie from external animation/conversion workflows.
- Raw animation files are not uploaded to Foundrie. Users must convert motion references into image frames outside Foundrie and upload the frame ZIP.
- Links to web pages, documentation, articles, examples, galleries, and source repos.
- Context7 documentation lookups for the libraries selected by the project.
- Tavily web search, extract, crawl, and map results when `TAVILY_API_KEY` is configured.
- Obscura headless browser captures for JavaScript-heavy pages when configured.
- Manual notes from the engineer and AI during the planning conversation.

### Research Connectors

- Tavily handles search, extraction, crawl, and site mapping for normal web research.
- Obscura handles browser-rendered scraping and screenshots for JavaScript-heavy pages, animation references, and visual pages that cannot be captured with simple HTTP extraction.
- Context7 handles current framework/library/API documentation for implementation decisions.
- Vercel Blob stores raw uploaded and captured assets.
- PostgreSQL stores metadata, ownership, source URLs, extracted summaries, tags, and references to Blob objects.

### Visual and Motion Planning Example

If a user wants an Awwwards-level photography portfolio with GSAP and high-quality animations, Foundrie should preserve the whole planning chain:

1. User uploads start and end screenshots from Pinterest, Dribbble, Awwwards, or another reference site.
2. AI performs visual analysis: layout, composition, typography, color, motion intent, interaction pattern, and implementation risk.
3. User may create a motion reference in an external AI tool such as Higgs Field.
4. User exports the motion externally into image frames, packages those frames as a ZIP, and uploads the frame ZIP to Foundrie.
5. AI analyzes the frame sequence and turns it into an implementation plan: GSAP timeline, ScrollTrigger scenes, pinned sections, frame preloading strategy, responsive fallbacks, accessibility limits, and performance budget.
6. Foundrie stores the research notes, screenshots, frames, and final motion plan in `research/`.
7. Feature specs reference the research assets and implementation constraints explicitly.

### Model Roles in Research

- Gemini Pro plans research strategy, long-context synthesis, and architecture impact.
- Gemini Flash handles broad comparison and fast summaries.
- Kimi handles large document and long-page synthesis.
- DeepSeek R1 critiques feasibility, performance, legal/security risks, and trade-offs.
- DeepSeek V3 writes polished research Markdown and feature-spec references.
- Qwen Coder turns motion/visual research into implementation specs for GSAP, React, canvas, image sequences, and performance-safe code.
- Groq handles fast conversational clarification and quick labeling.

### Research Output Contract

The research corpus must be editable before ZIP export and must be included in generated context/spec generation. Generated feature specs should reference relevant research files or assets by path when a feature depends on visual, motion, UX, API, or technical research. When research reveals a repeatable workflow for the project, Foundrie should also generate project-specific agent skills in `.agents/skills/`.

Generated research subfolders are conditional. Empty placeholder folders are not exported.

## Authentication, Authorization, and RBAC Scope

Authentication and authorization are separate systems in Foundrie AI:

- Authentication answers "who are you?" Clerk owns identity, sessions, sign-in, sign-up, and session cookies.
- Authorization answers "what can you do?" Foundrie application code owns ownership checks, plan gates, and admin checks.

### Launch Auth Scope

Build only the auth surface that v1 needs:

- Clerk `ClerkProvider` in `app/layout.tsx`.
- Root `middleware.ts` using `clerkMiddleware` and `createRouteMatcher`.
- Public routes: `/`, `/pricing`, `/sign-in(.*)`, `/sign-up(.*)`, `/api/webhooks/clerk`.
- Protected app and API routes by default.
- Clerk webhook verified with Svix headers before syncing users.
- Local `User` row keyed by Clerk ID.
- `getAuthUser()` and `requireAuth()` helpers.
- User ownership scoping on every project-owned query.
- Plan and role fields on `User` for simple gates.
- Admin email helper using `ADMIN_EMAILS`.

Do not build team workspaces, per-project owner/editor/viewer RBAC, a custom admin portal, database Row-Level Security, ABAC, hardware-key administration, or audit logging until a later feature explicitly requires them.

### User Ownership Invariant

Every read, update, and delete query on user-owned data must include the authenticated local `user.id` in the `where` clause. Never trust `userId` from request JSON, search params, or route params.

When ownership fails, return `404 Not Found`, not `403 Forbidden`, so the API does not confirm whether another user's resource exists. Deletes must use `deleteMany({ where: { id, userId } })` or an equivalent scoped operation and return 404 when `count` is zero.

### Plan and Admin Model

The `User` model includes:

```prisma
plan UserPlan @default(FREE)
role UserRole @default(USER)

enum UserPlan {
  FREE
  PRO
  ENTERPRISE
}

enum UserRole {
  USER
  ADMIN
}
```

Plan gates are simple application helpers, not a billing system:

```ts
export const PLAN_LIMITS = {
  FREE: {
    maxProjects: 3,
    maxDiagramsPerProject: 5,
    maxFeatureSpecs: 10,
    canDownloadZip: true,
    canUseScaling: false,
  },
  PRO: {
    maxProjects: -1,
    maxDiagramsPerProject: -1,
    maxFeatureSpecs: -1,
    canDownloadZip: true,
    canUseScaling: true,
  },
  ENTERPRISE: {
    maxProjects: -1,
    maxDiagramsPerProject: -1,
    maxFeatureSpecs: -1,
    canDownloadZip: true,
    canUseScaling: true,
  },
} as const;
```

`POST /api/projects` must call `canCreateProject()` before creating a project. Admin access is checked with `isAdmin(user.email)` against `ADMIN_EMAILS`; non-admin API access returns 404.

## Incremental Feature Spec Methodology

Foundrie AI builds itself one feature at a time and generates user project specs using the same methodology.

### Rules

1. One feature, one spec.
2. Exact dependencies are mandatory.
3. Exact files to create, modify, or commands to run are mandatory.
4. Acceptance criteria must be binary pass/fail.
5. Out of scope is mandatory.
6. Future modifications are mandatory when the feature is intentionally minimal.
7. Later features may modify earlier work, but must be labeled `MODIFICATION`.
8. No logout, user menu, plan gate, admin route, or team permission can appear before its dependency exists.
9. Generate the smallest working step that moves the project forward.

### Generated Spec Template

```markdown
# Feature [##] - [Feature Name]

## Type
NEW FEATURE | MODIFICATION (modifies Feature: ___)

## What This Delivers
[One paragraph describing what is true after this feature ships.]

## Dependencies
- Feature [##] ([name]) must be complete before starting.

## Files
CREATE: path/to/file
MODIFY: path/to/file - specific change
RUN: command if needed

## Implementation Notes
- Security, data, UI, API, and performance decisions required for this feature only.

## Out of Scope
- Related behavior that must not be built yet.

## Future Modifications
- Feature [##]: what will change later and why.

## Acceptance Criteria
- [ ] Binary pass/fail criterion.
- [ ] No TypeScript errors.
- [ ] Required tests or verification pass.
```

## Diagram Categories

- Structural: class, component, object, deployment, package.
- Behavioral: use case, sequence, activity, state machine.
- Architectural: C4 context, C4 container, C4 component, microservices map, system context.
- Data: DFD level 0, DFD level 1, ER.
- Infrastructure: AWS architecture, network.

## Shape Libraries

- Class: class box, interface, abstract, association, aggregation, composition, inheritance, dependency.
- Sequence: lifeline, actor, activation bar, combined fragment, synchronous message, asynchronous message, return message.
- ER: entity, weak entity, attribute, relationship, one-to-many, many-to-many, one-to-one.
- C4 context: person, system, external system, relationship.
- C4 container: person, container, database, external system, relationship.
- Microservices: service, API gateway, message bus, database, load balancer, cache.

## Sequential Diagram Pipeline

Each planned diagram job includes:

- `id`
- `diagramTypeId`
- `category`
- `name`
- `folderPath`
- `fileName`
- `status`
- `reactFlowData`
- `pngBuffer`
- `errorMessage`
- `startedAt`
- `completedAt`

Statuses are `queued`, `generating`, `rendering`, `capturing`, `done`, and `error`. Jobs run one at a time. Failed jobs are recorded and the pipeline continues.

## ZIP Contract

The export package is named `{project-slug}_{YYYY-MM-DD_HH-mm-ss}.zip` and contains root `AGENTS.md`, root `ARTKINS_STYLE_GUIDE.md`, `context/`, `feature-specs/`, `diagrams/`, `requirements/`, and `research/PROJECT_RESEARCH.md`.

```text
{project-slug}_{timestamp}/
|-- AGENTS.md
|-- ARTKINS_STYLE_GUIDE.md
|-- .agents/                     (optional)
|   `-- skills/
|       |-- project-research/
|       |   `-- SKILL.md
|       `-- ... project-specific skills
|-- context/
|   |-- project-overview.md
|   |-- architecture-context.md
|   |-- ui-context.md
|   |-- code-standards.md
|   |-- ai-workflow-rules.md
|   `-- progress-tracker.md
|-- feature-specs/
|-- research/
|   |-- PROJECT_RESEARCH.md
|   `-- ... populated research subfolders only
|-- diagrams/
|   |-- structural/
|   |-- behavioral/
|   |-- architectural/
|   |-- data/
|   `-- infrastructure/
`-- requirements/
    |-- discovery-notes.md
    |-- requirements-analysis.md
    `-- architecture-decisions.md
```

## Database Models

- `User`: `id`, `clerkId`, `email`, `name`, `plan`, `role`, timestamps.
- `Project`: owner relation, `name`, `slug`, `description`, `status`, denormalized counters, ZIP metadata, timestamps.
- `Conversation`: project relation, phase, JSON messages.
- `Requirements`: project relation, discovery notes, analysis doc, ADR doc, functional JSON, non-functional JSON, hidden requirements, scale estimates.
- `Diagram`: project relation, name, diagram type, category, order, React Flow nodes/edges, PNG URL, file name, status, error, generated timestamp.
- `ContextFile`: project relation, file name, file type, content.
- `FeatureSpec`: project relation, order, title, content.
- `ResearchDocument`: project relation, title, file name, content, source type, tags.
- `ResearchAsset`: project relation, asset type, original file name, Blob URL/path, optional source URL, dimensions/metadata, tags, AI summary.
- `ResearchSource`: project relation, URL, provider, status, extracted title/content/summary, captured screenshot URL, tags.
- `ProjectAgentSkill`: project relation, skill slug, file path, content, description, tags, timestamps.
- `ExecutionPlan`: project relation, task type, plan Markdown, status, revision notes, approval timestamp, execution timestamp, timestamps.

## Scalable Neon Postgres Strategy

Foundrie AI uses Neon Postgres as the production database. The user supplies the Neon connection URI values through environment variables. The application must never use an unpooled direct connection for runtime traffic.

### Connection Strategy

```text
Runtime app queries: DATABASE_URL, the Neon pooled URL with the `-pooler` endpoint.
Prisma CLI and migrations: DIRECT_URL, the direct Neon URL without `-pooler`.
```

Prisma datasource:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

This matches the current Prisma and Neon guidance checked through Context7: use the pooled connection for Prisma Client runtime and the direct URL for Prisma CLI/migrations.

### Why This Is Required

- Serverless functions can create many concurrent connections.
- PostgreSQL uses process-backed connections, so direct connection fanout can exhaust memory and connection limits.
- Neon's PgBouncer pooler multiplexes many app connections onto a smaller set of real database connections.
- Prisma Migrate needs the direct URL because migration workflows can fail against PgBouncer.

### Read/Write Split

- Use `db` for all writes and strongly consistent read-after-write operations.
- Use `db` for dashboard/list queries, ZIP builder reads, artifact listings, and other read-heavy flows.
- Reads that immediately follow a write and must reflect it must use `db`.

### Required Indexing Strategy

Every foreign key is explicitly indexed. Dashboard, ZIP, diagram generation, and ordered-list paths get composite indexes.

```prisma
model Project {
  @@index([userId])
  @@index([userId, updatedAt(sort: Desc)])
  @@index([slug])
  @@index([status])
}

model Conversation {
  @@index([projectId, phase])
  @@index([projectId, updatedAt(sort: Desc)])
}

model Diagram {
  @@index([projectId])
  @@index([projectId, category, orderInCategory])
}

model ContextFile {
  @@unique([projectId, fileType])
  @@index([projectId, fileType])
}

model FeatureSpec {
  @@unique([projectId, order])
  @@index([projectId, order])
}

model ResearchDocument {
  @@index([projectId])
  @@index([projectId, sourceType])
}

model ResearchAsset {
  @@index([projectId])
  @@index([projectId, assetType])
}

model ResearchSource {
  @@index([projectId])
  @@index([projectId, provider])
  @@index([projectId, status])
}

model ProjectAgentSkill {
  @@unique([projectId, slug])
  @@index([projectId])
}

model ExecutionPlan {
  @@index([projectId])
  @@index([projectId, status])
  @@index([projectId, taskType])
}
```

Partial indexes are added through raw SQL migrations because Prisma does not model every PostgreSQL partial-index pattern:

```sql
CREATE INDEX CONCURRENTLY idx_diagrams_generating
ON diagrams(project_id, updated_at)
WHERE status IN ('QUEUED', 'GENERATING', 'RENDERING', 'CAPTURING');

CREATE INDEX CONCURRENTLY idx_diagrams_has_png
ON diagrams(project_id)
WHERE png_storage_url IS NOT NULL;
```

### Query Discipline

- Never use offset pagination on list endpoints. Use cursor pagination.
- Never fetch large JSON fields such as `reactFlowNodes`, `reactFlowEdges`, or conversation `messages` unless the view needs them.
- Always use `select` for list views.
- Avoid N+1 Prisma queries. Use eager loading, grouped queries, or explicit batching.
- Run `EXPLAIN ANALYZE` for any query over 100ms, and investigate any query over 50ms during load testing.

### Consistency Rules

- Foundrie is an ACID-first system.
- ZIP generation should read from a consistent snapshot. Use `RepeatableRead` for multi-table ZIP collection when possible.
- Use `Serializable` only for compare-then-write ordering flows such as assigning the next feature-spec order concurrently.
- Eventual consistency is acceptable only for progress indicators, dashboard freshness, analytics, and minor delay lag.

### Vacuum and Table Bloat

`diagrams` and `conversations` are write-heavy because statuses and messages change frequently. Add a production migration to tune autovacuum:

```sql
ALTER TABLE diagrams SET (
  autovacuum_vacuum_scale_factor = 0.01,
  autovacuum_analyze_scale_factor = 0.005,
  autovacuum_vacuum_cost_delay = 2
);

ALTER TABLE conversations SET (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_analyze_scale_factor = 0.01,
  autovacuum_vacuum_cost_delay = 2
);
```

### Monitoring

Enable `pg_stat_statements` in Neon and track:

- Active connection count by state.
- Slow queries by mean execution time.
- Cache hit ratio, target above 99%.
- Dead tuple ratio on write-heavy tables.
- Unused indexes that add write overhead.

### Scaling Stages

- Launch to 1,000 users: pooled URL, direct migration URL, all indexes, cursor pagination, query discipline, autovacuum tuning, transaction timeouts, `pg_stat_statements`.

## API Routes

```text
/api/webhooks/clerk
/api/projects
/api/projects/[projectId]
/api/projects/[projectId]/download
/api/conversations/[projectId]/chat
/api/requirements/[projectId]/generate
/api/requirements/[projectId]
/api/diagrams/[projectId]/plan
/api/diagrams/[projectId]/generate
/api/diagrams/[projectId]/status
/api/diagrams/[projectId]/[diagramId]
/api/diagrams/[projectId]/[diagramId]/capture
/api/context-files/[projectId]/generate
/api/context-files/[projectId]/[fileType]
/api/feature-specs/[projectId]/generate
/api/feature-specs/[projectId]
/api/feature-specs/[projectId]/[specId]
/api/research/[projectId]/documents
/api/research/[projectId]/assets
/api/research/[projectId]/upload
/api/research/[projectId]/links
/api/research/[projectId]/analyze
/api/research/[projectId]/synthesize
```

## Frontend App Shape

```text
app/
|-- (marketing)/
|-- (auth)/
|-- (app)/
|   |-- dashboard/
|   |-- projects/new/
|   `-- projects/[projectId]/
|       |-- discovery/
|       |-- requirements/
|       |-- architecture/
|       |-- diagrams/
|       |-- specs/
|       |-- research/
|       `-- export/
`-- api/
```

## Feature Roadmap

1. Design system
2. Auth
3. Database schema
4. Project CRUD
5. AI rotation engine
6. Layout shell
7. Research library
8. Visual and motion research analysis
9. Web research connectors
10. Discovery chat
11. Requirements generation
12. Requirements review UI
13. Architecture proposal
14. React Flow canvas
15. Diagram type selector
16. Custom node types
17. Custom edge types
18. Diagram planning
19. Sequential generation
20. Diagram storage
21. Canvas export
22. Project overview generation
23. Architecture context generation
24. UI context generation
25. Code standards generation
26. Feature specs generation
27. Project-specific agent skills generation
28. AGENTS.md generation
29. Progress tracker generation
30. ZIP builder
31. Trigger ZIP job
32. Download button
33. Liveblocks presence
34. Project settings
