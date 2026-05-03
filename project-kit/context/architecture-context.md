# Architecture Context

## Stack

| Layer | Technology | Role |
|---|---|---|
| Framework | Next.js 16 App Router + TypeScript strict mode | Full-stack app, route handlers, server components, and client islands |
| Auth | Clerk | User identity, sessions, protected routes, webhooks |
| Database | PostgreSQL on Neon + Prisma | Relational metadata, generated content records, project phases |
| Realtime | Liveblocks | Presence, live cursors, room auth, collaborative state |
| Canvas | React Flow (`@xyflow/react`) | Diagram canvas, nodes, edges, viewport, interactions |
| Background jobs | Trigger.dev v3 | Durable AI workflows, diagram batches, ZIP generation |
| AI providers | Gemini, OpenRouter, Groq, DeepSeek | Role-based model orchestration with fallbacks |
| ZIP generation | JSZip | Server-side ZIP packaging |
| Artifact storage | Vercel Blob | ZIPs, diagram PNGs, canvas snapshots, exported artifacts |
| Web research | Tavily | Search, extract, crawl, and map when API key is configured |
| Browser scraping | Obscura | JavaScript-rendered capture and screenshots for visual/web research |
| Diagram capture | html-to-image or Konva | Canvas-to-PNG export |
| UI | Tailwind CSS v4, shadcn/ui, Lucide React, Framer Motion | Product UI and interaction polish |
| Deployment | Vercel | Hosting, environment variables, serverless route handlers |

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

# Neon pooled runtime URL. Must use the `-pooler` Neon endpoint.
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"

# Neon direct URL. Used only by Prisma CLI and migrations.
DIRECT_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"


TRIGGER_SECRET_KEY=...
BLOB_READ_WRITE_TOKEN=...

NEXT_PUBLIC_APP_URL=https://foundrieai.com

