# Foundrie AI — Master Research and Implementation Specification

**Consolidated Version**: 14.0.0 (cumulative — all of v1.0.0 through v14.0.0 in force)
**Last Synchronized**: 2026-06-06
**Status**: Current master research. Supersedes every prior summarized edition of this file.
**Scope**: Foundrie AI's own product behavior, four-layer architecture, generation contract, and the rules that make the Foundrie → ZIP → RUWA handoff deterministic.

---

## 0. How To Read This File

This is the consolidated master research document for Foundrie AI. It is the single source of truth that merges the full versioned research corpus (`FOUNDRIE_V1.0.0.md` through `FOUNDRIE_V14.0.0.md`) into one operating specification.

The versioned files are append-only history: each one documents only what changed in that release, and every prior version's content remains in force. This file flattens that history into the current, complete state. When this file and a versioned file disagree, the versioned file with the higher number wins, because the corpus is cumulative.

Read the versioned files when you need the changelog, the rationale, or the exact wording of a single release. Read this file when you need the whole current picture.

Reading order for any Foundrie implementation session:

1. `AGENTS.md`
2. `ARTKINS_STYLE_GUIDE.md`
3. `research/PROJECT_RESEARCH.md`
4. `research/FOUNDRIE_RESEARCH.md` (this file)
5. The six `project-kit/context/` files
6. The current `project-kit/feature-specs/` spec
7. Context7 for current library/API behavior

---

## 1. What Foundrie Is

Foundrie AI is a Socratic discovery and planning tool — a pre-IDE architectural workspace. It holds a conversation with a human engineer, extracts what they need to build, designs the architecture visually as diagrams, and produces a structured project package (a ZIP archive) that contains every instruction a coding agent needs to execute the build with zero ambiguity.

Foundrie does not write application code. Foundrie does not run build commands. Foundrie does not manage git. Foundrie plans, specifies, diagrams, and packages.

The division of responsibility is absolute:

- **Foundrie AI** owns **what** and **why**.
- **RUWA** (the downstream coding agent) owns **how** and **when**.
- **The human** owns **approval** and **judgment**.

Every file Foundrie writes is an instruction. The quality of RUWA's output is a direct function of the quality of Foundrie's output. Vagueness in Foundrie becomes wrong code in RUWA. Ambiguity in Foundrie becomes confusion in RUWA. Omission in Foundrie becomes missed features in the build.

---

## 2. The Two-Tool Contract

```text
Human scaffolds the project (npx create-next-app@latest, cargo new, etc.)
Human initializes git and configures the remote
Human opens Foundrie AI
Human has the discovery conversation with Foundrie
Foundrie generates the full diagram suite — human reviews and approves
Foundrie generates feature specs from the approved diagrams
Human reviews and approves the plan
Human downloads the ZIP
Human places ZIP contents in the project directory
Human opens RUWA in that directory
─────────────────────────────────────────────────────────────────────
RUWA reads all Foundrie files (diagrams first, then context, then specs)
RUWA presents the Init Plan (no code — just what the human must set up)
Human completes manual setup steps and says "ready"
─────────────────────────────────────────────────────────────────────
RUWA implements Feature 01 → reports → human approves
RUWA implements Feature 02 → reports → human approves
... one feature, one branch, one approval gate at a time
```

The ZIP is the handoff. Everything Foundrie knows must be in the ZIP. The human never re-explains to RUWA anything that Foundrie already captured.

---

## 3. Foundrie's Own Four-Layer Polyglot Architecture

> Foundrie's own stack changed materially at v2.0.0. The v1.0.0 stack (Python + FastAPI for the API layer, TypeScript + JSZip for ZIP generation) is **deprecated**. The current stack is a four-language architecture, one language per concern.

The principle: assign each concern to the language best suited for it. The cost of learning a second language is paid once; the performance and safety benefits are paid every second the system runs. This is the pattern Cloudflare, Discord, NVIDIA, and Vercel use at scale.

```text
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 3 — FOUNDRIE WEB APP (TypeScript)                          │
│  Next.js 16 App Router + React 19 + TypeScript strict             │
│  Liveblocks (realtime canvas) + React Flow / @xyflow (diagrams)   │
│  Tailwind CSS v4 + shadcn/ui + GSAP 3.12 (Awwwards-level UI)       │
│  Trigger.dev v4 (background jobs), Zustand, TanStack Query, Zod    │
├──────────────────────────────────────────────────────────────────┤
│  LAYER 2 — FOUNDRIE AI LAYER (Python)                             │
│  LangGraph + PydanticAI — stateful discovery orchestration         │
│  Multi-model rotation: Claude Sonnet 4 → Gemini Pro → DeepSeek R1 │
│    → Kimi K2 → Qwen Coder (fallback chain)                        │
│  RAG: LlamaIndex + ChromaDB over the research corpus              │
│  LangGraph PostgresSaver checkpointing (resumable sessions)        │
│  Logfire structured logging                                        │
├──────────────────────────────────────────────────────────────────┤
│  LAYER 1 — FOUNDRIE EXECUTION LAYER (Rust)                        │
│  Axum + Tokio                                                      │
│  ZIP generation (streaming, no RAM buffering — replaces JSZip)     │
│  Diagram file processing + Mermaid/SVG/DBML generation             │
│  API key rotation engine (50+ keys across 6 providers)            │
│  Chunked file ingestion streaming to Vercel Blob                   │
│  WASM sandbox (Wasmtime) for tool execution isolation             │
│  PyO3 hot-path extensions callable from the Python layer          │
│  tracing crate structured logging                                  │
├──────────────────────────────────────────────────────────────────┤
│  LAYER 4 — GO API GATEWAY                                         │
│  Gin + gRPC — routes AI → Python, file/ZIP/exec → Rust,           │
│    web → Next.js. Health checks, circuit breakers, per-user        │
│    rate limiting, NATS JetStream publishing                       │
└──────────────────────────────────────────────────────────────────┘
```

### Why the polyglot split (benchmark evidence)

*TechEmpower Round 23 (2025), Zylos Research and OSS Insight (April 2026).*

| Concern | Rust (Axum) | Go (Gin) | Python (FastAPI) |
|---|---|---|---|
| Plaintext RPS | 6,800,000 | 3,200,000 | 24,800 |
| DB query RPS (20x) | 390,000 | 280,000 | 3,200 |
| Cold start | 30 ms | 45 ms | 325 ms |

ZIP generation improvement (v1.0.0 JSZip → v2.0.0 Rust streaming): 14-feature project went from 3,200 ms / 600 MB peak / 1,800 ms cold start to **180 ms / 45 MB / 90 ms** — roughly a 17×–20× improvement.

### Layer assignment reference

```text
ZIP generation / file I/O      → Rust (Tokio + zip-rs streaming)
Key rotation engine            → Rust (Tokio RwLock + Axum)
WASM tool sandbox              → Rust (Wasmtime)
Diagram file generation        → Rust (Mermaid/SVG/DBML)
Hot-path Python computation     → Rust via PyO3
AI orchestration / RAG         → Python (LangGraph + PydanticAI)
Multi-model LLM calls          → Python (provider SDKs)
Web UI / diagram canvas         → TypeScript (Next.js 16 + React Flow)
Real-time collaboration         → TypeScript (Liveblocks)
Animation / motion              → TypeScript (GSAP 3.12)
Background jobs                → TypeScript (Trigger.dev v4)
API gateway routing             → Go (Gin + gRPC)
Inter-service communication     → gRPC (language-agnostic)
```

### Monorepo structure (Turborepo)

Foundrie's own codebase is a Turborepo monorepo, and it is the reference implementation for any generated "AI coding agent" project type.

```text
/foundrie/
├── apps/
│   ├── web/                # Next.js 16 — canvas UI (Layer 3)
│   ├── desktop/            # Tauri 2.0 — desktop distribution
│   └── api-gateway/        # Go Gin — routing layer (Layer 4)
├── packages/
│   ├── foundrie-core/      # Rust Axum — ZIP builder, key rotation (Layer 1)
│   ├── ai-layer/           # Python LangGraph — discovery (Layer 2)
│   ├── diagram-engine/     # Rust — Mermaid/SVG/DBML generation
│   ├── telemetry/          # Shared OpenTelemetry SDK
│   ├── auth/               # Clerk shared module
│   └── config/             # Shared config schemas (Zod + Pydantic)
├── infra/
│   ├── terraform/environments/{dev,staging,prod}/
│   ├── kubernetes/
│   └── docker/
├── data/
│   ├── training/           # Curated fine-tuning datasets (C.L.E.A.N.)
│   ├── evals/              # Golden session benchmarks
│   ├── synthetic/          # Augmented rare project-type examples
│   └── schemas/            # MongoDB Atlas training data schemas
├── .github/workflows/{ci,release,security-scan,model-eval}.yml
├── turbo.json
└── README.md
```

