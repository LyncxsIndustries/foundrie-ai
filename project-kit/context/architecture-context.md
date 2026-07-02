# Architecture Context

## Contract Synchronization Gate

Any implementation change that corrects or changes a contract must be reflected in the same branch across the affected feature spec, dependent future specs, relevant context files, root AGENTS.md, and progress-tracker.md. Contracts include Prisma fields and relations, route signatures, auth helper signatures, AI task names and callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, and file ownership. A feature is not ready for review while later specs or context still describe stale fields, old API shapes, or invalid contracts.


Foundrie AI's own stack is fixed by this document. Generated project stacks are dynamic and chosen through research and user approval. Never copy Foundrie's stack into a generated project unless the user chooses it or the research justifies it.

## Four-Layer Polyglot Architecture

Foundrie assigns each concern to the language best suited for it. This replaced the deprecated v1 single-language stack (Python+FastAPI API, TypeScript+JSZip ZIP generation).

```text
LAYER 3 — WEB APP (TypeScript)
  Next.js 16 App Router + React 19 + TypeScript strict
  Liveblocks (realtime canvas) + React Flow / @xyflow (diagram canvas)
  Tailwind v4 + shadcn/ui + GSAP 3.12 + Framer Motion
  Trigger.dev v4, Zustand, TanStack Query, Zod

LAYER 2 — AI LAYER (Python)
  LangGraph + PydanticAI — stateful discovery orchestration
  Multi-model rotation: Claude Sonnet 4 → Gemini Pro → DeepSeek R1 → Kimi K2 → Qwen Coder
  RAG: LlamaIndex + ChromaDB over the research corpus
  LangGraph PostgresSaver checkpointing; Logfire structured logging

LAYER 1 — EXECUTION LAYER (Rust)
  Axum + Tokio
  ZIP generation (streaming, no RAM buffering — replaces JSZip)
  Diagram file processing (Mermaid/SVG/DBML)
  API key rotation engine (50+ keys, 6 providers)
  Chunked file ingestion streaming to Vercel Blob
  WASM sandbox (Wasmtime); PyO3 hot-path extensions; tracing crate logging

LAYER 4 — GO API GATEWAY
  Gin + gRPC — routes AI → Python, file/ZIP/exec → Rust, web → Next.js
  Health checks, circuit breakers, per-user rate limiting, NATS JetStream publishing
```

The layers communicate over gRPC. The Rust ZIP builder streams (never buffers a whole ZIP in RAM), giving ~17× faster ZIP generation and ~13× lower memory than the deprecated JSZip approach. Foundrie's monorepo (Turborepo) places these in `apps/{web,desktop,api-gateway}` and `packages/{foundrie-core,ai-layer,diagram-engine,telemetry,auth,config}`.

## Stack Reference

| Layer | Technology | Role |
|---|---|---|
| Web framework | Next.js 16 App Router + React 19 + TypeScript strict | Full-stack app, route handlers, server components, client islands |
| Auth | Clerk | User identity, sessions, protected routes, webhooks |
| Database | PostgreSQL on Neon + Prisma | Relational metadata, generated content, project phases |
| Realtime | Liveblocks | Presence, live cursors, room auth, collaborative canvas state |
| Canvas | React Flow (`@xyflow/react`) | Diagram canvas, nodes, edges, viewport, interactions |
| Background jobs | Trigger.dev v4 | Durable AI workflows, diagram batches, ZIP generation |
| Execution layer | Rust (Axum + Tokio) | ZIP streaming, key rotation, file ingestion, diagram rendering, WASM sandbox |
| AI layer | Python (LangGraph + PydanticAI) | Discovery orchestration, multi-model rotation, RAG |
| API gateway | Go (Gin + gRPC) | Inter-service routing, health checks, rate limiting, NATS publishing |
| AI providers | Gemini, OpenRouter, Groq, DeepSeek, Anthropic, Kimi | Role-based model orchestration with fallbacks |
| ZIP generation | Rust streaming pipeline | Server-side ZIP packaging (JSZip is the deprecated legacy reference) |
| Artifact storage | Vercel Blob | ZIPs, diagram PNGs, canvas snapshots, exported artifacts |
| Media storage | Cloudinary | User-uploaded discovery media (images, videos, documents), optimized delivery, transformations |
| Training data | MongoDB Atlas (isolated) | Anonymized session signals only — zero access to Neon |
| Web research | Tavily | Search, extract, crawl, map when configured |
| Browser scraping | Obscura | JavaScript-rendered capture and screenshots |
| Web intelligence | Firecrawl | URL → clean markdown for agent consumption |
| Memory | Mem0 | Cross-session episodic/semantic/procedural memory |
| Tool exposure | FastMCP | Python functions exposed as MCP tools |
| Diagram capture | html-to-image (icons inlined as base64 SVG to avoid CORS) | Canvas-to-PNG export |
| UI | Tailwind v4, shadcn/ui, Lucide React, GSAP, Framer Motion | Product UI and motion |
| Desktop | Tauri 2.0 (Rust + TypeScript) | Desktop distribution; never Electron |
| Deployment | Vercel (web) + AWS ECS Fargate (Rust/Python) | Hosting and serverless route handlers |

