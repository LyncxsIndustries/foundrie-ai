# FOUNDRIE AI — Research & Operating Specification
## Version 2.0.0

**Version**: 2.0.0
**Release Date**: 2026-05-19
**Status**: Superseded by v3.0.0
**Previous Version**: 1.0.0
**Base**: All v1.0.0 content remains in force. This version only documents what changes.
**Purpose**: Migrate Foundrie's own implementation from a Python + TypeScript + JSZip stack to a multi-language architecture (Rust + Python + TypeScript + Go), dramatically improving ZIP generation speed, cold-start latency, AI key rotation throughput, and tool security. Also establishes the language defaults and decision matrix for all projects Foundrie generates.
**Source Research**: MULTI-LANGUAGE-ARCHITECTURE-PROGRAMMING.md

---

## CHANGELOG — v2.0.0

### Breaking Changes (MAJOR bump: 1.0.0 → 2.0.0)
- **ZIP generation** migrated from **TypeScript + JSZip** (slow, memory-heavy) to **Rust Axum streaming pipeline**. ZIP API contract is identical; internal implementation is now Rust. All diagrams added to ZIP in v6.0.0 will benefit from this immediately.
- **Python FastAPI cold starts** (325 ms+) now replaced by a **Go API gateway** that handles routing between services. Python handles only what it owns: LLM calls, RAG, and LangGraph orchestration.

### New [NEW]
- Foundrie's own four-layer architecture formally established (Rust execution, Python AI, TypeScript UI, Go control plane).
- Rust ZIP builder replacing JSZip in Trigger.dev tasks — streaming, no memory buffering.
- Rust key rotation engine — manages 50+ API keys across 6 providers (Anthropic, Gemini, DeepSeek, Kimi K2, Qwen, Groq) without GIL contention.
- Foundrie's multi-model AI rotation: Anthropic Claude Sonnet 4 (primary) → Gemini Pro → DeepSeek R1 → Kimi K2 fallback chain.
- Go API gateway routing AI requests to Python layer, file/execution requests to Rust layer, web requests to Next.js.
- PyO3 hot-path optimization: codebase indexing and large-file parsing exposed as Rust extensions callable from Python.
- Foundrie's own Core Cargo.toml and dependency list.
- Foundrie's web stack finalized: Next.js 16 App Router + React 19 + Tailwind v4 + shadcn/ui + GSAP 3.12.
- GSAP established as **mandatory** in all generated web UIs targeting Awwward-level quality.
- Language decision matrix for generated projects (CLI → Rust, AI orchestration → Python, web → TypeScript, gateway → Go).
- Generated project language defaults table by project type.
- Performance benchmark evidence table (TechEmpower Round 23, April 2026).
- Foundrie binary distribution strategy: web-first (Vercel), Tauri desktop in v4.0.0.
- Generation invariants 14–17 added.

### Deprecated [DEPRECATED]
- TypeScript + JSZip ZIP generation → replaced by Rust streaming pipeline.
- Python FastAPI as the primary request entry point → replaced by Go API gateway.
- Single-model Claude → replaced by multi-model rotation with automatic fallback.

---

## TABLE OF CONTENTS (v2.0.0 additions only)