### Desktop distribution

Foundrie ships a desktop app built with **Tauri 2.0** (Rust backend reusing Layer 1 + TypeScript React frontend reusing Layer 3). Electron is never used: Tauri produces 3–10 MB binaries vs 150–200 MB, 20–50 MB memory vs 200–400 MB, and < 200 ms startup vs 2–5 s. Cross-compilation targets macOS (x86_64 + aarch64), Linux (x86_64 + aarch64), and Windows (x86_64). Distributed via GitHub Releases, a Homebrew cask, and the Tauri auto-updater.

---

## 4. Technology Stack (Foundrie's Own — Fixed)

Foundrie's own stack is fixed by `project-kit/context/architecture-context.md`. **Generated project stacks are dynamic** and chosen through research and user approval; never copy Foundrie's stack into a generated project unless the user chooses it or the research justifies it.

- Next.js 16 App Router, React 19, TypeScript strict mode.
- Tailwind CSS v4, shadcn/ui, Lucide React, GSAP 3.12 + Framer Motion.
- Clerk for authentication and user sync.
- PostgreSQL on Neon with Prisma (Neon is the required relational database).
- Liveblocks + React Flow (`@xyflow/react`) for collaborative diagrams.
- Trigger.dev v4 for durable background jobs.
- Rust (Axum + Tokio) execution layer for ZIP, key rotation, file ingestion, diagram rendering, WASM sandbox.
- Python (LangGraph + PydanticAI) AI layer with multi-model rotation.
- Go (Gin + gRPC) API gateway.
- Gemini, OpenRouter, Groq, DeepSeek, Anthropic, Kimi for multi-model AI.
- Vercel Blob for generated artifacts; MongoDB Atlas (isolated) for training data.
- html-to-image for PNG export. Its one real weakness is CORS on external images (e.g., AWS icons); the fix is inlining icons as base64 SVGs rather than loading from external URLs — which a diagramming tool should do anyway.
- Tavily (web research), Obscura (JS-rendered capture), Context7 (current library docs), Firecrawl (clean web intelligence) as connectors.
- Mem0 for cross-session memory; FastMCP for tool exposure.

### Required environment variables

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

# Neon Postgres — pooled runtime URL (must use the -pooler endpoint)
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
# Neon direct URL — Prisma CLI and migrations only
DIRECT_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

TRIGGER_SECRET_KEY=...
BLOB_READ_WRITE_TOKEN=...
NEXT_PUBLIC_APP_URL=https://foundrieai.com

# Scale / training / commercialization
MONGODB_ATLAS_URI=...          # isolated training data cluster
NATS_URL=...                   # AI request queue transport
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

### Context7 library IDs

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

---

## 5. The Discovery Protocol — 8 Phases

> Discovery extended from 5 phases to 8 at v6.0.0. Phases 1–5 are the Socratic conversation. Phases 6–8 are diagram-first architecture, spec generation from diagrams, and ZIP assembly. **No feature spec is written before Phase 6 completes.**

Discovery is Socratic. Foundrie asks questions; the human answers; Foundrie converts answers into requirements, architecture, diagrams, and specifications. Foundrie never invents requirements the human did not express.

### Phase 1 — Problem & Users
- What problem does this solve? Who uses it (specific profile, not "developers")? What do they do today without it? What does success look like in six months?

### Phase 2 — Core Flows
- The single most important workflow (the happy path). The three to five supporting workflows. What the user creates, reads, updates, deletes. Which external services this must connect to.

### Phase 3 — Scope & Constraints
- What is explicitly out of scope for v1. What has been tried and failed. Timeline/deadline. Team's existing technical capability. Design reference (Figma, screenshot, competitor URL).

### Phase 4 — Technical Direction
- Foundrie proposes a stack from the language decision matrix (Section 8) based on the answers above. The human reviews and adjusts. Foundrie records the final stack decision with reasoning in an ADR. This is also where deployment strategy (canary vs blue-green) and logging destination are chosen.

### Phase 5 — Feature Sequence (preliminary)
- Foundrie proposes a feature-by-feature build sequence. The human adjusts ordering and scope. This is revised after diagrams in Phase 7.

### Phase 6 — Architecture Diagramming (the Diagram-First Gate)
- 6.1 Generate the System Context Diagram (C4 L1) first.
- 6.2 Human reviews → approves or requests changes → loop until approved.
- 6.3 Generate the Container Diagram (C4 L2) from the approved Context Diagram.
- 6.4 Human reviews → approves → loop.
- 6.5 Generate all remaining applicable diagrams (ERD, sequence, DFD, state machine, deployment, API map, agent architecture, security architecture).
- 6.6 Human reviews all remaining diagrams on the canvas simultaneously.
- 6.7 Human approves the complete architecture or iterates.

### Phase 7 — Feature Spec Generation (from diagrams)
- 7.1 Generate the Feature Dependency Graph (DAG).
- 7.2 Topologically sort → assign feature numbers.
- 7.3 Write each spec, tracing content to the diagram that governs it, assigning file ownership, surfacing hidden requirements and proactive architecture warnings.
- 7.4 Human reviews the spec sequence.
- 7.5 Human approves or adjusts ordering.

### Phase 8 — ZIP Assembly
- Compile diagrams (Mermaid + SVG + format-specific exports), context files, feature specs, research files, project-management files, and docs. Generate the ZIP with the naming convention. Human downloads.

### Discovery constraints
- Foundrie never writes a feature spec until Phases 1–3 are complete and all applicable diagrams are approved.
- Foundrie never proposes a stack before the human describes their team's skills.
- Foundrie never assumes a constraint — it asks.
- Foundrie never accepts vague answers. "The app should work well" is not a requirement.

### Stack proposal rules
When Foundrie proposes a stack it must: name the exact framework and version (not "a React framework" but "Next.js 16 App Router"); name the exact auth library; name the exact database; explain why each choice fits this specific project; flag trade-offs; and ask for confirmation before locking in. Every recommendation must cite a source (Section 11).

### The three-level Socratic model
Foundrie classifies the opening project description before Phase 1:
- **Level 1 — Vague** ("an app where people book appointments"): respond with Socratic elicitation. Never generate specs from a Level 1 description.
- **Level 2 — Partially specified**: surface specific edge cases ("when a booking is cancelled 24h+ in advance, does the provider keep the fee?").
- **Level 3 — Over-specified** (a technical founder asking for Kubernetes + microservices + Kafka for 100 users): push back with evidence, propose the simpler path, and if the engineer insists, document the decision in an ADR and proceed. Respect the engineer's judgment; ensure it is informed.

---

## 6. The Diagram-First Gate and the Full Diagram Suite

The core architectural correction at v6.0.0: feature specs are written **from diagrams**, not from the conversation.

```text
WRONG (v1–v5): Discovery → specs written → diagrams optional
CORRECT (v6+): Discovery → ALL DIAGRAMS GENERATED → human approves
               → specs written FROM diagrams → ZIP → RUWA executes
```

The gate is a hard stop. No feature spec file is created, no context file references a specific architecture choice, and no ZIP is assembled until every applicable diagram is generated, reviewed on the canvas, and explicitly approved (with any change requests applied and re-reviewed). This is what makes Foundrie different from every other planning tool: the architecture is visible, reviewable, and locked before a single line of spec is written.

### The 12 diagram types

| # | Diagram | Trigger | Export formats |
|---|---|---|---|
| 1 | System Context (C4 L1) | Always — first diagram | `.mermaid`, `.svg` |
| 2 | Container (C4 L2) | Always — after Context approved | `.mermaid`, `.svg` |
| 3 | Component (C4 L3) | Per container with > 3 components | `.mermaid`, `.svg` |
| 4 | Entity Relationship (ERD) | Always if a database exists | `.dbml`, `.png` |
| 5 | Sequence | One per core flow, minimum 3 | `.mermaid`, `.svg` |
| 6 | Data Flow (DFD) | Always if user data / payments / AI signals | `.mermaid`, `.svg` |
| 7 | State Machine | Conditional — objects with lifecycle states | `.mermaid`, `.json` (XState) |
| 8 | Deployment | Always if > 1 deployment target | `.mermaid`, `.svg` |
| 9 | API Map | Always if > 3 endpoints; auto-generates OpenAPI | `.yaml` |
| 10 | Feature Dependency Graph (DAG) | Always — drives spec ordering | `.mermaid`, `.svg` |
| 11 | Agent Architecture | Conditional — agentic projects | `.mermaid`, `.svg` |
| 12 | Security Architecture | Always — maps the 7-layer model | `.mermaid`, `.svg` |