## Required Environment Variables

```bash
GEMINI_API_KEY=...
OPENROUTER_API_KEY=...
GROQ_API_KEY=...
DEEPSEEK_API_KEY=...
ANTHROPIC_API_KEY=...

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
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
NEXT_PUBLIC_APP_URL=https://foundrieai.com

# Scale / training / commercialization
MONGODB_ATLAS_URI=...
NATS_URL=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_PRO=...
STRIPE_PRICE_TEAM=...
STRIPE_PRICE_ENTERPRISE=...

# Optional research/agent connectors
TAVILY_API_KEY=...
OBSCURA_ENDPOINT=...
FIRECRAWL_API_KEY=...
MEM0_API_KEY=...
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
| JSZip (legacy reference) | `/stuk/jszip` |
| html-to-image | `/bubkoo/html-to-image` |
| Tavily JS | `/tavily-ai/tavily-js` |
| Tavily MCP | `/tavily-ai/tavily-mcp` |
| GSAP | `/websites/gsap` |
| GSAP React | `/greensock/react` |

## Agent Skills Architecture

### Foundrie's Internal Skills

Foundrie dynamically parses `skills-lock.json` and `.agents/skills/*/SKILL.md` to identify available skills. It uses universal utility skills (code review, autofix, Context7 CLI, document parsers) for its core workflow, and stack-specific skills (e.g., `clerk-nextjs-patterns`, `trigger-tasks`, `liveblocks-best-practices`) when modifying those subsystems.

### Generated Project Skills

Foundrie acts as a dynamic skill installer for generated projects: it parses installed skills, provisions universal baseline capabilities into every project, and provisions stack-dependent skills based on the approved generated `architecture-context.md` (e.g., `clerk-vue-patterns` if the project uses Vue). When research reveals a repeatable workflow, Foundrie generates project-specific skills in `.agents/skills/`.

## Media Storage Architecture (V15.0.0)

### Cloudinary Integration

Foundrie uses Cloudinary as the primary media storage layer for user-uploaded discovery content. All images, videos, documents, and screenshots uploaded during the discovery conversation are stored in Cloudinary and referenced by URL in the database.

**Storage Flow:**
1. User uploads file via drag-and-drop or file picker in discovery chat
2. Client validates file type and size (images ≤10MB, videos ≤100MB, documents ≤25MB)
3. File uploaded directly to Cloudinary via signed upload API
4. Cloudinary returns secure URL and metadata (public_id, format, dimensions, duration)
5. URL and metadata stored in Neon database `research_files` table with project association
6. AI can reference uploaded media during discovery conversation

**Supported File Types:**
- Images: PNG, JPG, WebP, SVG, GIF
- Videos: MP4, WebM, MOV
- Documents: PDF, TXT, MD, DOC, DOCX, PPT, PPTX

**Cloudinary Features Used:**
- Signed uploads for security (prevents unauthorized uploads)
- Automatic format detection and optimization
- Image transformations (thumbnails, responsive sizes)
- Video transcoding and streaming
- CDN delivery with global edge caching

### ZIP Export Media Inclusion

When a user downloads the project ZIP, Foundrie downloads all Cloudinary media and includes it in the `/research` folder:

```
{project-slug}_{timestamp}.zip
├── research/
│   ├── inspiration/      # Design inspiration images
│   ├── wireframes/       # Uploaded wireframes and mockups
│   ├── branding/         # Logo, brand assets
│   ├── technical-docs/   # PDF specs, architecture diagrams
│   ├── competitors/      # Competitor screenshots
│   └── general/          # Uncategorized uploads
├── diagrams/
├── context/
└── feature-specs/
```

**Export Process:**
1. ZIP generation job queries all `research_files` for the project
2. For each file, download from Cloudinary URL
3. Place file in appropriate category folder based on metadata tags
4. Preserve original filename and format
5. Include `research/FILES.md` manifest with metadata (upload date, tags, AI analysis notes)

This ensures the exported ZIP is fully self-contained with no external dependencies.

### Database Schema

```prisma
model ResearchFile {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  // Cloudinary metadata
  cloudinaryPublicId String
  cloudinaryUrl      String
  format             String   // "jpg", "mp4", "pdf"
  fileType           String   // "image", "video", "document"
  fileName           String   // Original filename
  fileSize           Int      // Bytes
  
  // Categorization
  category    String?  // "inspiration", "wireframes", "branding", etc.
  tags        String[] // User or AI-applied tags
  
  // AI analysis (optional, generated on upload)
  aiDescription String?
  extractedText String? // OCR/document parsing results
  
  createdAt   DateTime @default(now())
  uploadedBy  String   // User ID who uploaded
  
  @@index([projectId])
  @@index([category])
}
```

### Client Component Pattern

```typescript
// components/discovery/FileUploadZone.tsx
'use client';

import { CldUploadWidget } from 'next-cloudinary';
import { useProject } from '@/lib/hooks/use-project';

export function FileUploadZone() {
  const { project } = useProject();
  
  const handleSuccess = async (result: any) => {
    // Save Cloudinary URL and metadata to database
    await fetch(`/api/projects/${project.id}/research/files`, {
      method: 'POST',
      body: JSON.stringify({
        cloudinaryPublicId: result.public_id,
        cloudinaryUrl: result.secure_url,
        format: result.format,
        fileType: getFileType(result.resource_type),
        fileName: result.original_filename,
        fileSize: result.bytes,
      }),
    });
  };
  
  return (
    <CldUploadWidget
      uploadPreset="foundrie_discovery"
      onSuccess={handleSuccess}
      options={{
        maxFileSize: 100000000, // 100MB
        maxFiles: 10,
        multiple: true,
        sources: ['local', 'url', 'camera'],
      }}
    >
      {({ open }) => (
        <button onClick={() => open()}>Upload Files</button>
      )}
    </CldUploadWidget>
  );
}
```

## Artkins Policy and Planning Gate

- Root `ARTKINS_STYLE_GUIDE.md` is the canonical engineering, UX, security, scalability, and no-AI-slope policy, exported verbatim into every generated package.
- Foundrie AI's own stack is fixed by this context; generated stacks are dynamic.
- Foundrie discusses stack options, explains trade-offs, researches current versions with Context7 and official sources, and records the approved stack (with version evidence and alternatives considered) in an ADR before generating implementation specs.
- Implementation-impacting work must be planned, shown to the user, and explicitly approved before execution. Revisions are re-presented before executing.
- The planning gate applies to architecture proposals, diagram generation, context/spec generation, project-specific skill generation, ZIP packaging, and coding-agent implementation. Passive discovery chat, upload intake, link collection, and research summarization run before approval.

## System Boundaries

- `app` — App Router pages, layouts, route handlers, server components.
- `app/api` — authenticated endpoints, input validation, ownership checks, job triggers, metadata persistence.
- `components` — UI composition, canvas, chat, diagram-generation UI, project surfaces, shadcn wrappers.
- `lib/ai` — model routing, provider adapters, fallback chains, rotation engine, prompts, output schemas.
- `lib/diagrams` — diagram categories, shape libraries, generation planning, sequential runner, layout helpers, validation.
- `lib/db` or `lib/prisma.ts` — Prisma client singleton and database helpers.
- `lib/storage` — Vercel Blob helpers for ZIP, PNG, canvas, generated Markdown artifacts.
- `lib/media` — Cloudinary upload, transformation, and download helpers; ResearchFile CRUD operations.
- `lib/research` — research ingestion, Tavily/Obscura/Firecrawl/Context7 source capture, visual asset analysis, synthesis, export helpers.
- `lib/auth` — Clerk session mapping, ownership scoping, plan limits, admin gate, project-access helpers.
- `trigger` — durable Trigger.dev jobs: diagram generation, context generation, feature-spec generation, ZIP generation.
- `prisma` — schema, migrations, generated client, seed data.
- `.agents/skills` — project-local agent skills, including Context7 skills.
- `research` — Foundrie AI's own research corpus, mirroring the generated `research/` export contract.

In Foundrie's full deployed system, ZIP/key-rotation/file-ingestion/diagram-rendering live in the Rust execution layer, discovery orchestration in the Python AI layer, and routing in the Go gateway. The Next.js app is the user-facing surface and the orchestration entry point.

## Authentication and Authorization Model

Authentication and authorization are deliberately separate. Clerk authenticates users and owns sessions. Foundrie authorization code enforces ownership, plan limits, and admin access.

Launch scope:
- Root `middleware.ts` protects app and API routes by default with `clerkMiddleware` + `createRouteMatcher`.
- Public routes: `/`, `/pricing`, `/sign-in(.*)`, `/sign-up(.*)`, `/api/webhooks/clerk`.
- `app/layout.tsx` wraps the app in `ClerkProvider`.
- `app/api/webhooks/clerk/route.ts` verifies Svix signatures before user sync.
- `lib/auth/get-auth-user.ts` maps the Clerk session to the local `User`.
- `lib/auth/require-auth.ts` is required in every route touching user data.
- `lib/auth/plan-limits.ts` owns FREE/PRO/ENTERPRISE limits via `canUseFeature()`.
- `lib/auth/is-admin.ts` checks `ADMIN_EMAILS`.

### Collaboration Authorization Model

2-role model enforced at the application layer:
- **Owner**: created the project; manages settings, members, and deletion; performs all canvas and AI operations.
- **Collaborator**: invited by the Owner; edits canvas/diagrams, uses AI generation, downloads the ZIP. Cannot modify settings, delete the project, or manage members.

Helpers in `lib/auth/project-access.ts`: `requireProjectOwner(projectId, userId)`, `requireProjectMember(projectId, userId)`, `getProjectRole(projectId, userId)` returning `OWNER`, `COLLABORATOR`, or `null`.

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

- Every read, update, and delete on user-owned data includes local `user.id` in the Prisma `where` clause.
- `userId` comes only from the authenticated Clerk session mapped through the local `User` table.
- Never trust `userId` from body JSON, query params, or route params.
- Return 404, not 403, when an ownership check fails.
- Deletes use scoped `deleteMany({ where: { id, userId } })` and return 404 when no row is affected.

### Plan and Admin Rules

- `User.plan` gates resource limits through `canUseFeature()`.
- Tier drives AI model selection: FREE → DeepSeek R1, PRO/ENTERPRISE → Claude Sonnet 4.
- `User.role` exists for internal classification; v1 admin access is checked through `ADMIN_EMAILS`.
- Non-admin API access to admin endpoints returns 404.

## Application Phases

1. `DISCOVERY` — interview in progress.
2. `REQUIREMENTS` — requirements being analyzed.
3. `ARCHITECTURE` — architecture proposal and critique.
4. `DIAGRAM_GENERATION` — diagram jobs planned and generated sequentially; diagram-first gate active.
5. `SPEC_GENERATION` — context files and feature specs written from approved diagrams.
6. `COMPLETE` — ZIP package ready.

## AI Firm Model

| Role | Model key | Primary use |
|---|---|---|
| Principal Engineer | `gemini-2.5-pro` | discovery, requirements surfacing, architecture, long-context planning |
| Staff Reviewer | `deepseek-r1` | critique, scalability/security review, trade-off analysis, feasibility |
| Tech Writer | `deepseek-v3` | context files, feature specs, RFCs, API docs, AGENTS.md |
| Senior SWE | `qwen-coder` | schema, routes, React Flow nodes, GSAP/canvas/sequence specs, code standards |
| Fast Chat | `groq-llama` | quick replies, streaming chat, label suggestions |
| Research Team | `gemini-2.5-flash`, `kimi-k2` | comparison, synthesis, large-document analysis |

## Model Task Map

**UNIFIED ROTATION STRATEGY (v2.0):** As of the optimization update, ALL AI tasks now use a single `unified-rotation` model key that cycles through the best model from each provider. This prevents rate limit exhaustion on specialized providers and ensures maximum system availability.

**Previous architecture (deprecated):** Tasks were assigned to specialized models (e.g., discovery → `gemini-2.5-pro`, fast chat → `groq-llama`), which caused rate limits after ~6 messages in user-facing features.

**Current architecture:** Every task resolves to `unified-rotation`, which implements the following cross-provider fallback chain:

1. Anthropic Claude Sonnet 4 (premium reasoning and architecture)
2. Google Gemini 2.5 Pro (long context and analysis)
3. DeepSeek R1 Reasoner (free-tier primary, strong reasoning)
4. Nvidia Llama 3.1 405B (high-performance inference)
5. Groq Llama 3.3 70B (fast inference)
6. OpenRouter Qwen Coder (fallback coding tasks)

The rotation engine walks this chain until a provider succeeds or all are exhausted. Tier-based primary model selection still applies:
- **FREE tier:** Primary is DeepSeek R1 (position 3 in the chain)
- **PRO/ENTERPRISE tier:** Primary is Claude Sonnet 4 (position 1 in the chain)

Callers can still override with `overrideModelKey` for specific use cases (e.g., forcing `kimi-k2` for large document analysis), but the default behavior for all tasks is now unified rotation.

| Task group | Example tasks | Model key |
|---|---|---|
| **All tasks** | Discovery, requirements, architecture, specs, code, chat, research, visual analysis | `unified-rotation` |

### Legacy Task-to-Model Map (Preserved for Reference)

The following specialized assignments are deprecated but documented here for context:

| Task group | Tasks | Former model key |
|---|---|---|
| Discovery and planning | `discovery_interview`, `requirements_surfacing`, `architecture_proposal`, `non_functional_analysis`, `long_context_planning` | `gemini-2.5-pro` |
| Reasoning and critique | `trade_off_analysis`, `scalability_review`, `security_review`, `architecture_critique`, `infrastructure_decisions`, `hidden_requirement_detect` | `deepseek-r1` |
| Structured writing | `feature_spec_generation`, `project_overview_md`, `architecture_context_md`, `agents_md_generation`, `api_contract_docs`, `rfc_generation`, `progress_tracker_md`, `ai_workflow_rules_md` | `deepseek-v3` |
| Code and implementation specs | `prisma_schema_gen`, `react_flow_node_gen`, `nextjs_route_gen`, `ui_component_specs`, `code_standards_md`, `typescript_patterns` | `qwen-coder` |
| Fast conversation | `chat_quick_reply`, `streaming_chat`, `diagram_label_suggestions` | `groq-llama` |
| Research and synthesis | `tech_comparison`, `pattern_research`, `large_doc_analysis` | `gemini-2.5-flash` or `kimi-k2` |

## Fallback Chains

Every AI call uses `callAI(task, { systemPrompt, userPrompt, plan, maxTokens, temperature?, overrideModelKey?, signal?, media? })` or `callAIStream` with the same option shape. The engine resolves the task to a model key, reads that key's fallback chain, checks provider availability, calls the provider via the application-layer rotation engine (future: Rust key rotation engine over gRPC), logs the attempt, and continues until a response succeeds or every fallback fails. Successful non-streaming calls return `{ status: "ok", text, usage?, modelKey, attempts }`; provider exhaustion returns `{ status: "queued", retryable: true, position: null, rateLimited, lastError? }` (future: NATS JetStream queue with position indicator). Call sites must not use old chat-message-array inputs, `status: "success"`, `response.content`, or direct provider calls.

**Primary Chain (unified-rotation):** All tasks now default to this chain unless explicitly overridden.

| Model key | Fallback chain |
|---|---|
| `unified-rotation` | Anthropic Claude Sonnet 4 → Google Gemini Pro → DeepSeek R1 → Nvidia Llama 405B → Groq Llama 70B → OpenRouter Qwen Coder |

**Legacy Specialized Chains (Deprecated):** These chains are preserved for reference but no longer used by default.

| Model key | Fallback chain |
|---|---|
| `claude-sonnet-4` | Claude Sonnet 4 → Gemini Pro → DeepSeek R1 → Kimi K2 → Qwen Coder |
| `gemini-2.5-pro` | Gemini Pro → Gemini Flash → OpenRouter DeepSeek Chat → OpenRouter Qwen3 free → OpenRouter Llama Maverick |
| `gemini-2.5-flash` | Gemini Flash → Gemini Pro → Groq Llama 70B → OpenRouter Qwen3 free |
| `deepseek-r1` | DeepSeek Reasoner → OpenRouter DeepSeek R1 → Gemini Pro → OpenRouter Qwen3 free |
| `deepseek-v3` | DeepSeek Chat → OpenRouter DeepSeek Chat → Gemini Flash → OpenRouter Qwen3 free |
| `qwen-coder` | OpenRouter Qwen Coder → OpenRouter Qwen Coder free → OpenRouter DeepSeek Chat → OpenRouter Qwen3 free → Groq Llama 70B |
| `groq-llama` | Groq Llama 70B → Groq Llama 8B instant → Groq Gemma2 → Gemini Flash → OpenRouter Qwen3 free |
| `kimi-k2` | OpenRouter Kimi K2 → OpenRouter Kimi K2 free → Gemini Pro → OpenRouter DeepSeek Chat |

**Tier-based Primary Model Selection:**
- **FREE tier:** Primary entry point is DeepSeek R1 Reasoner (position 3 in unified-rotation chain)
- **PRO/ENTERPRISE tier:** Primary entry point is Claude Sonnet 4 (position 1 in unified-rotation chain)

Model IDs are pinned to exact versions (never `"latest"`) in `config/model.yaml`.

## Provider Abstraction

Supported providers: Anthropic (Claude), Google (Gemini), DeepSeek (R1 Reasoner & V3 Chat), Groq (Llama/Gemma fast inference), OpenRouter (unified access to 200+ models), and Nvidia NIM (high-performance inference).

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

Provider adapters belong in `lib/ai/providers/`. Direct calls to external AI APIs are not allowed outside those adapters. The application-layer rotation engine selects from available providers based on the fallback chain. In the future deployed architecture, the Rust key rotation engine will select the least-used available key per provider and mark rate-limited keys for 24 hours.

## AI Conversation Flow (8 Phases)

- **Phase 1 — Discovery interview**: principal-engineer persona asks one question at a time, classifying the opening description as Level 1/2/3. Covers users, scale, read/write patterns, consistency, uptime/SLA, budget, team expertise, infrastructure constraints, security/compliance, failure modes. Surfaces hidden requirements from the catalog.
- **Phase 2 — Requirements surfacing**: deep reasoning extracts functional, non-functional, hidden, scale, and security requirements and proposes approaches with trade-offs.
- **Phase 3 — Architecture proposal**: orchestrator proposes a high-level architecture, records ADRs, and prepares the System Context Diagram.
- **Phase 4 — Sequential diagram generation (diagram-first gate)**: the planner creates an ordered job list; jobs run one at a time, render to canvas, capture as PNG, persist, and version. No spec is written until all diagrams are approved.
- **Phase 5 — Context and feature specs**: structured generation writes the 9+ specialized context files, root AGENTS.md, the Feature Dependency Graph, and N ordered feature specs traced to diagrams, with file ownership and proactive warnings.
- **Research phase (continuous)**: collects assets, frame ZIPs, extracted frames, documents, scraped sources, Context7 findings, and notes into the research corpus; later phases cite relevant `research/` paths.

## Diagram System

Categories: `structural` (class, component, object, deployment, package), `behavioral` (use case, sequence, activity, state machine), `architectural` (C4 context, C4 container, C4 component, microservices map, system context), `data` (DFD L0, DFD L1, ER), `infrastructure` (AWS architecture, network).

The 12 generated diagram types and triggers (System Context always-first, Container always, Component per container > 3 components, ERD if database, Sequence min 3, DFD if user data/payments/AI, State Machine conditional, Deployment if > 1 target, API Map if > 3 endpoints, Feature DAG always, Agent Architecture for agentic, Security Architecture always) are specified in `research/FOUNDRIE_RESEARCH.md` §6. Each type maps to a shape library exposing node and edge definitions.

## Sequential Diagram Pipeline

Job statuses: `queued`, `generating`, `rendering`, `capturing`, `done`, `error`. Required job fields: `id`, `diagramTypeId`, `category`, `name`, `folderPath`, `fileName`, `status`, `reactFlowData`, `pngBuffer`, `errorMessage`, `startedAt`, `completedAt`. The runner continues after a single diagram fails; failed jobs create an error placeholder in the ZIP. Each generation is a LangGraph checkpoint for power-loss recovery. Diagrams are versioned (`diagrams/vN/`), and `progress-tracker.md` records which version each spec was written from.

## ZIP Output Contract

ZIP file name: `{project-slug}_{YYYY-MM-DD_HH-mm-ss}.zip`. Generated by the Rust streaming pipeline through a Trigger.dev task and stored in Vercel Blob. Structure is a product contract; optional directories appear only when populated.

```text
{project-slug}_{timestamp}/
|-- AGENTS.md
|-- ARTKINS_STYLE_GUIDE.md
|-- .env.example
|-- .npmrc
|-- .github/ (CODEOWNERS, dependabot.yml, workflows/)
|-- .agents/skills/                  (optional)
|-- context/ (6 files)
|-- diagrams/                        (mandatory; 01-12 + versioned vN/)
|-- feature-specs/
|-- research/ (PROJECT_RESEARCH.md + populated subfolders)
|-- project-management/ (SCOPE, TIMELINE, PRICING, CHANGE_LOG)
|-- requirements/ (discovery-notes, requirements-analysis, architecture-decisions)
|-- tools/ (permissions.yaml — agentic)
|-- evals/ (golden-set.json, run-evals.py — agentic)
`-- docs/ (PRODUCTION-CHECKLIST, QUALITY-GATE, LOGGING, SECURITY, PRIVACY, TOOLING, CONTRIBUTING, adr/, security/)
```

A ZIP without `diagrams/` is invalid. `docs/HANDOFF.md` is generated separately at project close, not in the planning ZIP.

## Database Schema

Core models: `User`, `Project`, `Conversation`, `Requirements`, `Diagram`, `ContextFile`, `FeatureSpec`, `ResearchDocument`, `ResearchAsset`, `ResearchSource`, `ProjectAgentSkill`, `ExecutionPlan`. `ProjectMember` is deferred to Feature 35 and must not be queried before that schema migration lands.

Current field contract: `Project.executionPlans` is a list relation; approved architecture is the latest `ExecutionPlan` with `status: "APPROVED"` and Markdown `content`. `ExecutionPlan` has `content`, `revisionNotes`, `approvedAt`, and `executedAt`; it does not have `critiqueContent` or `metadata`. `ResearchDocument` has `title`, `sourceType`, and `content`; it does not have `summary` or `category`. `ResearchAsset` stores AI-derived previews/details in `metadata`, not custom scalar summary fields.

`User` adds Stripe/subscription fields (`stripeCustomerId`, `subscriptionPlan`, `subscriptionStatus`, `currentPeriodEnd`) alongside `plan` and `role`.

## Neon Postgres Architecture

### Connection Rules

- **`DATABASE_URL` (Pooled)**: primary database with `-pooler`. Used by the app at runtime for all queries. Prevents serverless connection exhaustion (PgBouncer in transaction mode).
- **`DIRECT_URL` (Unpooled)**: primary without the pooler. Used only by the Prisma CLI for `db:migrate`/`db:push`.
- Runtime code must not use the direct connection.

Prisma datasource is minimalist (`provider = "postgresql"`); URLs are configured in `prisma.config.ts`.

### Database Scripts

`npm run db:generate`, `npm run db:migrate`, `npm run db:push`, `npm run db:studio`.

### Prisma Client

One Prisma client named `db` (pooled, reads and writes — compatible with the Neon free-tier 2-connection strategy), cached on `globalThis` in development. At scale, reads route to Neon read replicas and writes to the primary; reads requiring read-after-write consistency use the primary.

### Consistency Model

ACID-first. Eventual consistency is acceptable only for progress UI, dashboard freshness, and analytics. ZIP generation uses a consistent read snapshot (`RepeatableRead`) for multi-table reads; `Serializable` only for compare-then-write order allocation.

### Required Indexes

```prisma
model Project        { @@index([userId]) @@index([userId, updatedAt(sort: Desc)]) @@index([slug]) @@index([status]) }
model Conversation   { @@index([projectId, phase]) @@index([projectId, updatedAt(sort: Desc)]) }
model Diagram        { @@index([projectId]) @@index([projectId, category, orderInCategory]) }
model ContextFile    { @@unique([projectId, fileType]) @@index([projectId, fileType]) }
model FeatureSpec    { @@unique([projectId, order]) @@index([projectId, order]) }
model ResearchDocument { @@index([projectId]) @@index([projectId, sourceType]) }
model ResearchAsset  { @@index([projectId]) @@index([projectId, assetType]) }
model ResearchSource { @@index([projectId]) @@index([projectId, provider]) @@index([projectId, status]) }
model ProjectAgentSkill { @@unique([projectId, slug]) @@index([projectId]) }
model ExecutionPlan  { @@index([projectId]) @@index([projectId, status]) @@index([projectId, taskType]) }
```

```sql
CREATE INDEX CONCURRENTLY idx_diagrams_generating ON diagrams(project_id, updated_at)
  WHERE status IN ('QUEUED', 'GENERATING', 'RENDERING', 'CAPTURING');
CREATE INDEX CONCURRENTLY idx_diagrams_has_png ON diagrams(project_id)
  WHERE png_storage_url IS NOT NULL;
ALTER TABLE diagrams SET (autovacuum_vacuum_scale_factor = 0.01, autovacuum_analyze_scale_factor = 0.005, autovacuum_vacuum_cost_delay = 2);
ALTER TABLE conversations SET (autovacuum_vacuum_scale_factor = 0.02, autovacuum_analyze_scale_factor = 0.01, autovacuum_vacuum_cost_delay = 2);
```

### Database Performance Invariants

1. Every foreign key used in joins or ownership checks is indexed.
2. List endpoints use cursor pagination, never offset.
3. List queries use `select` and avoid large JSON columns unless needed.
4. No N+1 Prisma query loops.
5. Slow queries over 100ms require `EXPLAIN ANALYZE`; enable `pg_stat_statements`; target cache hit ratio > 99%.
6. Write-heavy tables receive autovacuum tuning migrations.
7. Neon parameters: `statement_timeout = 30s`, `idle_in_transaction_session_timeout = 10s`, `lock_timeout = 5s`.

Project statuses: `DISCOVERY`, `REQUIREMENTS`, `ARCHITECTURE`, `DIAGRAM_GENERATION`, `SPEC_GENERATION`, `COMPLETE`. User plans: `FREE`, `PRO`, `ENTERPRISE`. User roles: `USER`, `ADMIN`.

## Scale Architecture

Cloudflare (DDoS/WAF/CDN) → Vercel Edge (anycast) → Next.js → Rust Axum on ECS Fargate (auto-scale by CPU + queue depth) → Python LangGraph on GPU ECS → Neon (primary + 3 read replicas per region) + Upstash Redis + ChromaDB + Vercel Blob. Three regions (`us-east-1`, `eu-west-1`, `ap-southeast-1`) with data-residency routing. Training data lives in an isolated MongoDB Atlas cluster with zero access to production Neon. Performance targets: discovery P99 < 8 s, diagram generation P99 < 15 s, ZIP P99 < 5 s, 100 MB upload P99 < 30 s.

## API Route Map

```text
/api/webhooks/clerk
/api/webhooks/stripe
/api/projects
/api/projects/[projectId]
/api/projects/[projectId]/download
/api/projects/[projectId]/members
/api/projects/[projectId]/members/[memberId]
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
/api/billing/portal
```

## Frontend Route Structure

```text
app/
|-- (marketing)/ (page, pricing)
|-- (auth)/ (sign-in, sign-up)
|-- (app)/
|   |-- dashboard/
|   |-- projects/new/
|   `-- projects/[projectId]/ (discovery, requirements, architecture, diagrams, specs, research, export)
`-- api/
```

## Core Component Structure

```text
components/
|-- canvas/ (DiagramCanvas, DiagramSidebar, nodes/, edges/)
|-- chat/ (DiscoveryChat, ArchitectureChat, ChatMessage)
|-- diagram-generation/ (GenerationProgress, DiagramPreview, GenerationControls)
|-- project/ (DownloadZipButton, ProjectPhaseNav, RequirementsReview, FeatureSpecsList)
|-- research/ (ResearchLibrary, ResearchUploader, ResearchSourceList, VisualReferenceGrid, MotionPlanViewer)
`-- ui/
```

## ZIP Generation Behavior

- `POST /api/projects/[projectId]/download` checks auth and project membership.
- If a ZIP was generated in the last 10 minutes, return cached metadata.
- Otherwise trigger `generate-project-zip` (Rust streaming builder) through Trigger.dev and return `runId`.
- `GET /api/projects/[projectId]/download?runId=...` polls run status.
- When complete, return the ZIP URL/path and file name; `DownloadZipButton` polls and triggers the browser download.

## Prompt Contracts

- Discovery prompt classifies Level 1/2/3, asks one question at a time, surfaces hidden requirements, and synthesizes only after enough context.
- Requirements prompt extracts functional, non-functional, hidden, scale, security, and trade-off information.
- Diagram prompts return only valid JSON with `nodes` and `edges`; the System Context Diagram is generated first and approved before others.
- AGENTS.md generation prompt briefs a senior coding agent with the reading order (diagrams before context files), feature order, hard rules, diagrams, and current status, and requires reading root `ARTKINS_STYLE_GUIDE.md` before coding.
- Planning prompts show a plan, wait for approval, and revise before execution.
- Architecture-context generation prompt includes a researched, user-approved stack decision; it must not copy Foundrie's stack unless chosen or justified.
- Version prompts use Context7 and official release/install sources before writing package versions; model IDs are pinned.
- Feature-spec generation prompt follows the incremental methodology: one feature per spec, exact dependencies, exact files, `Files Owned`, explicit Out of Scope, Future Modifications, binary acceptance criteria, traced to the governing diagram.
- Research synthesis prompt produces `research/PROJECT_RESEARCH.md` and supporting documents summarizing assets, frame ZIPs, extracted frames, research files, links, scraped data, visual/motion references, Context7 findings, technical decisions, open questions, and implementation implications.
- Visual/motion research prompts identify animation intent, source assets, frame-sequence strategy, GSAP/ScrollTrigger notes, accessibility/performance constraints, and generated asset paths.
- Project-specific skill generation prompt turns repeatable research-backed workflows into `.agents/skills/<skill-name>/SKILL.md`.
- Every recommendation cites a source. All generated output is parsed and validated before persistence.

## Invariants

1. Context files and research are read before implementation; the research corpus is cumulative (higher version wins).
2. Foundrie's stack is the four-layer polyglot architecture; generated stacks are dynamic and research-driven.
3. The diagram-first gate holds: no spec or ZIP before all applicable diagrams are approved; every ZIP includes `diagrams/`; the Feature DAG drives ordering.
4. All AI calls go through the rotation engine; direct provider calls only in adapters; tier drives model selection; model IDs are pinned.
5. Clerk authenticates; Foundrie authorizes; ownership scoping by local `user.id`; ownership failure returns 404.
6. Long-running work runs in Trigger.dev tasks with retries and idempotency; route handlers stay thin.
7. PostgreSQL stores metadata; Vercel Blob stores artifacts; MongoDB Atlas (isolated) stores anonymized training data only.
8. Structured JSON logging only; no `console.log`; request IDs and `trace_id` correlation; PII scrubbed.
9. Security (seven-layer), CI/CD (22-step), executable `npm run security:all` gates, dependency audit (hard gate), and the file security pipeline (6 steps) are generated into every project.
10. The ZIP structure is a product contract; required files are never omitted without updating this context.
11. Every feature spec is one feature with exact dependencies, `Files Owned`, Out of Scope, Future Modifications, and binary acceptance criteria.
12. Update `progress-tracker.md` after meaningful changes; record missing requirements before inventing behavior.