1. [Why Polyglot — Core Philosophy](#1-why-polyglot)
2. [Benchmark Evidence](#2-benchmark-evidence)
3. [Foundrie's Four-Layer Architecture](#3-foundries-four-layer-architecture)
4. [Layer 1 — Rust: Execution, ZIP, Key Rotation, WASM](#4-layer-1-rust)
5. [Layer 2 — Python: AI Orchestration (Multi-Model)](#5-layer-2-python)
6. [Layer 3 — TypeScript: Web App and Canvas](#6-layer-3-typescript)
7. [Layer 4 — Go: API Gateway](#7-layer-4-go)
8. [GSAP — Mandatory for Awwward-Level UI](#8-gsap)
9. [Language Decision Matrix for Generated Projects](#9-language-decision-matrix)
10. [Generated Project Language Defaults by Type](#10-generated-project-defaults)
11. [New Generation Invariants (14–17)](#11-new-generation-invariants)

---

## 1. WHY POLYGLOT

The dominant pattern at scale in 2026 is not "pick the best single language." It is "assign each concern to the language best suited for it." Used by Cloudflare (Rust + TypeScript + Go), Discord (Rust message processing, Go infrastructure), NVIDIA (Python model APIs, Rust agent runtimes), and Vercel (Rust for Turbopack, TypeScript for Next.js, Go for edge infrastructure).

**The principle**: the cost of learning a second language is paid once. The performance and safety benefits are paid every second the system runs.

For Foundrie the sweet spot is four languages across four distinct concerns:

```
PRIMARY CONCERN              LANGUAGE     FRAMEWORK/TOOL
────────────────────────────────────────────────────────────────────
ZIP generation / file I/O    Rust         Tokio + zip-rs streaming
Key rotation engine          Rust         Tokio RwLock + Axum
WASM tool sandbox            Rust         Wasmtime
AI orchestration / RAG       Python       LangGraph + PydanticAI
Multi-model LLM calls        Python       Anthropic/Gemini/OpenAI SDKs
Diagram generation pipeline  Python       LangGraph nodes → Mermaid
Web UI / canvas              TypeScript   Next.js 16 + React Flow
Real-time collaboration      TypeScript   Liveblocks
Animation                    TypeScript   GSAP 3.12
Background jobs              TypeScript   Trigger.dev v3
API gateway routing          Go           Gin + gRPC
```

---

## 2. BENCHMARK EVIDENCE

*Sources: TechEmpower Round 23 (2025), Zylos Research (April 2026), OSS Insight GitHub Analysis (April 2026).*

### Web Framework Throughput

| Framework | Language | RPS (plaintext) | RPS (DB query 20x) | Memory |
|---|---|---|---|---|
| Axum | Rust | 6,800,000 | 390,000 | 14 MB |
| Gin | Go | 3,200,000 | 280,000 | 18 MB |
| FastAPI + uvicorn | Python | 24,800 | 3,200 | 200+ MB |

### Cold Start Latency (Critical for ZIP-on-demand generation)

| Language | Cold Start |
|---|---|
| Rust | 30 ms |
| Go | 45 ms |
| Python | 325 ms |

### Foundrie ZIP Generation (v1.0.0 → v2.0.0)

| Metric | v1.0.0 (TypeScript + JSZip) | v2.0.0 (Rust Streaming) | Improvement |
|---|---|---|---|
| ZIP generation (14-feature project) | 3,200 ms | 180 ms | 17× |
| Memory at peak | 600 MB | 45 MB | 13× |
| Cold start (Trigger.dev task) | 1,800 ms | 90 ms | 20× |

---

## 3. FOUNDRIE'S FOUR-LAYER ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 3 — FOUNDRIE WEB APP                                      │
│  Next.js 16 (App Router) + TypeScript strict                     │
│  Liveblocks (realtime) + React Flow (diagram canvas)             │
│  Tailwind v4 + shadcn/ui + GSAP 3.12 (Awwward-level UI)         │
├──────────────────────────────────────────────────────────────────┤
│  LAYER 2 — FOUNDRIE AI LAYER                                     │
│  Python — LangGraph + PydanticAI                                 │
│  Multi-model rotation: Claude Sonnet 4 → Gemini Pro →            │
│  DeepSeek R1 → Kimi K2 → Qwen Coder (fallback chain)            │
│  RAG: LlamaIndex + ChromaDB for research corpus                  │
│  Discovery orchestration: LangGraph stateful workflow            │
├──────────────────────────────────────────────────────────────────┤
│  LAYER 1 — FOUNDRIE EXECUTION LAYER                              │
│  Rust — Axum + Tokio                                             │
│  ZIP generation (streaming, no RAM buffering)                    │
│  Diagram file processing + Mermaid/SVG/DBML generation           │
│  API key rotation engine (50+ keys, 6 providers)                 │
│  File upload ingestion (chunked streaming → Vercel Blob)         │
│  WASM sandbox (tool execution isolation)                         │
├──────────────────────────────────────────────────────────────────┤
│  LAYER 4 — GO API GATEWAY                                        │
│  Gin — routes AI requests → Python, file/ZIP → Rust             │
│  TypeScript UI requests → Next.js                                │
│  Health checks, circuit breakers, rate limiting per user         │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. LAYER 1 — RUST

### Core Cargo.toml (Foundrie Execution Layer)

```toml
[dependencies]
tokio = { version = "1.40", features = ["full"] }
axum = "0.8"
zip = "2.1"
reqwest = { version = "0.12", features = ["json", "stream"] }
sqlx = { version = "0.8", features = ["postgres", "runtime-tokio"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
anyhow = "1.0"
thiserror = "1.0"
wasmtime = "19.0"
pyo3 = { version = "0.22", features = ["auto-initialize"] }
tracing = "0.1"
opentelemetry = "0.23"
async-nats = "0.35"
vercel-blob = "0.2"   # streaming upload to Vercel Blob
```

### Rust ZIP Builder (Replaces JSZip)

```rust
// Rust ZIP builder — streaming, never buffers entire ZIP in RAM
use zip::write::ZipWriter;
use std::io::Cursor;

async fn build_project_zip(project: &Project) -> anyhow::Result<Vec<u8>> {
    let mut buf = Cursor::new(Vec::new());
    let mut zip = ZipWriter::new(&mut buf);
    let options = FileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .compression_level(Some(6));

    let root = format!("{}_{}", project.slug,
                       chrono::Utc::now().format("%Y-%m-%d_%H-%M-%S"));

    zip_add_file(&mut zip, &options, &format!("{}/AGENTS.md", root),
                 &project.agents_md)?;
    zip_add_file(&mut zip, &options, &format!("{}/ARTKINS_STYLE_GUIDE.md", root),
                 STYLE_GUIDE)?;

    for context_file in &project.context_files {
        zip_add_file(&mut zip, &options,
            &format!("{}/context/{}", root, context_file.file_name),
            &context_file.content)?;
    }
    for spec in &project.feature_specs {
        zip_add_file(&mut zip, &options,
            &format!("{}/feature-specs/{:02}-{}.md", root, spec.order, spec.slug),
            &spec.content)?;
    }
    // Diagrams fetched from Vercel Blob in parallel (added in v6.0.0)
    zip.finish()?;
    Ok(buf.into_inner())
}
```

### Rust Key Rotation Engine

```rust
#[derive(Clone)]
struct KeyPool {
    keys: Arc<RwLock<Vec<ApiKey>>>,
}

impl KeyPool {
    async fn next_available(&self) -> Option<ApiKey> {
        let keys = self.keys.read().await;
        keys.iter()
            .filter(|k| k.is_available() && !k.is_rate_limited())
            .min_by_key(|k| k.requests_today)
            .cloned()
    }

    async fn mark_rate_limited(&self, key_id: &str) {
        let mut keys = self.keys.write().await;
        if let Some(key) = keys.iter_mut().find(|k| k.id == key_id) {
            key.rate_limited_until = Some(Instant::now() + Duration::from_hours(24));
        }
    }
}
```

The Rust key rotation engine manages 50+ API keys across 6 providers without Python GIL contention. When a key is rate-limited, it is marked for 24 hours and the next available key is selected automatically. Python calls this engine via gRPC — no key management logic lives in Python.

### PyO3 Hot-Path Optimization

For CPU-intensive operations that must remain in Python's call stack (e.g., parsing large uploaded codebases for RAG ingestion):

```rust
#[pyfunction]
fn parse_codebase_fast(paths: Vec<String>) -> PyResult<Vec<String>> {
    use rayon::prelude::*;
    let results: Vec<String> = paths.par_iter()
        .filter_map(|path| parse_file(path).ok())
        .collect();
    Ok(results)
}
```

```python
# Zero serialization overhead — Rust-speed inside Python
from foundrie_core import parse_codebase_fast
symbols = parse_codebase_fast(list_of_file_paths)
```

---

## 5. LAYER 2 — PYTHON (AI ORCHESTRATION)

Python owns every concern where LLM calls are made, the RAG pipeline runs, LangGraph orchestrates the stateful discovery workflow, or embeddings are computed. Python does **not** own ZIP generation, key rotation, or high-throughput file serving.

### Multi-Model Rotation (New in v2.0.0)

```python
# Foundrie's model rotation — Python calls Rust key engine via gRPC
from langgraph.graph import StateGraph
from pydantic_ai import Agent

MODEL_CHAIN = [
    "claude-sonnet-4-20250514",  # primary
    "gemini-pro-2.0",            # first fallback
    "deepseek-r1",               # second fallback
    "kimi-k2",                   # third fallback
    "qwen-coder-plus",           # fourth fallback
]

async def call_with_rotation(prompt: str, state: FoundrieState) -> str:
    for model_id in MODEL_CHAIN:
        key = await rust_key_engine.next_available(provider=model_id.split("-")[0])
        if key is None:
            continue  # try next model
        try:
            return await llm_client.call(model_id, prompt, api_key=key)
        except RateLimitError:
            await rust_key_engine.mark_rate_limited(key.id)
            continue
    raise AllProvidersExhausted("All models exhausted")
```

### LangGraph — Stateful Discovery Workflow

```python
from langgraph.checkpoint.postgres import PostgresSaver

checkpointer = PostgresSaver.from_conn_string(os.environ["DATABASE_URL"])

workflow = StateGraph(FoundrieState)
workflow.add_node("discovery", run_discovery_phase)
workflow.add_node("architecture", generate_architecture)
workflow.add_node("diagram_gen", generate_diagrams)       # added in v6.0.0
workflow.add_node("spec_generation", write_feature_specs)
workflow.compile(checkpointer=checkpointer)
# Session is resumable after crash or power loss (v8.0.0)
```

### Core Python Requirements

```
langgraph==0.2.*
langchain-core==0.3.*
langchain-anthropic==0.3.*
pydantic-ai==0.0.50
chromadb>=0.5
llama-index-core==0.11.*
polars>=0.20         # Rust-backed DataFrames — 10× faster than Pandas
maturin>=1.5         # build PyO3 Rust extensions callable from Python
logfire>=0.30        # Pydantic's structured logging
opentelemetry-api>=1.25
```

---

## 6. LAYER 3 — TYPESCRIPT

TypeScript owns the web app, the diagram canvas, and all real-time collaboration surfaces.

### Core Stack

```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "typescript": "^5.5.0",
    "@ai-sdk/anthropic": "^1.0.0",
    "prisma": "^6.0.0",
    "@clerk/nextjs": "^6.0.0",
    "@liveblocks/react": "^2.0.0",
    "@xyflow/react": "^12.0.0",
    "@trigger.dev/sdk": "^3.0.0",
    "tailwindcss": "^4.0.0",
    "gsap": "^3.12.0",
    "zustand": "^5.0.0",
    "@tanstack/react-query": "^5.0.0",
    "zod": "^3.23.0",
    "@vercel/blob": "^0.24.0"
  }
}
```

### Next.js 16 Streaming AI Response

```typescript
// app/api/agent/route.ts — discovery conversation streaming
import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages, projectId } = await req.json();
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const result = await streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    messages,
    system: buildFoundrieSystemPrompt(projectId),
    onFinish: async ({ text }) => {
      await db.turn.create({ data: { projectId, content: text, role: 'assistant' } });
    },
  });
  return result.toDataStreamResponse();
}
```

---

## 7. LAYER 4 — GO

The Go API gateway routes between the Python AI layer, the Rust execution layer, and the TypeScript Next.js layer. It owns health checks, circuit breakers, and per-user rate limiting.

```go
package main
import "github.com/gin-gonic/gin"

func main() {
    r := gin.New()
    r.Use(gin.Recovery(), otelMiddleware(), authMiddleware())

    // AI/RAG discovery requests → Python LangGraph service
    r.Group("/api/ai/*path").Use(rateLimiter(10, "1m")).Any("",
        reverseProxy("http://ai-service:8000"),
    )
    // ZIP generation / file processing → Rust Axum service
    r.Group("/api/exec/*path").Any("",
        reverseProxy("http://rust-exec:8080"),
    )
    // Web UI → Next.js
    r.Group("/*path").Any("",
        reverseProxy("http://nextjs:3000"),
    )
    r.Run(":4000")
}
```

---

## 8. GSAP — MANDATORY FOR AWWWARD-LEVEL UI

GSAP is mandatory for all web UIs Foundrie generates that target Awwward-level quality. Feature specs for UI features always include GSAP implementation notes.

### Non-Negotiable GSAP Rules

```typescript
// Rule 1: Register plugins at module level — never inside components
gsap.registerPlugin(ScrollTrigger, SplitText, Flip);

// Rule 2: useLayoutEffect — not useEffect — prevents visual flash
useLayoutEffect(() => {
  const ctx = gsap.context(() => {
    gsap.from('[data-animate]', {
      y: 120, opacity: 0, duration: 0.9,
      ease: 'power4.out', force3D: true, stagger: 0.015,
    });
  }, containerRef); // scoped to container
  return () => ctx.revert(); // Rule 3: mandatory cleanup
}, []);

// Rule 4: GPU-only properties (never width/height/margin)
// ✅ transform + opacity → GPU compositing (free)
// ❌ width/height/margin → layout reflow (expensive)
gsap.to(el, { x: 100, y: 50, scale: 1.1, opacity: 0.5, force3D: true });
```

Every UI feature spec Foundrie generates includes:
- Which GSAP plugins are needed.
- Which elements carry `data-animate` attributes.
- What timing values to use from `context/ui-context.md` motion tokens.
- The `ctx.revert()` cleanup reference.

---

## 9. LANGUAGE DECISION MATRIX FOR GENERATED PROJECTS

When Foundrie generates a project, every technology choice follows this matrix:

```
DECISION                               ANSWER
──────────────────────────────────────────────────────────────────────
New CLI tool users install?            Rust (Tokio + Clap)
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
Mobile app?                            TypeScript (Expo/React Native)
Desktop app?                           Rust backend + TypeScript UI (Tauri)
Microservice gateway?                  Go (Gin + gRPC)
Between-service communication?         gRPC (language-agnostic)
Smart contract (Solana/NEAR)?          Rust (mandatory)
Smart contract (Ethereum)?             Solidity
Data pipeline (large datasets)?        Python + Polars (Rust-backed)
Starting a new project from scratch?   TypeScript first, add Rust when needed
```

This matrix is referenced in every stack-related feature spec Foundrie generates and is embedded in `context/architecture-context.md`.

---

## 10. GENERATED PROJECT LANGUAGE DEFAULTS BY TYPE

| Project Type | Default Language Choices |
|---|---|
| Web app | TypeScript (Next.js 16) + Rust (if API > 10K req/s) |
| Mobile app | TypeScript (Expo) + Rust (Nitro native modules if needed) |
| Desktop app | Rust (Tauri) + TypeScript (React frontend) |
| CLI tool | Rust (always — single binary distribution) |
| API service | TypeScript if < 10K req/s, Rust if > 10K req/s |
| Microservices | Go (gateway) + Rust/Python/TypeScript (services) |
| ML pipeline | Python (always — PyTorch mandatory) |
| Smart contract | Rust (Solana/NEAR/Stellar) or Solidity (Ethereum) |
| AI coding agent | Rust (runtime) + Python (AI layer) + TypeScript (UI) |

These defaults are applied by Foundrie during Phase 4 (Technical Direction) of the discovery protocol. The human can override any default; overrides are recorded in an ADR (introduced in v5.0.0).

---

## 11. NEW GENERATION INVARIANTS (14–17)

These are **additions** to the 13 invariants from v1.0.0. All v1.0.0 invariants remain in force.

14. All agent tool calls in generated agentic projects execute inside WASM sandboxes with explicit capability grants. Foundrie always generates a `tools/permissions.yaml` for agentic projects.
15. Language selection for every generated project follows the decision matrix in Section 9. Deviations are documented in an ADR.
16. Rust is the mandatory language for all CLI tools generated by Foundrie. No exceptions.
17. GSAP is the mandatory animation library for all web UI features targeting Awwward-level quality. `ctx.revert()` cleanup is always included in generated GSAP code.

---

*Foundrie AI v2.0.0 — Multi-language architecture and GSAP mandate integrated*
*See FOUNDRIE_V3_0_0.md for production-grade security baked into all generated outputs: seven-layer model, CI/CD 22-step pipeline, agentic threat taxonomy, and behavioral regression tests*