The API Map auto-generates `diagrams/09-api-map.yaml` (OpenAPI), the authoritative API contract. The Feature DAG is topologically sorted to produce the feature number sequence — features are never ordered by conversation sequence alone. The Security Architecture Diagram maps the seven-layer defense-in-depth model (Section 9) to the project's actual infrastructure.

### Diagram versioning

When a diagram changes, the prior approved version is preserved in `diagrams/vN/`. `context/progress-tracker.md` records which diagram version each feature spec was written from, preventing implementation from a stale diagram.

```text
diagrams/
├── v1/01-system-context.svg     ← original approved
├── v2/01-system-context.svg     ← revised after scope change
├── 01-system-context.svg        ← current (latest)
└── 04-erd.dbml                  ← current
```

### Foundrie's diagram categories and shape libraries

- **Structural**: class, component, object, deployment, package. Shapes: class box, interface, abstract, association, aggregation, composition, inheritance, dependency.
- **Behavioral**: use case, sequence, activity, state machine. Shapes: lifeline, actor, activation bar, combined fragment, sync/async/return messages.
- **Architectural**: C4 context, C4 container, C4 component, microservices map, system context. Shapes: person, system, container, database, external system, relationship, gateway, message bus, load balancer, cache.
- **Data**: DFD level 0, DFD level 1, ER. Shapes: entity, weak entity, attribute, relationship, one-to-many, many-to-many, one-to-one (crow's-foot).
- **Infrastructure**: AWS architecture, network.

### Sequential generation pipeline

Each diagram job carries: `id`, `diagramTypeId`, `category`, `name`, `folderPath`, `fileName`, `status`, `reactFlowData`, `pngBuffer`, `errorMessage`, `startedAt`, `completedAt`. Statuses are `queued`, `generating`, `rendering`, `capturing`, `done`, `error`. Jobs run one at a time. A failed job is recorded with an error placeholder and the pipeline continues — one failed diagram never cancels the batch. Each diagram generation is a LangGraph checkpoint; if power is lost mid-batch, generation resumes from the last completed diagram node.

---

## 7. The AI Firm and Multi-Model Rotation

Foundrie runs a role-based "AI firm." Every AI call goes through the rotation engine; provider adapters are the only place direct model API calls are allowed.

| Role | Model key | Responsibility |
|---|---|---|
| Principal Engineer | `gemini-2.5-pro` | discovery, planning, architecture, long-context synthesis |
| Staff Reviewer | `deepseek-r1` | critique, trade-offs, hidden risks, feasibility |
| Tech Writer | `deepseek-v3` | context files, feature specs, RFCs, polished Markdown |
| Senior SWE | `qwen-coder` | code-oriented implementation specs, GSAP/canvas/sequence specs |
| Fast Chat | `groq-llama` | streaming UI responses, quick labeling |
| Research Team | `gemini-2.5-flash`, `kimi-k2` | comparisons, synthesis, large-document analysis |

### Reliability requirement

Every AI call goes through a provider abstraction and fallback chain. Foundrie never surfaces raw model availability failures as the primary product experience. Attempts are logged (provider, model, task, success, error, duration) and the next fallback is tried automatically.

### Multi-model rotation and the Rust key engine

The production fallback chain: **Claude Sonnet 4 (primary) → Gemini Pro → DeepSeek R1 → Kimi K2 → Qwen Coder**. The Rust execution layer runs the key rotation engine, managing 50+ API keys across 6 providers (Anthropic, Gemini, DeepSeek, Kimi K2, Qwen, Groq) without Python GIL contention. When a key is rate-limited it is marked for 24 hours and the next available key is selected automatically. Python calls this engine via gRPC — no key-management logic lives in Python.

Tier-aware model selection (Section 12): **Free-tier users are served by DeepSeek R1; Pro/Team/Enterprise users are served by Claude Sonnet 4** as primary. The model is derived from `db.user.subscriptionPlan` at request time, never hardcoded per endpoint. Model IDs are always pinned to an exact version string — never `"latest"` — and recorded in `config/model.yaml` for every AI-feature project.

### AI request queuing (NATS JetStream)

When providers are rate-limited, requests are queued in NATS JetStream and the user sees a transparent queue-position indicator — not an error. The response streams automatically when a worker picks it up. Routing is priority-tiered: Enterprise/Team → dedicated worker pool (no queue); Pro → priority pool (short queue); Free → shared pool (queue position shown).

### Model roles in research

Gemini Pro plans research strategy and long-context synthesis; Gemini Flash handles broad comparison and fast summaries; Kimi handles large-document synthesis; DeepSeek R1 critiques feasibility, performance, legal/security risk; DeepSeek V3 writes polished research Markdown; Qwen Coder turns motion/visual research into implementation specs; Groq handles fast clarification and labeling.

---

## 8. Generated Project Stack Selection (Dynamic)

Foundrie-generated projects are **stack-dynamic**. Foundrie's own stack is never the default for a generated project. During Phase 4, Foundrie asks about user preferences, team skill, target platform, deployment constraints, budget, performance, and maintainability; explains why each candidate technology fits or does not; uses Context7 and official sources to check current docs and versions; and records the selected stack, version evidence, alternatives considered, and the approval in the generated `architecture-context.md` and an ADR.

### Language decision matrix

```text
New CLI tool users install?            Rust (Tokio + Clap) — mandatory
Agent execution runtime?               Rust (Tokio + Rig)
File system + shell operations?        Rust
Untrusted code execution?              Rust (Wasmtime WASM sandbox)
High-throughput API > 10K req/s?       Rust (Axum)
Hot path computation in Python?        Rust via PyO3 bindings
LLM API calls?                         Python (best SDK support)
RAG pipeline?                          Python (LlamaIndex/LangGraph)
Model training?                        Python (PyTorch — mandatory)
Web UI / web app?                      TypeScript (Next.js 16)
Real-time collaboration?               TypeScript (Liveblocks)
Animation / motion?                    TypeScript + GSAP
Mobile app?                            TypeScript (Expo) + Rust (Nitro) if needed
Desktop app?                           Rust backend + TypeScript UI (Tauri)
Microservice gateway?                  Go (Gin + gRPC)
Between-service communication?         gRPC
Smart contract (Solana/NEAR/Stellar)?  Rust (mandatory)
Smart contract (Ethereum)?             Solidity
Data pipeline (large datasets)?        Python + Polars (Rust-backed)
Starting from scratch?                 TypeScript first, add Rust when needed
```

### Generated project defaults by type

| Project type | Default language choices |
|---|---|
| Web app | TypeScript (Next.js 16) + Rust if API > 10K req/s |
| Mobile app | TypeScript (Expo) + Rust (Nitro native modules) if needed |
| Desktop app | Rust (Tauri) + TypeScript (React frontend) |
| CLI tool | Rust (always — single binary) |
| API service | TypeScript < 10K req/s, Rust > 10K req/s |
| Microservices | Go (gateway) + Rust/Python/TypeScript (services) |
| ML pipeline | Python (always — PyTorch mandatory) |
| Smart contract | Rust (Solana/NEAR/Stellar) or Solidity (Ethereum) |
| AI coding agent | Rust (runtime) + Python (AI) + TypeScript (UI) |

### Per-project-type feature sequencing (full specs)

- **Web app**: 01 design system → 02 auth → 03 database schema → 04 CRUD with ownership → feature build.
- **Mobile (Expo)**: 01 navigation + design tokens → 02 auth flow → 03 API client + data model → 04 first functional screen → push notifications as a separate spec. Native Rust modules (Nitro) get their own spec when image/video processing, on-device AI, cryptography, or large-scale compression is required.
- **Blockchain (Solana/Anchor default)**: 01 dev environment → 02 contract structure + test setup → 03 first deployable contract + property tests (Mollusk/Bankrun) → 04 frontend integration. A contract type-bindings spec is generated when both a contract and a frontend exist. Acceptance criteria always include `anchor test` passing and `cargo clippy -- -D warnings` clean.
- **Real-time**: 01 WebSocket/SSE infra (Liveblocks managed CRDT, Rust Axum WebSocket, or NATS JetStream) → 02 presence → 03 real-time state sync → persistence + replay (mandatory — real-time without durability is incomplete). Acceptance criteria include two-tab live update within 200 ms and presence removal within 5 s.
- **Desktop (Tauri)**: 01 window structure + menu + design tokens → 02 local data persistence → 03 core feature surface.
- **CLI**: 01 entry point + subcommand structure + help → 02 core command → 03 config file management.

### Version policy

Never hardcode stale version baselines. Every spec that installs or depends on a package includes a Version Research step: Context7 library ID and query, official install/release source, selected version/range, compatibility notes, and the project-specific reason. If current docs are unavailable, stop and record the uncertainty instead of guessing.

---

## 9. Production Security (Seven-Layer Model)

Foundrie generates specs that implement all seven layers for every project, and the Security Architecture Diagram maps them to actual infrastructure.

```text
Layer 7 USER            Clerk auth middleware, RBAC hooks, per-org rate limiting
Layer 6 API GATEWAY     WAF, TLS 1.3 termination, DDoS protection
Layer 5 APPLICATION     Zod validation on every route, DOMPurify, CSP/CORS/HSTS
Layer 4 AGENT ORCH.     Tool permission manifest, instruction hierarchy, anomaly detector (agentic)
Layer 3 TOOL EXECUTION  Wasmtime sandbox per tool, egress allow-list, CPU/RAM/time caps (agentic)
Layer 2 DATA            AES-256 at rest, PII scrubbing in telemetry, append-only audit log
Layer 1 INFRASTRUCTURE  Zero-trust mTLS, VPC isolation, IMDS hardening (block SSRF)
```

### Agentic injection defense (four layers)

1. **Input classification** — `lib/security/input-classifier`: jailbreak patterns, instruction-boundary violation, high-entropy anomaly, style-shift detection.
2. **Instruction hierarchy** — encoded in every agentic system prompt: OPERATOR (system, immutable) > USER (medium trust) > TOOL OUTPUT (lowest, always data never instructions) > RETRIEVED DOCS (untrusted, labeled external).
3. **Capability gating** — `lib/agent/tool-gateway`: ACL check, anomaly detector, WASM sandbox, output validation.
4. **Observability** — injection fingerprints logged via structured logging.

### Tool permission manifest

Every agentic project gets `tools/permissions.yaml` (allowed roles, allowed/denied paths, denied commands, sandbox, timeout, `requires_human_approval`, `audit`). RUWA reads it at startup and enforces it at every tool call. No generated code bypasses the manifest.

### JWT and auth rules (when a project rolls its own)

RS256 in production (never HS256 in distributed systems, never `alg: none`); access tokens ≤ 15 min; rotate refresh tokens on every use; validate `iss`, `aud`, `exp`, `nbf`, `jti`; keys ≥ 256 bits in a secrets manager; no PII in the payload.

### CI/CD — 22-step pipeline (mandatory feature spec in every project)

CI (1–11): lint/format → type check → unit tests → integration tests → SAST (Semgrep/CodeQL) → dependency audit (npm audit/pip-audit/Trivy) → secret detection (Gitleaks/TruffleHog) → build & containerize → container scan → agent behavior evals → publish artifact (immutable tag `<semver>-<git-sha>`).

CD (12–22): deploy dev → smoke tests → deploy staging → E2E → load test → DAST (OWASP ZAP) → manual gate → canary (1%→10%→50%→100%) or blue-green → feature flag check → observability verify → auto-rollback watch (5-min window).

Behavioral regression: `evals/golden-set.json` (pass threshold 0.95) plus `evals/run-evals.py` run in CI step 10. GitHub branch protection (required PR, required CodeRabbit review, required status checks, no force pushes, no deletions) is generated for `main` in every project. `.github/CODEOWNERS` protects at minimum `src/lib/auth/` and `src/lib/db/`.

### Dependency security (generated in every project)

The dependency problem: a typical AI-generated Node app ships ~7 explicit packages but ~847 total, with 10–20+ known vulnerabilities, audited 0 minutes. Three-step protocol generated as `docs/SECURITY.md` and embedded in `code-standards.md`:
1. **Audit today** — `npm audit` / `pip-audit` / `safety check`; resolve all critical and high before feature work.
2. **Lock versions** — never delete or gitignore the lock file; always commit it; treat lock-file changes as requiring review; CI uses `npm ci` not `npm install`. `.npmrc` with `save-exact=true`, `engine-strict=true`.
3. **Monthly cadence** — first Monday: `npm audit` → `npm outdated` → patch safe versions → flag risky ones → log in `CHANGE_LOG.md`.

`.github/dependabot.yml` (weekly, major bumps excluded for manual review) and SBOM generation (`anchore/sbom-action`, SPDX-JSON attached to every release) are generated in every ZIP. Ruwa monitors NVD, NPM Advisory Board, GitHub Security Advisories, and PyPI safety for active client packages and produces a Security Alert Brief + remediation PR description when a critical CVE lands.

### File security pipeline (6 steps) and malicious URL detection

Every uploaded file passes all six steps before any content is extracted: (1) type validation (MIME vs extension vs magic bytes, blocklist), (2) antivirus scan (ClamAV sidecar), (3) metadata stripping (PDF JS/forms, image EXIF, Office macros), (4) content inspection (prompt injection, exfiltration URLs), (5) sandbox enforcement (no file is ever executed), (6) storage isolation (Vercel Blob, session token + file HMAC, not public, 30-day default deletion). All URLs in uploads and messages are checked against Google Safe Browsing and an internal phishing blocklist; blocked URLs are logged at AUDIT level and never passed to the AI.

### Data breach response (operational)

15-minute containment (identify vector, rotate all secrets, revoke sessions, kill suspicious connections, read-only mode, forensic snapshot), 1-hour assessment (immutable audit logs answer what was accessed), 24-hour notification (GDPR Art. 33), recovery (patch before re-enabling writes, restore from snapshot, force resets, post-mortem within 30 days). The architecture limits blast radius: conversation content is never stored identifiably, codebases require session token + HMAC, uploaded keys are blocked by the file pipeline, card data is Stripe's domain, and training-data user IDs are one-way hashed.

---

## 10. Authentication, Authorization, and RBAC Scope

Authentication and authorization are separate systems:
- **Authentication** ("who are you?"): Clerk owns identity, sessions, sign-in/up, cookies.
- **Authorization** ("what can you do?"): Foundrie application code owns ownership checks, plan gates, role checks.

### Launch auth scope

`ClerkProvider` in `app/layout.tsx`; root `middleware.ts` with `clerkMiddleware` + `createRouteMatcher`; public routes `/`, `/pricing`, `/sign-in(.*)`, `/sign-up(.*)`, `/api/webhooks/clerk`; protected app/API routes by default; Clerk webhook verified with Svix before user sync; local `User` row keyed by Clerk ID; `getAuthUser()` and `requireAuth()` helpers; ownership scoping on every project-owned query; plan and role fields for simple gates; admin email helper using `ADMIN_EMAILS`.

### Foundrie's two-role collaboration model

Foundrie uses a 2-role authorization model enforced at the application layer:
- **Owner**: creates the project; manages settings and members; deletes the project; performs all canvas and AI operations.
- **Collaborator**: invited by the Owner; edits canvas and diagrams; uses AI generation; downloads the ZIP. Cannot modify settings, delete the project, or manage members.

Helpers in `lib/auth/project-access.ts`: `requireProjectOwner()`, `requireProjectMember()`, `getProjectRole()`. Do not build team workspaces beyond this, per-project owner/editor/viewer RBAC, custom admin portals, PostgreSQL RLS, ABAC, audit logging, or hardware-key admin controls until a feature spec explicitly requires them.

### User ownership invariant

Every read, update, and delete on user-owned data must include the authenticated local `user.id` in the `where` clause. Never trust `userId` from request JSON, search params, or route params. Ownership failures return **404, not 403**, so the API does not confirm whether another user's resource exists. Deletes use `deleteMany({ where: { id, userId } })` and return 404 when `count` is zero.

### Plan and admin model

```prisma
plan UserPlan @default(FREE)
role UserRole @default(USER)
enum UserPlan { FREE PRO ENTERPRISE }
enum UserRole { USER ADMIN }
```

`POST /api/projects` calls `canCreateProject()` before creating. Admin access is checked with `isAdmin(user.email)` against `ADMIN_EMAILS`; non-admin API access returns 404.

---

## 11. Intelligent Generation — Hidden Requirements, Warnings, Research-Backed Recommendations

### Hidden requirements catalog (200+ entries)

Foundrie checks every project against a catalog of commonly-missed requirements before finalizing specs, surfacing at minimum one per major area:
- **Auth**: password reset, account deletion (GDPR), per-query ownership scoping, admin audit log, stolen-token handling.
- **Database**: retention policy, pagination at 100K rows, concurrent-write safety, soft vs hard delete, account-deletion cascade.
- **Payments**: webhook failure, subscription expiry/renewal, currency/tax/VAT, refund flow.
- **Email/notifications**: bounce handling, opt-out (CAN-SPAM/GDPR), unsubscribe link.
- **API**: rate limiting, timeouts, consistent error structure, versioning.
- **Performance**: 10K concurrent users, index on WHERE columns, WebP+CDN images.
- **Security**: server-side validation, file scanning, secrets in env not code.

### Proactive architecture warnings (Phase 7)

Foundrie detects and surfaces, before specs are approved: N+1 query risk, missing index, circular spec dependency, missing error-handling spec (e.g., a Stripe integration with no payment-failure spec — failures are 3–5% of attempts in production). Dismissed warnings are recorded in an ADR.

### Research-backed recommendation rule

Foundrie never says "best practice" without a source. Every recommendation cites at least one of: a production case study, a benchmark (e.g., Axum 6.8M RPS vs FastAPI 24,800 RPS, TechEmpower R23), a known failure mode, or documented best practice with a cited source. The engineer can always ask "why" and receive a specific reference.

### Figma bidirectional integration

- **Import**: read fills, text styles, auto-layout, component names, prototype flows → `research/visual-analysis.md` → `context/ui-context.md`.
- **Export**: after Feature 01, write design tokens back to Figma as Figma Variables.
- **Verification**: RUWA captures a Playwright screenshot after each UI feature, Foundrie compares it against the Figma frame via the rendering API and generates a fidelity report; RUWA applies corrections if approved.

### Large file handling

Client-side 5 MB chunking with resume; Rust Axum streaming ingestion (never fully buffered) to Vercel Blob; per-type extraction (pdfium, Apache POI, Claude vision, Whisper, Polars, code-aware chunking); RUWA uses ChromaDB semantic search and chunked reading rather than loading entire large files. Max 500 MB per file, 2 GB per session.

---

## 12. Research Workspace and Asset Corpus

Foundrie treats research as a first-class project artifact. Every project has a research workspace collecting the material that shaped the plan: conversation research, uploaded screenshots, image assets, frame ZIPs, extracted animation frames, research documents, pasted notes, web pages, Context7 findings, scraped source summaries, technical comparisons, and model critiques.

Generated projects export a `research/` **folder** (not a single loose file). The main file is `research/PROJECT_RESEARCH.md`; additional Markdown files and assets live beside it. Foundrie itself follows the same rule — this repository's `research/` folder, with `PROJECT_RESEARCH.md` read before the six context files, and `FOUNDRIE_RESEARCH.md` as the master consolidated document.

### Accepted research inputs

Image assets, screenshots, inspiration images, frame ZIPs, extracted frames, Markdown, pasted notes, PDF, Word, Excel, PowerPoint, links, Tavily outputs, Obscura captures, and Context7 findings. **Raw animation files are rejected** — users convert motion references into extracted frames or frame ZIPs outside Foundrie.

### Storage rule

Files go to Vercel Blob. Neon stores metadata, extracted text, summaries, tags, source attribution, ownership, and Blob paths. Generated research subfolders are conditional — no empty placeholder folders or placeholder READMEs.

### Visual and motion planning example

For an Awwwards-level GSAP portfolio: user uploads start/end screenshots → AI visual analysis (layout, composition, typography, color, motion intent, interaction pattern, implementation risk) → user creates a motion reference externally (e.g., Higgs Field), exports frames, uploads the frame ZIP → AI turns the frame sequence into a GSAP timeline, ScrollTrigger scenes, pinned sections, frame preloading strategy, responsive fallbacks, accessibility limits, and a performance budget → research notes, screenshots, frames, and the motion plan are stored in `research/` → feature specs reference the research assets and constraints explicitly.

### Research connectors

Tavily (search, extract, crawl, map), Obscura (JS-rendered capture and screenshots), Context7 (mandatory, current library docs), Firecrawl (clean structured web content). Connector failures must create clear disabled states or recoverable errors, never broken generation. Preserve source attribution; avoid storing full copyrighted pages when a summary and link suffice.

---

## 13. Collaboration, Recovery, and Idempotency

### Multi-user canvas (Liveblocks)

Every session has a shared canvas. All collaborators see the conversation in real time, diagrams built live, each other's cursors, who holds the input, and the assembling feature-spec list. Pan/zoom/annotate/highlight are open to any collaborator; editing diagram nodes and messaging the AI are Owner/Co-Editor only; approving architecture and downloading the ZIP are Owner-only (Co-Editor with owner approval).

### AI input queue state machine

States: FREE → TYPING → SUBMITTED → RUNNING → BATCH_TAKEN. The first user to click the input claims it (others see "X is typing" and a queue box). While the AI runs, others queue messages; when it finishes, it takes **all** queued messages as a batch and addresses them together ("Alex asked about auth, Sam about the schema — let me address both"). Batch mode beats sequential: O(1) generation serves all collaborators with richer cross-aware responses instead of O(N) round trips. "Still typing" protection preserves an in-progress draft for the next round. Mutually-exclusive questions surface a voting widget with the Session Owner having final say after 30 seconds.

### Session roles

Session Owner (full control, approves, downloads), Co-Editor (messages AI, edits nodes, no download/approve without owner), Viewer (read-only + annotations), Guest (24h time-limited Viewer for client/stakeholder review). A session without an Owner cannot proceed to Phase 6.

### RUWA collaboration

RUWA executes sequentially — collaboration means multiple engineers each run their own RUWA instance on parallel feature branches. Foundrie allocates features during Phase 7 (recorded in `progress-tracker.md`), and the Feature DAG ensures no two assigned features overlap in scope. RUWA detects cross-instance file conflicts and reports them before pushing.

### Autosave and power-loss recovery

LangGraph PostgresSaver checkpoints every AI turn, diagram generation, spec draft, human edit, and approval — in all sessions, not just agentic. On reopen, the engineer is offered Resume / Review history / Discard. Collaborative sessions live in Neon (not any local machine); the first to reconnect becomes acting Owner; full state restores when all reconnect.

### Rollback

Diagram rollback (restore a prior version; dependent specs flagged "needs re-review"), feature-spec rollback (RUWA notified if mid-implementation), and conversation-branch rollback (explore "what if monolith instead of microservices" — both branches preserved, compared side by side, neither deleted).

### Idempotency

Client `useIdempotentAction` hook (ignore double-clicks, generate a UUID per action) + server-side Rust `IdempotencyStore` (dedupe by key with TTL). Generated `code-standards.md` requires: Stripe idempotency keys, email `sent_at` guard, upsert over insert+catch, Trigger.dev task-ID idempotency, resource-exists checks before create; and UI rules: buttons disable immediately on click and re-enable only on error.

---

## 14. Scale and Commercialization

### Scale architecture (1M+ concurrent users)

Cloudflare (DDoS/WAF/CDN) → Vercel Edge (anycast to nearest region) → Next.js on Vercel → Rust Axum on ECS Fargate (auto-scale by CPU + queue depth) → Python LangGraph on GPU ECS → Neon Postgres (primary + 3 read replicas per region) + Upstash Redis + ChromaDB + Vercel Blob. Three regions: `us-east-1`, `eu-west-1`, `ap-southeast-1` with data-residency routing (EU users' data stays in EU for GDPR). PgBouncer in transaction mode; reads → replicas, writes → primary.

Performance targets: discovery response P99 < 8 s, diagram generation P99 < 15 s, ZIP generation P99 < 5 s, file upload (100 MB) P99 < 30 s. Free-tier cost target < $0.05 per session.

### Training data architecture (MongoDB Atlas — isolated)

Training data is document-oriented and schema-flexible, so it lives in MongoDB Atlas, **completely isolated** from production Neon Postgres. Collections: `foundrie_sessions`, `ruwa_sessions`, `shared_outcomes` (keyed by `project_id`). The telemetry service has write-only access; the training pipeline has read-only access; neither touches production. Cross-database access is a FATAL security event. All user identifiers are one-way hashed with a per-user salt before storage.

### Data flywheel and improvement

The MAPE loop (Monitor → Analyze → Plan → Execute) plus the implicit signal hierarchy: **Tier 0** (retrospective findings — highest reliability), Tier 1 (verifiable ground truth: RUWA build pass, ZIP downloaded, diagram approved without revision, zero spec discrepancies), Tier 2 (strong implicit signals), Tier 3 (explicit feedback), Tier 4 (synthetic/human annotation). The C.L.E.A.N. pipeline (Clarity, Logging, Evaluation, Adjustment, Documentation) cleans all training data. Fine-tuning stages: 1 foundation model API → 2 prompt engineering + RAG → 3 few-shot + DSPy optimization → 3.5 RLUF → 4 fine-tune 8B–70B with DPO/RLVR (build pass rate as verifiable reward) → 5 full RLHF. The key insight: Foundrie generates specs → RUWA builds → build pass/fail is a verifiable reward → Foundrie is fine-tuned to produce specs that produce passing builds.

### Pricing tiers

Foundrie: Free ($0, 10 sessions/mo, solo, DeepSeek R1, 30-day retention), Pro ($12/mo, unlimited, 5 collaborators, Claude Sonnet 4, Figma export, priority queue, 2-year retention), Team ($8/user/mo min 3, shared library, SSO, admin dashboard), Enterprise (contact — self-hosted, air-gapped, custom SLA, SOC 2/DPA). RUWA mirrors with Free/$15 Pro/$10 Team/Enterprise.

### Feature flags and Stripe

All feature availability resolves through `canUseFeature()` against `PLAN_FEATURES`, derived from `db.user.subscriptionPlan`. No other gating mechanism; client-side-only gating without server enforcement is a violation. Stripe Checkout collects payment (card data never touches Foundrie), the Customer Portal handles self-service, and verified webhooks (`stripe.webhooks.constructEvent`) activate entitlements within seconds via `PRICE_TO_PLAN`. Unverified webhooks are rejected with 400.

### Onboarding UX (60-second first value)

Engineers experience value within 60 seconds: 0:00 open → 0:10 "What are you building?" → 0:20 type description → 0:45 first discovery question (or starter templates) → 1:00 Foundrie actively shaping the plan. Progressive disclosure: L1 discovery+ZIP (day 1), L2 diagram canvas (day 3), L3 GitHub integration (week 1), L4 collaboration/reference repos (week 2). Success metrics: TTFV < 60 s, Day-1 activation (ZIP download), Day-7 retention, ZIP download rate, diagram approval rate, RUWA build-pass rate. If Day-1 activation < 60%, onboarding quality needs work; if RUWA build pass < 80%, spec quality needs work.

---

## 15. The Three AI Engineering Disciplines

Foundrie and RUWA both implement and generate three distinct disciplines. Confusing them produces poorly-architected AI systems.

- **Context Engineering** — optimizing signal-to-noise within the context window. Include only what is necessary; pre-process and chunk before feeding the model; use structured formats (JSON/tables) over prose where machine-readable; maintain hierarchy (system > task > conversation); prune stale context (Phase 1–3 elicitation is summarized before Phase 6). Generated `ai-workflow-rules.md` includes a Context Engineering section.
- **Memory Engineering** — systems that learn, retain, retrieve, and evolve knowledge across interactions, backed by **Mem0**. Taxonomy: Episodic (specific events, vector store, 90-day relevance scoring), Semantic (general facts, knowledge graph, no decay), Procedural (how-to, key-value), Working (current task, in-context only, never persisted). Contradictions version the old memory with a `superseded_by` pointer rather than deleting it. Returning users get past project context surfaced automatically; RUWA remembers per-project state across sessions. Retrospective summaries are stored as Semantic memories tagged with project type, client type, and Foundrie version.
- **Harness Engineering** — everything around the model except the model: tool definitions and routing (**FastMCP** decorators expose any Python function as an MCP tool), orchestration (LangGraph), retry/error handling (exponential backoff, fallback chain, graceful degradation), rate limiting and cost management (key rotation, token budgets), security boundaries (permission manifest, WASM sandbox, instruction hierarchy), and observability (structured logging, OpenTelemetry, anomaly detection). The harness is opaque to the LLM, transparent to the operator, and resilient (a failing tool returns a structured error, never a crash).

**Firecrawl** is the web intelligence layer (URL → clean markdown): RUWA uses it for reference-repo README extraction and market/tech benchmarking.

### Full production agent architecture

```text
Client Query → RUWA Agent (Mem0 + Firecrawl + FastMCP + ChromaDB)
  → Processed Intelligence Package (context-engineered: chunked, structured)
  → Foundrie Agent (Mem0 + FastMCP + LangGraph PostgresSaver)
  → Quality Gate (hidden requirements, proactive warnings, diagram completeness, spec validation)
  → Delivery (ZIP) → RUWA executes feature-by-feature, branch-by-branch
```

---

## 16. Production Logging Discipline

The vibe-coding logging problem: AI-generated code produces the happy path with no observability layer, making intermittent production bugs unfindable. This is a business risk, not cosmetic.

`console.log` is **never** the logging mechanism in any Foundrie code or generated code — violation is a generation error. Structured JSON logging is mandatory. Log levels: DEBUG (dev only), INFO (normal ops), WARN (recoverable), ERROR (needs attention), FATAL (cannot continue), AUDIT (security/compliance, always on, immutable). Every API request generates a UUID request ID attached to every log entry; logs correlate by `trace_id` across all four layers.

Foundrie's own logging: Pino (TypeScript), Logfire (Python), `tracing` crate (Rust), all emitting to one central aggregator. The logging destination (Datadog / Logtail / CloudWatch / Grafana Loki) is chosen in discovery Phase 4. Every ZIP includes `docs/LOGGING.md` (7-item checklist + level policy + destination). PII is scrubbed before any log emission (emails, API keys, credit cards, tokens).

---

## 17. GitHub Integration and Team Topologies

Foundrie operates as a **GitHub App** (not OAuth): installation-level permissions, bot identity (`foundrie-bot`), fine-grained scopes (Contents R/W, Pull requests R/W, Issues R, Metadata R, Workflows R/W). Sign-in via GitHub (primary), Google, Apple, or email/password (fallback).

Access matrix: own repos (full), collaborator-write (full), collaborator-read (read-only), public (read-only), private-other (no access).

**Reference repository pattern**: a session has one working repo (full write) and optional read-only reference repos. When the engineer says "use the auth pattern from my old project," Foundrie reads the reference repo, extracts the pattern, and bakes it into the spec's Implementation Notes (recorded in `research/reference-patterns.md`).

**Existing-project onboarding**: for a 50K-line codebase with no Foundrie files, Foundrie runs reverse-architecture derivation (reads stack, source samples, README, CI, git log → infers System Context, ERD, API Map, Component diagrams, all labeled "INFERRED — verify before proceeding"), the engineer corrects and approves, then Foundrie generates only new specs that reference existing code. RUWA never overwrites/refactors existing code not covered by a spec.

**Six team topologies**: (1) Full Adoption (standard ZIP), (2) Partial Adoption (RUWA Monitoring Mode), (3) Solo on Shared Repo (`.foundrie/` root, gitignored), (4) Mixed AI Tools (standard ZIP + `EXECUTION_GUIDE.md`), (5) Bad-Actor Devs (branch protection blocks direct pushes), (6) Invited Collaborator (`.foundrie/` in fork/their repo). **Task-Scoped Session Mode** generates a mini-ZIP for a single GitHub Issue, linking the PR back to the Issue.

---

## 18. Operational Lifecycle, Quality Gate, and Handoff

### RUWA repo health monitor

Before every feature and on every `git pull`: `git fetch`, classify each upstream change (in-scope / shared-lib / build-breaking), run build + tests. RUWA never silently patches another developer's change — it reports the finding with options (patch / discuss / pause) and waits for human approval.

### File ownership in the Feature DAG

Foundrie assigns `Files Owned` per spec in Phase 7. No two active specs own the same file. Conflicts are resolved at planning time (reorder, split ownership, or merge features) — eliminating merge conflicts before RUWA runs.

### Scope change protocol

Any mid-development change (addition/removal/redesign) triggers Impact Analysis (affected features, new features needed, diagram updates, timeline delta, cost delta) before any spec regenerates. On approval: update diagrams (new versions), regenerate affected specs, update `CHANGE_LOG.md`, generate an ADR, flag revised specs as "re-review required." Feature removal from a COMPLETE feature generates a new "removal" spec — dead code is never left behind.

### Project management documents (every ZIP)

`project-management/SCOPE.md`, `TIMELINE.md`, `PRICING.md`, `CHANGE_LOG.md`.

### Three-category quality gate

Every deliverable passes the gate before delivery:
- **Category 1 — Document**: placeholders populated, internal consistency, legal coherence, formatting, version accuracy, brand alignment, actionability.
- **Category 2 — Code/Technical**: structured logging (no `console.log`), dependency audit passes (no critical/high CVEs), complete README, env vars documented in `.env.example`, no hardcoded secrets (Gitleaks passes), CI pipeline green.
- **Category 3 — Research/Intelligence**: sources cited and accessible, data points dated, recommendations actionable (specific numbers), conflicting sources acknowledged.

Failures are logged in `docs/QUALITY-GATE.md`, classified (generation failure → Foundrie regenerates; data failure → Ruwa researches → Foundrie regenerates), re-checked through the full gate (no partial-pass shortcut). A gate that never fires is not being applied honestly.

### Seven-section handoff (`docs/HANDOFF.md`, generated at project close)

(1) Project Summary, (2) Deliverables Index, (3) Access & Credentials Transfer, (4) License Confirmation, (5) Known Limitations, (6) Maintenance Notes, (7) Future Recommendations. Generated post-project, not in the planning ZIP.

### Internal retrospective (within 7 days of close)

Five questions mapping to improvement categories: what Foundrie generated well vs needed correction (→ prompt/rule updates), what Ruwa surfaced vs missed (→ research protocol updates), where the client lifecycle had friction (→ checklist updates), logging/security learnings (→ scaffolding updates), templates/protocols to update. Stored as Semantic memory tagged by project type, client type, and Foundrie version; labeled POSITIVE/NEGATIVE/MIXED as a Tier-0 signal. Findings flow to three destinations: Foundrie generation rules, Ruwa research protocols, client lifecycle checklists.

### Five-phase client lifecycle (Lynxcs Industries operating context)

Discovery & Qualification (five-question gate, Ruwa Discovery Brief, Collaboration Proposal + NDA) → Onboarding (Onboarding Kit, Client Intelligence Brief, eight-item checklist) → Active Delivery (versioned drafts mandatory, "what changed" notes, never open-ended questions, written approvals, Scope Amendment for out-of-scope requests) → Retainment (monthly intelligence briefs, retainer packages, three triggers, client health scoring across Responsiveness/Satisfaction/Fit) → Offboarding (Offboarding Kit, six-item checklist, early-termination handling per Creator Agreement).

### Foundrie-generated client documents (creator economy stack)

Six-document professional kit: Rate Card, Collaboration Proposal Template, Creator Agreement Template, NDA Template, Invoice Template (`LI-[YEAR]-[SEQUENCE]`, 14-day terms, TDS note), Portfolio Brief (always with Ruwa market benchmarks). The PassionBits model informs creator-economy positioning: skill-first access replaces follower gatekeeping. All client documents meet four quality criteria: completeness (no empty placeholders), legal coherence, brand alignment, actionability.

---

## 19. ZIP Contract

The export package is named `{project-slug}_{YYYY-MM-DD_HH-mm-ss}.zip` (RUWA-targeted projects may use `[project-slug]_foundrie_[YYYY-MM-DD_HH-MM-SS].zip`). It is generated by the Rust streaming pipeline through a Trigger.dev task and stored in Vercel Blob with database metadata. The structure is a product contract — folders are never renamed and required files are never omitted without updating the architecture context. Optional directories (`.agents/`, `tools/`, `evals/`, `docs/security/`, `diagrams/v*/`, research subfolders) appear only when populated.

```text
{project-slug}_{timestamp}/
├── AGENTS.md                          # 7 sections, full reading order
├── ARTKINS_STYLE_GUIDE.md             # verbatim, never summarized
├── .env.example                       # every var with source location
├── .npmrc                             # save-exact, engine-strict
├── .github/
│   ├── CODEOWNERS                      # protects auth/ and db/ at minimum
│   ├── dependabot.yml
│   └── workflows/{ci,cd,release}.yml
├── .agents/                           (optional)
│   └── skills/                        # project-research + project-specific skills
├── context/
│   ├── project-overview.md
│   ├── architecture-context.md
│   ├── ui-context.md
│   ├── code-standards.md
│   ├── ai-workflow-rules.md
│   └── progress-tracker.md
├── diagrams/                          # mandatory — a ZIP without it is invalid
│   ├── 01-system-context.{mermaid,svg}
│   ├── 02-container.{mermaid,svg}
│   ├── 03-component-[service].{mermaid,svg}   (per container > 3 components)
│   ├── 04-erd.{dbml,png}                       (if database)
│   ├── 05-sequence-[flow].{mermaid,svg}        (min 3)
│   ├── 06-data-flow.{mermaid,svg}              (if user data/payments/AI)
│   ├── 07-state-machine.{mermaid,svg,json}     (conditional)
│   ├── 08-deployment.{mermaid,svg}
│   ├── 09-api-map.yaml                          (OpenAPI, if > 3 endpoints)
│   ├── 10-feature-dag.{mermaid,svg}
│   ├── 11-agent-architecture.{mermaid,svg}     (agentic)
│   ├── 12-security-architecture.{mermaid,svg}
│   └── v1/ v2/ ...                             (versioned history)
├── feature-specs/
│   └── NN-name.md                     # ordered from the Feature DAG
├── research/
│   ├── PROJECT_RESEARCH.md
│   └── ...                            (populated research subfolders only)
├── project-management/
│   ├── SCOPE.md
│   ├── TIMELINE.md
│   ├── PRICING.md
│   └── CHANGE_LOG.md
├── requirements/
│   ├── discovery-notes.md
│   ├── requirements-analysis.md
│   └── architecture-decisions.md
├── tools/                             (agentic)
│   └── permissions.yaml
├── evals/                             (agentic)
│   ├── golden-set.json
│   └── run-evals.py
└── docs/
    ├── PRODUCTION-CHECKLIST.md
    ├── QUALITY-GATE.md
    ├── LOGGING.md
    ├── SECURITY.md
    ├── PRIVACY.md
    ├── TOOLING.md
    ├── CONTRIBUTING.md
    ├── adr/ADR-NNNN-*.md
    └── security/RED-TEAM.md           (agentic)
```

`docs/HANDOFF.md` is generated separately at project close, not in the planning ZIP.

### AGENTS.md — seven required sections

(1) Project Identity, (2) Mandatory Reading Order (diagrams 4–7 before context files), (3) Init Plan Data (every env var with exact source, required CLI tools, required accounts, gate sentence), (4) Hard Rules, (5) Feature Order table, (6) Stack Reference with Context7 IDs, (7) Research Files.

---

## 20. Database Models (Foundrie's Own Schema)

- `User`: `id`, `clerkId`, `email`, `name`, `plan`, `role`, `stripeCustomerId`, `subscriptionPlan`, `subscriptionStatus`, `currentPeriodEnd`, timestamps.
- `Project`: owner relation, `name`, `slug`, `description`, `status`, denormalized counters, ZIP metadata, timestamps.
- `Conversation`: project relation, phase, JSON messages.
- `Requirements`: project relation, discovery notes, analysis doc, ADR doc, functional JSON, non-functional JSON, hidden requirements, scale estimates.
- `Diagram`: project relation, name, diagram type, category, order, React Flow nodes/edges, PNG URL, file name, status, error, generated timestamp.
- `ContextFile`: project relation, file name, file type, content.
- `FeatureSpec`: project relation, order, title, content.
- `ResearchDocument`: project relation, title, file name, content, source type, tags.
- `ResearchAsset`: project relation, asset type, original file name, Blob URL/path, source URL, dimensions/metadata, tags, AI summary.
- `ResearchSource`: project relation, URL, provider, status, extracted title/content/summary, captured screenshot URL, tags.
- `ProjectAgentSkill`: project relation, skill slug, file path, content, description, tags, timestamps.
- `ExecutionPlan`: project relation, task type, plan Markdown, status, revision notes, approval timestamp, execution timestamp, timestamps.
- `ProjectMember`: project relation, member relation, role (OWNER/COLLABORATOR), timestamps.

### Scalable Neon Postgres strategy

Runtime app queries use pooled `DATABASE_URL` (`-pooler` endpoint); Prisma CLI/migrations use direct `DIRECT_URL`. Runtime never uses the direct connection. PgBouncer multiplexes serverless connection fan-out. Every foreign key and hot filter path is indexed; list endpoints use cursor pagination (never offset); list queries use `select` and avoid large JSON fields; no N+1 loops; transactions for multi-record consistency; `RepeatableRead` for ZIP multi-table collection; `Serializable` only for compare-then-write ordering (e.g., next feature-spec order). Partial indexes and autovacuum tuning use raw SQL migrations. Enable `pg_stat_statements`; target cache hit ratio > 99%; `EXPLAIN ANALYZE` any query over 100ms.

### Required indexes

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

### API routes

```text
/api/webhooks/clerk
/api/webhooks/stripe
/api/projects
/api/projects/[projectId]
/api/projects/[projectId]/download
/api/projects/[projectId]/members
/api/projects/[projectId]/members/[memberId]
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
/api/billing/portal
```

### Frontend shape

```text
app/
├── (marketing)/  (page, pricing)
├── (auth)/       (sign-in, sign-up)
├── (app)/
│   ├── dashboard/
│   ├── projects/new/
│   └── projects/[projectId]/
│       ├── discovery/ requirements/ architecture/
│       ├── diagrams/ specs/ research/ export/
└── api/
```

---

## 21. Feature Roadmap

Phase labels are organizational only — never implementation batches. Implement one numbered spec at a time, in strict order.

1. Design system · 2. Auth · 3. Database schema · 4. Project CRUD · 5. AI rotation engine · 6. Layout shell · 7. Research library · 8. Visual and motion research analysis · 9. Web research connectors · 10. Discovery chat · 11. Requirements generation · 12. Requirements review UI · 13. Architecture proposal · 14. React Flow canvas · 15. Diagram type selector · 16. Custom node types · 17. Custom edge types · 18. Diagram planning · 19. Sequential generation · 20. Diagram storage · 21. Canvas export · 22. Project overview generation · 23. Architecture context generation · 24. UI context generation · 25. Code standards generation · 26. Feature specs generation · 27. Project-specific agent skills generation · 28. AGENTS.md generation · 29. Progress tracker generation · 30. ZIP builder · 31. Trigger ZIP job · 32. Download button · 33. Liveblocks presence · 34. Project settings · 35. Project member schema · 36. Authorization helpers · 37. Invite collaborator API · 38. List/remove collaborators API · 39. Shared projects dashboard · 40. Member-aware canvas access · 41. Member-aware AI generation · 42. Sharing UI · 43. Marketing & onboarding surface · 44. Execution plan & approval gate · 45. Architecture approval gate, diagram versioning & rollback · 46. Session autosave & power-loss recovery · 47. Requirements & ADR export documents · 48. Project-management documents generation · 49. Project docs package generation · 50. CI/CD & security scaffolding generation · 51. GitHub App integration & reference repos · 52. Scope change protocol & impact analysis.

Specs 1–42 build the discovery → diagram → generation → ZIP → collaboration pipeline. Specs 43–52 close the gaps required by Foundrie's own generation invariants and ZIP product contract: the public/onboarding surface, the planning-gate and architecture-approval workflows, session recovery, and the generators for every ZIP artifact (requirements docs, project-management docs, the docs package, and CI/security scaffolding), plus GitHub integration and the scope-change protocol. Out of scope for v1: Stripe billing enforcement, native mobile, the six team-topology ZIP variants and Task-Scoped mode, and full multi-region scale infrastructure (documented in research, deferred to later features).

---

## 22. Consolidated Generation Invariants (1–108)

All 108 invariants from v1.0.0 through v14.0.0 are in force. Grouped summary:

**Discovery & specs (1–13)**: never spec un-requested behavior; never omit an env var from the Init Plan; never use vague acceptance criteria; never use ambiguous file paths; never order a spec before its dependency; never put init commands in specs; one meaningful increment per spec; always include Out of Scope and Future Modifications; always list exact service setup steps; always emit the full style guide verbatim; always record architecture-decision reasoning; human approves the plan before ZIP download.

**Polyglot & GSAP (14–17)**: agentic tool calls run in WASM sandboxes with `tools/permissions.yaml`; language selection follows the decision matrix (deviations → ADR); Rust is mandatory for all generated CLI tools; GSAP is mandatory for Awwwards-level web UIs with `ctx.revert()` cleanup.

**Security & CI/CD (18–23)**: `security:all` script in every project; structured JSON logging (never `console.log`); behavioral regression golden set + CI step (≥ 95%); no Foundrie file overrides RUWA integration invariants; 22-step pipeline is a mandatory spec; model IDs pinned, never `"latest"`.

**Flywheel, web vitals, Tauri (24–28)**: Core Web Vitals acceptance criteria in Feature 01; Tauri for desktop (never Electron); GSAP rules in `code-standards.md`; Tier 1–4 telemetry with PII scrubbing; C.L.E.A.N. applied to all training data.

**Monorepo & project types (29–35)**: deviations from the matrix → ADR; Expo default for mobile; Rust for Solana/NEAR/Stellar contracts; real-time projects always include persistence + replay; deployment strategy chosen in Phase 4 + ADR; DSPy runs against the golden set before promotion; RLUF preference pairs for every A/B test.

**Diagram-first (36–44)**: no spec before all diagrams approved; every ZIP has `diagrams/`; Feature DAG drives ordering; RUWA reads diagrams before context files; RUWA never implements a table/route/component not in a diagram; diagrams versioned; System Context is first; API Map auto-generates OpenAPI; Security Architecture always generated.

**GitHub & topologies (45–51)**: GitHub App not OAuth; reverse-architecture for existing projects (labeled INFERRED); `.foundrie/` ZIP for Solo/Mixed; Task-Scoped Mode requires an Issue reference; CODEOWNERS protects auth/ and db/; branch protection always generated; `EXECUTION_GUIDE.md` for Topology 4.

**Collaboration & idempotency (52–60)**: PostgresSaver checkpoints everything; diagram rollback supported; conversation branches preserved; UI buttons disable on click; client + server idempotency; parallel feature allocation recorded; Session Owner before Phase 6; idempotency rules in `code-standards.md`; power-loss resume verified at session start.

**Operational (61–68)**: every ZIP has the four project-management docs; every spec has `Files Owned`; scope changes trigger Impact Analysis; completed-feature removal generates a removal spec; RUWA never silently patches others' changes; repo health check before every feature; `CHANGE_LOG.md` updated on every scope change; scope decisions → ADR.

**Intelligence (69–77)**: Figma bidirectional for design-system projects; screenshot fidelity report after each UI feature; 6-step file security; hidden-requirements check per major area; three-level Socratic classification; proactive warnings shown before approval; recommendations always cite a source; malicious URL detection; N+1/index/circular/error-handling antipatterns auto-detected.

**Scale & commercialization (78–86)**: three regions with data residency; MongoDB training cluster isolated from Neon; one-way hashed user IDs in training data; tier-based model selection; all gates through `canUseFeature()`; Stripe Checkout for payment; verified Stripe webhooks; NATS queue position not errors; breach response is a maintained operational doc.

**Disciplines & logging (87–97)**: production logging is a platform discipline; `console.log` banned; `docs/LOGGING.md` in every ZIP; context engineering prunes between phases; Mem0 memory taxonomy with versioned contradictions; FastMCP tool exposure with pre-query validation; Firecrawl with URL safety check; harness catches tool errors; three disciplines kept distinct.

**Dependency security & lifecycle (98–102)**: dependency audit a hard CI gate (no critical/high CVEs); lock files never deleted/gitignored; Dependabot + SBOM in every ZIP; five-phase client lifecycle; versioned drafts + Scope Amendments in active delivery.

**Quality gate & retrospective (103–108)**: full six-document creator kit per creator-economy client; Portfolio Brief always includes Ruwa benchmarks; three-category quality gate before every delivery; `docs/QUALITY-GATE.md` in every ZIP; seven-section `docs/HANDOFF.md`; retrospective within 7 days stored as Tier-0 Semantic memory.

---

## 23. Version History Reference

| Version | Primary contribution |
|---|---|
| v1.0.0 | Two-tool contract, 5-phase Socratic discovery, AGENTS.md spec, feature-spec quality, ZIP structure |
| v2.0.0 | Four-layer polyglot architecture (Rust/Python/TypeScript/Go), GSAP mandate, language decision matrix |
| v3.0.0 | Seven-layer security, 22-step CI/CD, behavioral regression, structured logging scaffolding |
| v4.0.0 | Data flywheel, MAPE loop, onboarding UX, MVP timeline, Tauri desktop, automation tooling |
| v5.0.0 | Monorepo, ADRs, mobile/blockchain/real-time project types, blue-green, RLUF, DSPy |
| v6.0.0 | Diagram-first architecture, 8-phase discovery, 12-diagram suite, versioning, diagrams/ ZIP dir |
| v7.0.0 | GitHub App, access matrix, reference repos, existing-project onboarding, six topologies |
| v8.0.0 | Multi-user canvas, AI input queue state machine, roles, autosave, recovery, rollback, idempotency |
| v9.0.0 | Repo health monitor, file ownership DAG, scope change protocol, project-management docs |
| v10.0.0 | Figma bidirectional, large-file pipeline, 6-step file security, hidden requirements, Socratic levels |
| v11.0.0 | Scale architecture, MongoDB training isolation, breach response, pricing tiers, Stripe |
| v12.0.0 | Production logging discipline, context/memory/harness engineering, Mem0/FastMCP/Firecrawl |
| v13.0.0 | Dependency security, five-phase client lifecycle, Foundrie-generated legal documents |
| v14.0.0 | PassionBits model, three-category quality gate, seven-section handoff, retrospective framework |

*End of consolidated master research. The versioned files `FOUNDRIE_V1.0.0.md` through `FOUNDRIE_V14.0.0.md` remain the authoritative changelog history and detailed source for each release.*