# Optional research connectors
TAVILY_API_KEY=...
OBSCURA_ENDPOINT=...
```

## Context7 Documentation IDs

Agents must verify implementation details with Context7 before coding library-specific behavior.


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


## Agent Skills Architecture

Foundrie AI intelligently manages AI agent skills for both its internal execution and generated projects.

### Foundrie's Internal Skills
Foundrie dynamically parses `skills-lock.json` and `.agents/skills/*/SKILL.md` to identify and utilize available skills.
- It leverages universal utility skills (e.g., `code-review`, `autofix`, `context7-cli`, document parsers) for its core workflow.
- It utilizes stack-specific skills matching its own architecture (e.g., `clerk-nextjs-patterns`, `trigger-tasks`) when modifying those subsystems.

### Generated Project Skills
Foundrie acts as a dynamic skill installer for generated projects. Instead of a hardcoded whitelist, it:
1. **Parses Installed Skills**: Reads `skills-lock.json` and `.agents/skills/` to discover all locally available skills.
2. **Provisions Universal Skills**: Automatically installs baseline capabilities (e.g., code review, documentation lookup) into every project.
3. **Provisions Stack-Dependent Skills**: Evaluates the approved `architecture-context.md` for the generated project and installs relevant skills (e.g., matching `clerk-vue-patterns` if the project uses Vue, or `liveblocks-best-practices` if the project uses realtime features).

## Artkins Policy and Planning Gate

- Root `ARTKINS_STYLE_GUIDE.md` is the canonical engineering, UX, security, scalability, and no-AI-slope policy.
- Foundrie exports `ARTKINS_STYLE_GUIDE.md` into every generated project package.
- Foundrie AI's own stack is fixed by this architecture context. Generated project stacks are dynamic.
- Foundrie must discuss stack options with the user, explain trade-offs, research current versions with Context7 and official sources, and record the approved stack before generating implementation specs.
- Implementation-impacting work must be planned, shown to the user, and explicitly approved before execution.
- If the user requests revisions, Foundrie updates the plan and presents the revised plan before executing.
- The planning gate applies to architecture proposals, diagram generation, context/spec generation, project-specific skill generation, ZIP packaging, and coding-agent implementation.
- Passive discovery chat, upload intake, link collection, and research summarization can run before approval.

## System Boundaries

- `app` - App Router pages, layouts, route handlers, and server components.
- `app/api` - Authenticated endpoints, input validation, ownership checks, job triggers, and metadata persistence.
- `components` - UI composition, canvas components, chat, diagram generation UI, project surfaces, and shadcn wrappers.
- `lib/ai` - model routing, provider adapters, fallback chains, rotation engine, prompts, and output schemas.
- `lib/diagrams` - diagram categories, shape libraries, generation planning, sequential runner, layout helpers, and validation.
- `lib/db` or `lib/prisma.ts` - Prisma client singleton and database helpers.
- `lib/storage` - Vercel Blob helpers for ZIP, PNG, canvas, and generated Markdown artifacts.
- `lib/research` - research ingestion, Tavily/Obscura/Context7 source capture, visual asset analysis, research synthesis, and export helpers.
- `trigger` - durable Trigger.dev jobs: diagram generation, context generation, feature-spec generation, and ZIP generation.
- `prisma` - schema, migrations, generated client, and seed data.
- `.agents/skills` - project-local agent skills, including Context7 skills.
- `research` - Foundrie AI's own research corpus, mirroring the generated project `research/` export contract.

## Authentication and Authorization Model

Authentication and authorization are deliberately separate:

- Clerk authenticates users and owns sessions.
- Foundrie authorization code enforces user ownership, plan limits, and admin access.

Launch scope:

- Root `middleware.ts` protects app and API routes by default with Clerk.
- Public routes are `/`, `/pricing`, `/sign-in(.*)`, `/sign-up(.*)`, and `/api/webhooks/clerk`.
- `app/layout.tsx` wraps the app in `ClerkProvider`.
- `app/api/webhooks/clerk/route.ts` verifies Svix signatures before user sync.
- `lib/auth/get-auth-user.ts` maps the Clerk session to the local `User`.
- `lib/auth/require-auth.ts` is required in every route that touches user data.
- `lib/auth/plan-limits.ts` owns free/pro/enterprise limits.
- `lib/auth/is-admin.ts` checks `ADMIN_EMAILS` for the tiny internal admin gate.

### Collaboration Authorization Model

Foundrie uses a 2-role authorization model enforced at the application layer:

- **Owner**: The user who created the project. Can manage project settings, invite/remove members, delete the project, and perform all canvas and AI operations.
- **Collaborator**: A user invited by the Owner. Can edit the canvas, create/edit/delete diagrams, use AI generation, and download the ZIP. Cannot modify project settings, delete the project, or manage members.

Authorization helpers in `lib/auth/project-access.ts`:

- `requireProjectOwner(projectId, userId)` — gate for owner-only operations.
- `requireProjectMember(projectId, userId)` — gate for shared operations (Owner or Collaborator).
- `getProjectRole(projectId, userId)` — returns `OWNER`, `COLLABORATOR`, or `null` for UI conditional rendering.

#### Permission Matrix

| Action | Owner | Collaborator |
|---|---|---|
| View project | ✅ | ✅ |
| Edit canvas / diagrams | ✅ | ✅ |
| Use AI generation | ✅ | ✅ |
| Download ZIP | ✅ | ✅ |
| View members list | ✅ | ✅ |
| Edit project name/description | ✅ | ❌ |
| Delete project | ✅ | ❌ |
| Invite collaborators | ✅ | ❌ |
| Remove collaborators | ✅ | ❌ |
| Regenerate sections | ✅ | ❌ |
| Leave project | ❌ (must transfer) | ✅ |

Do not build PostgreSQL RLS, ABAC, audit logging, or hardware-key admin controls unless a later feature explicitly requires them.

### Ownership Rules

- Every read, update, and delete on user-owned data must include local `user.id` in the Prisma `where` clause.
- `userId` must come from the authenticated Clerk session mapped through the local `User` table.
- Never trust `userId` from body JSON, query params, or route params.
- Return 404, not 403, when an ownership check fails.
- Deletes use scoped `deleteMany({ where: { id, userId } })` or equivalent and return 404 when no row is affected.

### Plan and Admin Rules

- `User.plan` gates resource limits.
- `User.role` exists for internal classification, but v1 admin access is still checked through `ADMIN_EMAILS`.
- Non-admin API access to admin endpoints returns 404.

## Application Phases

1. `DISCOVERY` - interview in progress.
2. `REQUIREMENTS` - requirements are being analyzed.
3. `ARCHITECTURE` - architecture proposal and critique.
4. `DIAGRAM_GENERATION` - diagram jobs are planned and generated sequentially.
5. `SPEC_GENERATION` - context files and feature specs are written.
6. `COMPLETE` - ZIP package is ready.

## AI Firm Model

| Role | Model key | Primary use |
|---|---|---|
| Principal Engineer | `gemini-2.5-pro` | discovery, requirements surfacing, architecture proposal, long-context planning |
| Staff Reviewer | `deepseek-r1` | critique, scalability review, security review, trade-off analysis |
| Tech Writer | `deepseek-v3` | context files, feature specs, RFCs, API docs, AGENTS.md |
| Senior SWE | `qwen-coder` | Prisma schema, Next.js routes, React Flow nodes, code standards |
| Fast Chat | `groq-llama` | quick replies, streaming chat, label suggestions |
| Research Team | `gemini-2.5-flash`, `kimi-k2` | comparison, synthesis, large document analysis |

## Model Task Map

| Task group | Tasks | Model key |
|---|---|---|
| Discovery and planning | `discovery_interview`, `requirements_surfacing`, `architecture_proposal`, `non_functional_analysis`, `long_context_planning` | `gemini-2.5-pro` |
| Reasoning and critique | `trade_off_analysis`, `scalability_review`, `security_review`, `architecture_critique`, `infrastructure_decisions`, `hidden_requirement_detect` | `deepseek-r1` |
| Structured writing | `feature_spec_generation`, `project_overview_md`, `architecture_context_md`, `agents_md_generation`, `api_contract_docs`, `rfc_generation`, `progress_tracker_md`, `ai_workflow_rules_md` | `deepseek-v3` |
| Code and implementation specs | `prisma_schema_gen`, `react_flow_node_gen`, `nextjs_route_gen`, `ui_component_specs`, `code_standards_md`, `typescript_patterns` | `qwen-coder` |
| Fast conversation | `chat_quick_reply`, `streaming_chat`, `diagram_label_suggestions` | `groq-llama` |
| Research and synthesis | `tech_comparison`, `pattern_research`, `large_doc_analysis` | `gemini-2.5-flash` or `kimi-k2` |

## Fallback Chains

Every AI call uses `callAI(task, params, overrideModelKey?)`. The engine resolves the task to a model key, reads that key's fallback chain, checks provider availability, calls the provider, logs the attempt, and continues until a response succeeds or every fallback fails.

| Model key | Fallback chain |
|---|---|
| `gemini-2.5-pro` | Gemini Pro -> Gemini Flash -> OpenRouter DeepSeek Chat -> OpenRouter Qwen3 free -> OpenRouter Llama Maverick free |
| `gemini-2.5-flash` | Gemini Flash -> Gemini Pro -> Groq Llama 70B -> OpenRouter Qwen3 free |
| `deepseek-r1` | DeepSeek Reasoner -> OpenRouter DeepSeek R1 -> OpenRouter DeepSeek R1 free -> Gemini Pro -> OpenRouter QwQ free |
| `deepseek-v3` | DeepSeek Chat -> OpenRouter DeepSeek Chat -> OpenRouter DeepSeek Chat free -> Gemini Flash -> OpenRouter Qwen3 free |
| `qwen-coder` | OpenRouter Qwen Coder -> OpenRouter Qwen Coder free -> OpenRouter DeepSeek Chat -> OpenRouter Qwen3 free -> Groq Llama 70B |
| `groq-llama` | Groq Llama 70B -> Groq Llama 8B instant -> Groq Gemma2 -> Gemini Flash -> OpenRouter Qwen3 free |
| `kimi-k2` | OpenRouter Kimi K2 -> OpenRouter Kimi K2 free -> Gemini Pro -> OpenRouter DeepSeek Chat |

## Provider Abstraction

All providers implement:

```ts
interface AIProvider {
  name: string;
  call(params: AICallParams): Promise<AIResponse>;
  isAvailable(): Promise<boolean>;
}

interface AICallParams {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

interface AIResponse {
  text: string;
  model: string;
  provider: string;
  tokensUsed?: number;
}
```

Provider adapters belong in `lib/ai/providers/`. Direct calls to external AI APIs are not allowed outside those adapters.

## AI Conversation Flow

### Phase 1 - Discovery Interview

The discovery assistant acts as a principal engineer. It asks exactly one question at a time and covers: users, scale, read/write patterns, consistency, uptime/SLA, budget, team expertise, infrastructure constraints, security/compliance, and failure modes.

After roughly 8-12 exchanges, it synthesizes:

- Functional requirements.
- Non-functional requirements.
- Hidden requirements.
- Scale estimates.
- Security and compliance risks.

### Phase 2 - Requirements Surfacing

Deep reasoning extracts requirements, identifies bottlenecks, flags security risks, and proposes architectural approaches with trade-offs.

### Phase 3 - Architecture Proposal

The orchestrator proposes a high-level architecture and creates initial diagram data for review on the canvas.

### Phase 4 - Sequential Diagram Generation

The diagram planner creates an ordered list of diagram jobs. Jobs run one at a time, render to canvas, capture as PNG, and persist output.

### Phase 5 - Context and Feature Specs

Structured document generation writes the six context files, root AGENTS.md, and N ordered feature specs.

### Research Phase - Continuous

Research runs throughout discovery, requirements, architecture, UI planning, and spec generation. It collects uploaded image assets, screenshots, frame ZIPs, extracted frames, Markdown/pasted notes, PDF/Word/Excel/PowerPoint research files, scraped sources, Context7 documentation findings, and AI/engineer notes into the project research corpus. Later generation phases must read the research corpus and cite relevant `research/` paths in generated docs/specs.

## Diagram System

Diagram categories:

- `structural`: class, component, object, deployment, package.
- `behavioral`: use case, sequence, activity, state machine.
- `architectural`: C4 context, C4 container, C4 component, microservices map, system context.
- `data`: DFD level 0, DFD level 1, ER diagram.
- `infrastructure`: AWS architecture, network diagram.

Each diagram type maps to a shape library. Shape libraries must expose both node definitions and edge definitions where relevant.

Examples:

- Class diagrams: class, interface, abstract, association, aggregation, composition, inheritance, dependency.
- Sequence diagrams: lifeline, actor, activation bar, fragment, sync message, async message, return message.
- ER diagrams: entity, weak entity, attribute, relationship, one-to-many, many-to-many, one-to-one.
- C4 diagrams: person, system, container, database, external system, relationship.
- Microservices maps: service hex, gateway, message bus, database, load balancer, cache.

## Sequential Diagram Pipeline

Diagram job status values:

- `queued`
- `generating`
- `rendering`
- `capturing`
- `done`
- `error`

Required job fields:

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

The runner must continue after a single diagram fails. Failed jobs must create an error placeholder in the ZIP output.

## ZIP Output Contract

ZIP file name:

```text
{project-slug}_{YYYY-MM-DD_HH-mm-ss}.zip
```

ZIP structure. `.agents/skills/`, research asset subfolders, and diagram category folders are included only when populated.

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
|   |-- 01-auth.md
|   |-- 02-database-schema.md
|   `-- ...
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

## Database Schema

Core models:

- `User`: Clerk-linked user record.
- `Project`: owner, name, slug, status, ZIP metadata, phase metadata.
- `Conversation`: phase-scoped message history.
- `Requirements`: discovery notes, analysis doc, ADR doc, functional/NFR JSON, hidden requirements, scale estimates.
- `Diagram`: type, category, React Flow JSON, PNG URL, file name, status.
- `ContextFile`: generated context files and AGENTS.md content.
- `FeatureSpec`: ordered feature specs.
- `ResearchDocument`: project research Markdown and extracted research notes.
- `ResearchAsset`: Blob-backed research asset metadata.
- `ResearchSource`: URL/documentation/source capture metadata.
- `ProjectAgentSkill`: generated project-specific agent skills.
- `ExecutionPlan`: user-reviewed plans for implementation-impacting work.
- `ProjectMember`: project membership for Owner/Collaborator authorization.

## Neon Postgres Architecture

Foundrie AI uses Neon Postgres as the required PostgreSQL provider. The user supplies the Neon connection URI values through environment variables.

### Connection Rules

Foundrie AI's data layer operates perfectly on a 2-connection architecture:

- **`DATABASE_URL` (Pooled)**: Points to the primary database with `-pooler` in the URL. Used by the application at runtime for all queries. The pooler prevents Next.js serverless functions from exhausting the database's connection limit.
- **`DIRECT_URL` (Unpooled)**: Points to the primary database without the pooler. Used **only** by the Prisma CLI for `npm run db:migrate` and `npm run db:push`, because altering database schemas requires a persistent, 1-to-1 connection.

- Runtime code must not use the direct connection URL.

Prisma datasource:

```prisma
datasource db {
  provider = "postgresql"
}
```

URLs are configured in `prisma.config.ts`.

### Database Scripts

Agents must use the following `package.json` scripts:
- `npm run db:generate` to generate the client.
- `npm run db:migrate` to run migrations.
- `npm run db:push` to sync schema without migrations (if applicable).
- `npm run db:studio` to open the studio.

### Prisma Client

- The repository uses one Prisma client instance named `db` (pooled primary connection for both reads and writes, compatible with the Neon free-tier 2-connection strategy).
- Prisma client instances are cached on `globalThis` in development to avoid hot-reload connection leaks.

### Consistency Model

- Foundrie is ACID-first. Relational state must be strongly consistent.
- Eventual consistency is acceptable only for progress UI, dashboard freshness, analytics, and eventual consistency reads.
- ZIP generation should use a consistent read snapshot for multi-table reads.

### Model Field Requirements

`User`

- `id`, `clerkId`, `email`, `name`, `plan`, `role`, `createdAt`, `updatedAt`.
- Unique constraints on `clerkId` and `email`.
- Relation to owned projects.

`Project`

- `id`, `userId`, `name`, `slug`, optional `description`, `status`.
- Denormalized counters: `diagramCount`, `completedDiagramCount`, `featureSpecCount`.
- ZIP metadata: `lastZipUrl`, `lastZipGeneratedAt`, `lastZipFileName`.
- Timestamps.
- Relations: conversations, requirements, diagrams, contextFiles, featureSpecs.
- Indexes on `userId`, `[userId, updatedAt]`, `slug`, and `status`.

`Conversation`

- `id`, `projectId`, `phase`, `messages`, `createdAt`, `updatedAt`.
- `messages` is JSON containing `{ role, content, timestamp }`.
- Indexes on `[projectId, phase]` and `[projectId, updatedAt]`.

`Requirements`

- `id`, unique `projectId`.
- `discoveryNotes`, `analysisDoc`, `adrDoc`.
- JSON fields: `functional`, `nonFunctional`, `hiddenReqs`, `scaleEstimates`.
- Timestamps.

`Diagram`

- `id`, `projectId`, `name`, `diagramTypeId`, `category`, `orderInCategory`.
- React Flow data: `reactFlowNodes`, `reactFlowEdges`.
- Output data: `pngStorageUrl`, `fileName`.
- Status data: `status`, `errorMessage`, `generatedAt`.
- Timestamps and indexes on `projectId` and `[projectId, category, orderInCategory]`.
- Partial SQL indexes for generating diagrams and diagrams with PNGs.

`ContextFile`

- `id`, `projectId`, `fileName`, `fileType`, `content`, timestamps.
- Unique constraint on `[projectId, fileType]`.

`FeatureSpec`

- `id`, `projectId`, `order`, `title`, `content`, timestamps.
- Unique constraint on `[projectId, order]`.
- Index on `[projectId, order]`.

`ResearchDocument`

- `id`, `projectId`, `title`, `fileName`, `content`, `sourceType`, `tags`, timestamps.
- Used for `PROJECT_RESEARCH.md`, technical research notes, visual analysis notes, motion plans, source summaries, and Context7 findings.

`ResearchAsset`

- `id`, `projectId`, `assetType`, `originalFileName`, `blobUrl`, optional `sourceUrl`, `mimeType`, `sizeBytes`, optional dimensions metadata, `tags`, `aiSummary`, timestamps.
- Stores uploaded screenshots, image assets, inspiration images, frame ZIPs, extracted frames, research document files, captured screenshots, and other large research assets in Vercel Blob.
- Asset types are image asset, screenshot, inspiration, document, frame ZIP, frame, and scrape capture.

`ResearchSource`

- `id`, `projectId`, `url`, `provider`, `status`, `title`, `extractedContent`, `summary`, optional `screenshotBlobUrl`, `tags`, timestamps.
- Provider values include manual, Context7, Tavily, Obscura, and upload-derived sources.

`ProjectAgentSkill`

- `id`, `projectId`, `slug`, `filePath`, `content`, `description`, `tags`, timestamps.
- Unique constraint on `[projectId, slug]`.
- Used to export `.agents/skills/<slug>/SKILL.md` only when project-specific skills exist.

`ExecutionPlan`

- `id`, `projectId`, `taskType`, `content`, `status`, `revisionNotes`, `approvedAt`, `executedAt`, timestamps.
- Status values: `PROPOSED`, `APPROVED`, `REVISION_REQUESTED`, `REJECTED`, `EXECUTED`.
- Used to enforce user approval before implementation-impacting generation or coding work.

### Required Indexes

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

Raw SQL migration for partial indexes:

```sql
CREATE INDEX CONCURRENTLY idx_diagrams_generating
ON diagrams(project_id, updated_at)
WHERE status IN ('QUEUED', 'GENERATING', 'RENDERING', 'CAPTURING');

CREATE INDEX CONCURRENTLY idx_diagrams_has_png
ON diagrams(project_id)
WHERE png_storage_url IS NOT NULL;
```

### Database Performance Invariants

1. Every foreign key used in joins or ownership checks is indexed.
2. Dashboard and list endpoints use cursor pagination, never offset pagination.
3. List queries use `select` and must not fetch large JSON columns unless needed.
4. No N+1 Prisma query loops are allowed.
5. Slow queries over 100ms require `EXPLAIN ANALYZE`.
6. Read-heavy flows use `db` when they do not require immediate read-after-write consistency.
7. Write-heavy tables receive autovacuum tuning migrations.

Project statuses:

- `DISCOVERY`
- `REQUIREMENTS`
- `ARCHITECTURE`
- `DIAGRAM_GENERATION`
- `SPEC_GENERATION`
- `COMPLETE`

User plans:

- `FREE`
- `PRO`
- `ENTERPRISE`

User roles:

- `USER`
- `ADMIN`

## API Route Map

```text
/api/webhooks/clerk
/api/projects
/api/projects/[projectId]
/api/projects/[projectId]/download
/api/conversations/[projectId]/chat
/api/requirements/[projectId]
/api/requirements/[projectId]/generate
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
/api/projects/[projectId]/members
/api/projects/[projectId]/members/[memberId]
```

## Frontend Route Structure

```text
app/
|-- (marketing)/
|   |-- page.tsx
|   `-- pricing/page.tsx
|-- (auth)/
|   |-- sign-in/[[...sign-in]]/page.tsx
|   `-- sign-up/[[...sign-up]]/page.tsx
|-- (app)/
|   |-- layout.tsx
|   |-- dashboard/page.tsx
|   |-- projects/new/page.tsx
|   `-- projects/[projectId]/
|       |-- page.tsx
|       |-- discovery/page.tsx
|       |-- requirements/page.tsx
|       |-- architecture/page.tsx
|       |-- diagrams/page.tsx
|       |-- specs/page.tsx
|       |-- research/page.tsx
|       `-- export/page.tsx
`-- api/
```

## Core Component Structure

```text
components/
|-- canvas/
|   |-- DiagramCanvas.tsx
|   |-- DiagramSidebar.tsx
|   |-- nodes/
|   `-- edges/
|-- chat/
|   |-- DiscoveryChat.tsx
|   |-- ArchitectureChat.tsx
|   `-- ChatMessage.tsx
|-- diagram-generation/
|   |-- GenerationProgress.tsx
|   |-- DiagramPreview.tsx
|   `-- GenerationControls.tsx
|-- project/
|   |-- DownloadZipButton.tsx
|   |-- ProjectPhaseNav.tsx
|   |-- RequirementsReview.tsx
|   `-- FeatureSpecsList.tsx
|-- research/
|   |-- ResearchLibrary.tsx
|   |-- ResearchUploader.tsx
|   |-- ResearchSourceList.tsx
|   |-- VisualReferenceGrid.tsx
|   `-- MotionPlanViewer.tsx
`-- ui/
```

## ZIP Generation Behavior

- `POST /api/projects/[projectId]/download` checks auth and project ownership.
- If a ZIP was generated in the last 10 minutes, return cached metadata.
- Otherwise trigger `generate-project-zip` through Trigger.dev and return `runId`.
- `GET /api/projects/[projectId]/download?runId=...` polls run status.
- When complete, return ZIP URL/path and file name.
- Client `DownloadZipButton` shows packaging messages, polls, and triggers browser download.

## Prompt Contracts

- Discovery prompt asks one question at a time and synthesizes only after enough context.
- Requirements prompt extracts functional, non-functional, hidden, scale, security, and trade-off information.
- Diagram prompts return only valid JSON with `nodes` and `edges`.
- AGENTS.md generation prompt must brief a senior coding agent with reading order, feature order, hard rules, diagrams, and current status.
- AGENTS.md generation prompt must require reading root `ARTKINS_STYLE_GUIDE.md` before coding.
- Planning prompts must show a plan, wait for approval, and revise the plan when the user asks for changes before execution.
- Architecture-context generation prompt must include a researched, user-approved stack decision. It must not copy Foundrie's own stack unless the user chose it or the research justifies it.
- Version prompts must use Context7 and official release/install sources before writing package versions into generated specs.
- Feature spec generation prompt must follow the incremental methodology: one feature per spec, exact dependencies, exact files, explicit out of scope, future modifications, and binary acceptance criteria.
- Research synthesis prompt must produce `research/PROJECT_RESEARCH.md` and supporting research documents that summarize uploaded assets, frame ZIPs, extracted frames, research files, links, scraped data, visual references, motion references, Context7 findings, technical decisions, open questions, and implementation implications.
- Visual/motion research prompts must identify animation intent, source assets, frame sequence strategy, GSAP/ScrollTrigger implementation notes when relevant, accessibility/performance constraints, and generated asset paths.
- Project-specific skill generation prompt must turn repeatable research-backed workflows into `.agents/skills/<skill-name>/SKILL.md` files, such as frame-sequence animation implementation, domain-specific API usage, or project-specific research interpretation.
- All generated output is parsed and validated before persistence.

## Invariants

1. Context7 docs are required before implementing library-specific code.
2. Route handlers do not perform long-running AI generation.
3. AI provider calls only happen through provider adapters and the rotation engine.
4. Database stores metadata and relationships; Vercel Blob stores generated artifacts.
5. Export ZIP structure is stable and agent-consumable.
6. Diagram generation is sequential and resumable.
7. Canvas state and diagram data must validate before persistence.
8. Project ownership is enforced on every read and mutation.
9. Generated docs must be editable before export.
10. Progress state must reflect reality, not intended work.
11. Clerk handles identity; Foundrie code handles authorization.
12. Generated feature specs must never reference unavailable dependencies or bundle multiple features.
13. Research is a first-class export. Generated projects include `research/PROJECT_RESEARCH.md` and any relevant uploaded/captured assets.
14. External research connectors are optional and must degrade gracefully when credentials are absent.
15. Generated projects can include `.agents/skills/` for project-specific workflows derived from research, context, and feature specs.
16. Generated projects include root `ARTKINS_STYLE_GUIDE.md`.
17. Implementation-impacting work cannot execute until the user approves the current plan.
18. Generated project stacks are researched and user-approved; Foundrie's own stack is not a default constraint.
19. Package versions in generated specs require current docs/release research before being committed.
