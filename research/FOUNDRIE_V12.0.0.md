# FOUNDRIE AI — Research & Operating Specification
## Version 12.0.0

**Version**: 12.0.0
**Release Date**: 2026-05-19
**Status**: Superseded by v13.0.0
**Previous Version**: 11.0.0
**Base**: All v1.0.0 through v11.0.0 content remains in force. This version only documents what changes.
**Purpose**: Formalize the distinction between Context Engineering, Memory Engineering, and Harness Engineering as three separate disciplines that Foundrie and RUWA both implement and generate into every produced project. Establish Mem0, FastMCP, and Firecrawl as the three foundational production AI agent libraries — specifying how Foundrie generates their scaffolding and how RUWA uses them at runtime. Elevate production logging from a generated feature (v3.0.0) to a platform-level discipline with explicit quality standards that Foundrie enforces for itself and every project it produces.
**Source Research**: FOUNDRIE-RUWA-PATCH v2 §§4, 5, 6

---

## CHANGELOG — v12.0.0

### New [NEW]

#### Production Logging (Platform Discipline — Elevated from v3.0.0)
- "The Vibe-Coding Logging Problem" formally documented: AI-generated code produces the happy path with no observability layer by default. This is a business risk, not a cosmetic issue.
- Structured JSON logging requirement elevated to platform invariant: `console.log` is never the logging mechanism in any Foundrie-generated code or Foundrie's own codebase. Violation is a generation error.
- Log level taxonomy with enforcement rules: DEBUG (dev only), INFO (normal ops), WARN (unexpected but recoverable), ERROR (broke, needs attention), FATAL (system cannot continue), AUDIT (security/compliance — always on, immutable).
- Centralized logging destinations: Datadog, Logtail, AWS CloudWatch, Grafana Loki — Foundrie selects based on client stack and budget during discovery Phase 4.
- Request ID requirement: every API request generates a UUID; every log entry for that request includes the request ID. Without this, intermittent bugs are unfindable in production.
- Foundrie's own logging: Logfire (Pydantic's structured logging) for the Python AI layer; Pino for the TypeScript web layer; `tracing` crate for the Rust execution layer — already specified in v2.0.0 §3 but now unified under a single logging discipline document.
- Logging checklist (7 items) generated as a section in `docs/PRODUCTION-CHECKLIST.md` (v3.0.0 §10) — added to the existing checklist.

#### Context Engineering (New Discipline)
- Context Engineering formally defined: optimization of the signal-to-noise ratio within a context window.
- Three context engineering principles applied by Foundrie: include only what is necessary, pre-process and chunk before feeding to model, use structured formats (XML/JSON) over prose where machine-readability is needed.
- Context hierarchy: system context → task context → conversation context. Foundrie's system prompts are context-engineered. Ruwa's research outputs are pre-processed and chunked before downstream generation tasks.
- Context pruning: stale context is removed as conversations grow. Foundrie's LangGraph nodes prune context at the start of Phase 6 (Architecture Diagramming) — removing early Phase 1 exploration that is no longer relevant.
- Foundrie generates `context/ai-workflow-rules.md` (v1.0.0) using context engineering principles: every rule is concise, structured, and unambiguous. Prose rules that could be interpreted multiple ways are prohibited.

#### Memory Engineering (New Discipline)
- Memory Engineering formally defined: design and implementation of systems that learn, retain, retrieve, and evolve knowledge across agent interactions.
- Memory taxonomy: Episodic (specific past events), Semantic (general facts and knowledge), Procedural (how to do things), Working (current task context — in-context only).
- Mem0 as the memory backend for both Foundrie and RUWA: persistent cross-session memory for user preferences, past project context, and client-specific patterns.
- Foundrie memory layer: Ruwa's role in maintaining client knowledge graphs and preference histories. When a returning user opens a new Foundrie session, relevant past project context is surfaced automatically.
- RUWA memory layer: RUWA remembers per-project state (which features are complete, which specs had discrepancies, which patterns worked) across sessions via Mem0.
- Memory decay policy: Episodic memories older than 90 days are scored for relevance. Low-relevance memories are archived, not deleted. Semantic memories do not decay.
- Memory evolution: when new information contradicts an existing memory, the old memory is not deleted — it is versioned with a "superseded by" pointer. This preserves history and enables rollback of memory state.
- Foundrie generates Mem0 integration scaffolding in all AI-feature projects it plans.

#### Harness Engineering (New Discipline)
- Harness Engineering formally defined: the code, scaffolding, and structural architecture around agents and language models — everything except the model itself.
- Harness components: tool definitions and routing, agent orchestration, retry logic and error handling, rate limiting and cost management, security boundaries (what can agents access), observability (logging agent actions).
- FastMCP as the harness layer for tool exposure: any Python function becomes an MCP tool with a decorator. Foundrie uses FastMCP to expose its own document generation functions as tools. RUWA uses FastMCP to call Foundrie generation functions directly during research-to-document workflows.
- Firecrawl as the web intelligence layer: takes any URL, returns clean structured data ready for AI pipeline consumption. RUWA uses Firecrawl for market benchmarking research and reference repo README extraction.
- Full production agent architecture diagram: Client Query → Ruwa Agent (Mem0 + Firecrawl + FastMCP) → Processed Intelligence Package → Foundrie Agent (Mem0 + FastMCP) → Quality Gate → Delivery.
- Foundrie generates Mem0, FastMCP, and Firecrawl scaffolding for all agentic projects it plans.
- Generation invariants 87–97 added.

### Changes to Existing Content
- **Structured Logging (v3.0.0 §7)**: Elevated from a feature spec concern to a platform-level discipline. The logging utility module is now generated with centralized destination configuration (not just Pino setup). `console.log` is now explicitly listed in `context/code-standards.md` under "Never Use."
- **ZIP File Inventory (v6.0.0 §6)**: `docs/LOGGING.md` added as a generated file for every project — documents the centralized logging destination, retention policy, alert thresholds, and log level policy.
- **AGENTS.md Hard Rules (v1.0.0 §7.4)**: Rule 18 added — "Never use `console.log` for any production logging. Use the structured logger from `lib/logger.ts` (or equivalent) for all log emission."
- **Agentic Project Stack (v3.0.0 §1)**: Layer 4 (Agent Orchestration) is now formally identified as "Harness Engineering." The tool permission manifest (v3.0.0 §3) is the harness security boundary. The logging module (v3.0.0 §7) is the harness observability layer.

### Deprecated
- Nothing deprecated. All v11.0.0 content preserved.

---

## TABLE OF CONTENTS (v12.0.0 additions only)

1. [Production Logging as a Platform Discipline](#1-production-logging-discipline)
2. [Logging Checklist (Generated in Every Project)](#2-logging-checklist)
3. [Context Engineering — Definition and Application](#3-context-engineering)
4. [Memory Engineering — Definition and Taxonomy](#4-memory-engineering)
5. [Mem0 Integration — Foundrie, RUWA, and Generated Projects](#5-mem0-integration)
6. [Harness Engineering — Definition and Components](#6-harness-engineering)
7. [FastMCP — Tool Exposure Layer](#7-fastmcp-tool-exposure)
8. [Firecrawl — Web Intelligence Layer](#8-firecrawl-web-intelligence)
9. [Full Production Agent Architecture](#9-full-production-agent-architecture)
10. [New Generation Invariants (87–97)](#10-new-generation-invariants)

---

## 1. PRODUCTION LOGGING AS A PLATFORM DISCIPLINE

### The Vibe-Coding Logging Problem

When AI generates code, it overwhelmingly produces the "happy path." What it almost never generates by default is the observability layer: no logging, no tracing, no breadcrumbs.

This creates a dangerous gap in production:

- A user reports a bug. The developer asks: when did it start? What were they doing? What error occurred?
- Without logging, **nobody knows**. Nothing was recorded.
- Intermittent bugs — the ones that affect "some users, sometimes" — become essentially unfindable.

**This is not a minor inconvenience. It is a business risk.** Shipping a project without logging infrastructure is shipping an incomplete project.

Foundrie's v3.0.0 requirement to generate a logging utility module was a feature requirement. In v12.0.0, production logging is a **platform discipline** with explicit quality standards that Foundrie enforces:

1. For Foundrie's own codebase.
2. For every project Foundrie generates.
3. As an evaluation criterion: a generated project that lacks structured logging fails the quality gate.

### Centralized Logging Destination Selection (Discovery Phase 4)

During discovery Phase 4 (Technical Direction), Foundrie now asks:

```
"What is your expected logging and observability setup?
  A. Managed: Datadog (feature-rich, $15/host/month)
  B. Managed: Logtail / Better Stack (simple, affordable, $0–25/month)
  C. Cloud-native: AWS CloudWatch (free tier, then per-GB)
  D. Self-hosted: Grafana Loki + Prometheus (free, requires infra)
  E. Not decided yet — generate with Logtail as default

This determines which logging destination RUWA configures
during the observability feature spec."
```

The chosen destination is recorded in `context/architecture-context.md` and drives the observability feature spec implementation.

### Foundrie's Own Logging by Layer

```
TypeScript web layer (Next.js):
  Library: Pino (v3.0.0)
  Destination: Logtail / Datadog OTLP endpoint
  Format: structured JSON, redaction of *.password, *.token, *.apiKey

Python AI layer (LangGraph):
  Library: Logfire (Pydantic's structured logging)
  Destination: Logfire cloud + OTLP export to central aggregator
  Format: structured, with gen_ai.* OpenTelemetry conventions

Rust execution layer (Axum):
  Library: tracing crate + tracing-subscriber with JSON formatter
  Destination: OTLP exporter → central aggregator
  Format: structured JSON with trace_id, span_id propagation
```

All three layers emit to a single central aggregator (Datadog or Grafana Loki depending on deployment). Logs are correlated by `trace_id` across all three layers — one user request can be followed from the TypeScript frontend through the Go gateway, through the Rust ZIP builder, through the Python LangGraph discovery session.

---

## 2. LOGGING CHECKLIST (GENERATED IN EVERY PROJECT)

Foundrie generates `docs/LOGGING.md` in every ZIP. RUWA configures the logging destination during the observability feature spec. The checklist is also appended to `docs/PRODUCTION-CHECKLIST.md` (v3.0.0 §10).

```markdown
# Logging Configuration

## Checklist

- [ ] Structured JSON logging configured (no `console.log` anywhere in production paths)
- [ ] Log levels implemented and documented (DEBUG/INFO/WARN/ERROR/FATAL/AUDIT)
- [ ] Request IDs generated (UUID) and attached to all log entries for a request
- [ ] Centralized logging destination configured: [DESTINATION from discovery]
- [ ] Error alerting rule configured: alert if ERROR rate > 1% over 5 minutes
- [ ] Log retention policy: [30 days / 90 days / 1 year] per compliance requirement
- [ ] Sensitive data excluded: no passwords, tokens, API keys, PII in any log entry

## Centralized Destination

Destination: [Datadog / Logtail / CloudWatch / Grafana Loki]
Workspace/Index: [configured during observability feature]
Alert contact: [email/Slack channel]

## Log Level Policy

| Level  | When to Use                          | Example                          |
|--------|--------------------------------------|----------------------------------|
| DEBUG  | Development only — verbose state     | Variable values mid-function     |
| INFO   | Normal operations worth recording    | User logged in, file uploaded    |
| WARN   | Unexpected but recoverable           | Retry attempt 2 of 3             |
| ERROR  | Something broke, needs attention     | API call failed after 3 retries  |
| FATAL  | System cannot continue               | DB connection lost on startup    |
| AUDIT  | Security/compliance — always on      | Tool permission check, auth fail |

Critical rule: Do not dump everything at INFO. A wall of INFO logs is
as useless as no logs. Level discipline is required.
```

---

## 3. CONTEXT ENGINEERING — DEFINITION AND APPLICATION

**Definition**: The optimization of the signal-to-noise ratio within a context window. Every token in the context window costs attention budget. Context engineering maximizes the value of every piece of information that enters the window.

### Principles Applied by Foundrie

```
1. Include only what is necessary for the current task.
   → Foundrie's LangGraph nodes prune context between phases.
   → Phase 6 (Diagramming) context includes: Phase 1–5 summary only,
     not the full conversation transcript.

2. Pre-process and chunk documents before feeding to the model.
   → Uploaded files are chunked to ChromaDB before discovery begins.
   → Research files are summarized by RUWA before Foundrie uses them.
   → Reference repo code is extracted by function/class boundaries, not raw files.

3. Use structured formats over prose where machine-readability is needed.
   → Feature specs use explicit fields (Objective, Files to Create, Acceptance Criteria).
   → Context files use markdown tables for API routes, ENV vars, DB schemas.
   → AGENTS.md uses numbered lists for rules — not paragraphs.

4. Maintain context hierarchies.
   → System context (AGENTS.md + code-standards) → Task context (current feature spec)
   → Conversation context (current implementation thread).
   → Lower hierarchy does not override higher hierarchy.

5. Prune stale context as conversations grow.
   → After Phase 5, the detailed Phase 1–3 elicitation messages are summarized.
   → The summary replaces the full transcript in the context window going forward.
   → Original transcript is stored in Neon Postgres — accessible if needed, not in context.
```

### Generated Project Application

For all agentic projects Foundrie plans, `context/ai-workflow-rules.md` now includes a "Context Engineering" section:

```markdown
## Context Engineering Rules

1. Before each feature, read only the feature spec for the current feature
   and the context files. Do not re-read previous feature specs unless
   the current spec explicitly references them.

2. When reading large files (> 100KB), use ChromaDB semantic search to
   find relevant sections. Do not load the entire file into context.

3. Structure all intermediate outputs as JSON or markdown tables, not prose,
   when the output will be used as input to another step.

4. After each feature is approved, summarize any implementation decisions
   made during the build and add them to context/progress-tracker.md
   under "Architecture Decisions." Do not keep the full implementation
   conversation in context for future features.
```

---

## 4. MEMORY ENGINEERING — DEFINITION AND TAXONOMY

**Definition**: The design and implementation of systems that can learn, retain, retrieve, and evolve knowledge across agent interactions. This is not just "storing chat history."

### Memory Taxonomy

| Memory Type | Description | Storage | Example in Foundrie/RUWA |
|-------------|-------------|---------|--------------------------|
| **Episodic** | Specific past events | Mem0 vector store | "On Jan 10, user set preferred database to Neon Postgres" |
| **Semantic** | General facts and knowledge | Mem0 knowledge graph | "User is building in the fintech industry" |
| **Procedural** | How to do things | Mem0 key-value | "This client prefers bullet-point summaries over prose" |
| **Working** | Current task context | In-context (LangGraph state) | "We are currently implementing Feature 05 — Auth" |

### Memory Engineering Questions Foundrie Asks

For every agent system it plans, Foundrie surfaces:

```
1. What should the agent remember?
   → User preferences, past project patterns, client-specific constraints.

2. What triggers retrieval?
   → Start of new session (retrieve all semantic/episodic for that user).
   → Before each feature (retrieve procedural: "how does this client prefer code documented?").

3. When does a memory decay?
   → Episodic: scored for relevance after 90 days.
   → Semantic: no decay (general facts stay true).
   → Working: cleared at end of each feature. Never persisted.

4. How is memory updated when contradicted?
   → New information does not overwrite old memory.
   → Old memory is versioned: {content: "...", superseded_by: "...", superseded_at: "..."}
   → The latest non-superseded memory is the active one.
   → History is preserved for debugging and rollback.
```

---

## 5. MEM0 INTEGRATION — FOUNDRIE, RUWA, AND GENERATED PROJECTS

### Mem0 in Foundrie

Foundrie uses Mem0 to remember across sessions for returning users:

```python
# Foundrie's Python AI layer — Mem0 integration
from mem0 import Memory

m = Memory()

# On session start — load user's context
async def load_user_context(user_id: str) -> dict:
    memories = m.get_all(user_id=user_id)
    return {
        "preferred_stack": next(
            (mem["memory"] for mem in memories if "preferred_stack" in mem["memory"]), None
        ),
        "past_projects": [
            mem["memory"] for mem in memories if "project" in mem["memory"]
        ],
        "style_preferences": next(
            (mem["memory"] for mem in memories if "prefers" in mem["memory"]), None
        ),
    }

# During discovery — store what matters
async def store_session_learnings(user_id: str, session: FoundrieSession):
    # Store stack choice for future recall
    m.add(
        f"User chose {session.stack} for {session.project_type} projects",
        user_id=user_id
    )
    # Store team size for future discovery scaling
    m.add(
        f"User's team size: {session.team_size}",
        user_id=user_id
    )
```

### Mem0 in RUWA

RUWA uses Mem0 to remember across features and projects:

```python
# RUWA's memory layer — project and user context
from mem0 import Memory

m = Memory()

# Before implementing a feature — retrieve relevant memories
async def get_implementation_context(user_id: str, feature_name: str) -> dict:
    memories = m.get_all(user_id=user_id)
    return {
        "format_preference": next(
            (mem["memory"] for mem in memories if "format" in mem["memory"]), None
        ),
        "past_patterns": [
            mem["memory"] for mem in memories
            if feature_name.split("-")[0] in mem["memory"]
        ],
    }

# After feature approval — store what worked
async def store_feature_outcome(user_id: str, feature: str, notes: str):
    m.add(
        f"Feature {feature}: {notes}",
        user_id=user_id
    )
```

### Mem0 in Generated Projects

For every agentic project Foundrie generates, the AI-integration feature spec includes:

```python
# Generated: lib/agent/memory.py — scaffolded by Foundrie, implemented by RUWA
from mem0 import Memory

m = Memory()

class AgentMemory:
    """Manages episodic and semantic memory for the AI agent."""

    def remember(self, user_id: str, content: str) -> None:
        """Store a new memory about the user or their preferences."""
        m.add(content, user_id=user_id)

    def recall(self, user_id: str, query: str | None = None) -> list[dict]:
        """Retrieve memories relevant to the current task."""
        if query:
            return m.search(query, user_id=user_id)
        return m.get_all(user_id=user_id)

    def update(self, user_id: str, old_content: str, new_content: str) -> None:
        """Update a memory when new information supersedes old information."""
        # Mem0 handles versioning internally
        m.add(new_content, user_id=user_id)
        # Old memory is automatically versioned, not deleted
```

---

## 6. HARNESS ENGINEERING — DEFINITION AND COMPONENTS

**Definition**: The code, scaffolding, and structural architecture around agents and language models — everything except the model itself. If the LLM is the engine, the harness is the car.

### Harness Components (What Foundrie Generates)

```
1. TOOL DEFINITIONS AND ROUTING
   → tools/permissions.yaml (v3.0.0 §3): which tools exist, what they can do
   → FastMCP decorators (Section 7): how tools are exposed to agents
   → tool-gateway.ts (v3.0.0 §2): how tool calls are authenticated and sandboxed

2. AGENT ORCHESTRATION
   → LangGraph state machines for multi-step workflows
   → Feature spec ordering from the Feature DAG (v6.0.0)
   → Batch-mode queuing for collaborative sessions (v8.0.0)

3. RETRY LOGIC AND ERROR HANDLING
   → Exponential backoff on LLM API calls
   → Fallback model chain (v2.0.0 §5)
   → Graceful degradation when a tool fails

4. RATE LIMITING AND COST MANAGEMENT
   → Per-user API key rotation (v2.0.0 §4)
   → Token budget per session (logged, alerted when approaching limit)
   → Cost tracking: tokens consumed × model price → session cost estimate

5. SECURITY BOUNDARIES
   → Tool permission manifest (v3.0.0 §3)
   → WASM sandbox per tool call (v2.0.0 §4)
   → Instruction hierarchy enforcement (v3.0.0 §2)

6. OBSERVABILITY
   → Structured logging for every tool call (this version §1)
   → OpenTelemetry traces across every agent action (v3.0.0 §8)
   → Behavioral anomaly detection (v3.0.0 §2 Layer 4)
```

### Harness Quality Standard

A well-engineered harness must be:
- **Opaque from the LLM's perspective**: The model issues a tool call. The harness handles auth, sandboxing, rate limiting, logging, and error handling. The model only sees the result.
- **Transparent from the operator's perspective**: Every tool call is logged with full context. Every retry is logged. Every sandbox violation is logged at AUDIT level.
- **Resilient**: A failing tool does not crash the agent. The harness catches the error, logs it, and returns a structured error response to the model.

---

## 7. FASTMCP — TOOL EXPOSURE LAYER

FastMCP lets any Python function be exposed as an MCP (Model Context Protocol) tool with a simple decorator. This is how Foundrie's own generation functions are called by RUWA without complex API surface.

### FastMCP in Foundrie's Own Codebase

```python
# Foundrie's Python AI layer — tools exposed via FastMCP
from fastmcp import FastMCP

mcp = FastMCP("Foundrie Generation Tools")

@mcp.tool()
def generate_feature_spec(
    feature_name: str,
    feature_number: int,
    depends_on: list[int],
    diagram_sources: list[str],
) -> str:
    """Generate a complete feature spec from diagram sources.
    Returns the full markdown content of the spec."""
    return spec_generator.generate(feature_name, feature_number, depends_on, diagram_sources)

@mcp.tool()
def generate_erd_from_schema(schema_description: str) -> str:
    """Generate an ERD in DBML format from a natural language schema description."""
    return diagram_generator.erd_from_description(schema_description)

@mcp.tool()
def get_project_context(project_id: str) -> dict:
    """Retrieve all context files for a project."""
    return db.project.find_unique(where={"id": project_id}, include={"contextFiles": True})
```

### FastMCP in Generated Projects

For every agentic project Foundrie plans, the harness feature spec includes:

```python
# Generated: lib/agent/tools.py — scaffolded by Foundrie, implemented by RUWA
from fastmcp import FastMCP

mcp = FastMCP("[Project Name] Agent Tools")

@mcp.tool()
def get_user_data(user_id: str) -> dict:
    """Retrieve user profile and history from the database.

    Security: This tool is scoped to the authenticated user's own data.
    The user_id parameter is validated against the authenticated session
    before the database query executes.
    """
    # Validation happens before the query — never trust the agent to scope correctly
    if not auth.can_access(session.user_id, user_id):
        raise ToolPermissionDenied("Cannot access another user's data")
    return db.user.find_unique(where={"id": user_id})

@mcp.tool()
def search_knowledge_base(query: str, top_k: int = 5) -> list[dict]:
    """Search the knowledge base for relevant documents.

    Returns up to top_k documents ranked by semantic similarity.
    This tool does not modify any data.
    """
    return vector_db.search(query, top_k=min(top_k, 10))  # cap at 10 regardless
```

---

## 8. FIRECRAWL — WEB INTELLIGENCE LAYER

Firecrawl takes any URL and returns clean, structured data ready to feed into an AI pipeline. It handles JavaScript-rendered content, pagination, and structure extraction.

### Firecrawl in RUWA

RUWA uses Firecrawl for two primary use cases:

**Use Case 1: Reference Repo README Extraction**

When a reference repo is specified in a Foundrie session (v7.0.0 §3), RUWA uses Firecrawl to read the repo's GitHub README as clean markdown — removing all GitHub UI chrome:

```python
# RUWA reads reference repo READMEs via Firecrawl
from firecrawl import FirecrawlApp

app = FirecrawlApp()

async def read_reference_repo(github_url: str) -> str:
    """Extract clean README from a GitHub repo for use in implementation notes."""
    result = app.scrape_url(
        github_url,
        params={"formats": ["markdown"], "onlyMainContent": True}
    )
    return result["markdown"]
```

**Use Case 2: Market Rate and Technology Benchmarking**

When Foundrie generates a rate card or pricing document (Lynxcs Industries context), RUWA uses Firecrawl to crawl industry pricing pages:

```python
async def benchmark_service_pricing(service_name: str, pricing_url: str) -> dict:
    """Crawl a service's pricing page and extract tier information."""
    result = app.scrape_url(
        pricing_url,
        params={"formats": ["markdown"], "onlyMainContent": True}
    )
    # Feed clean markdown to LLM for structured extraction
    pricing_data = await llm.extract_pricing(result["markdown"], service=service_name)
    return pricing_data
```

### Firecrawl in Generated Projects

For research-intensive agentic projects, the web-intelligence feature spec includes:

```python
# Generated: lib/agent/web-intelligence.py
from firecrawl import FirecrawlApp

app = FirecrawlApp()

class WebIntelligence:
    """Provides clean web content for agent consumption."""

    async def read_url(self, url: str) -> str:
        """Fetch and clean any URL. Returns markdown, not raw HTML."""
        # URL safety check runs first (v10.0.0 §4)
        safety = await url_safety_checker.check(url)
        if not safety.safe:
            raise UnsafeURLError(url, safety.reason)

        result = app.scrape_url(url, params={"formats": ["markdown"]})
        return result["markdown"]

    async def crawl_site(self, base_url: str, max_pages: int = 10) -> list[str]:
        """Crawl a site up to max_pages depth. Returns list of clean markdown pages."""
        result = app.crawl_url(base_url, params={"limit": max_pages, "formats": ["markdown"]})
        return [page["markdown"] for page in result["data"]]
```

---

## 9. FULL PRODUCTION AGENT ARCHITECTURE

This is the complete architecture for Foundrie + RUWA as a system, with all v12.0.0 additions integrated:

```
CLIENT QUERY (from Engineer)
         ↓
RUWA AGENT (Research + Memory)
  ├── Mem0: Load engineer context (episodic + semantic + procedural memories)
  ├── Firecrawl: Gather web intelligence (reference repos, market data, tech docs)
  ├── FastMCP: Call Foundrie generation tools (spec generation, diagram generation)
  └── ChromaDB: Retrieve relevant past project patterns
         ↓
PROCESSED INTELLIGENCE PACKAGE
  (context-engineered: chunked, structured, signal-to-noise optimized)
         ↓
FOUNDRIE AGENT (Generation)
  ├── Mem0: Retrieve format preferences and past project patterns
  ├── FastMCP: Call document templates and generation functions
  ├── LangGraph: Orchestrate multi-phase discovery workflow with PostgresSaver checkpoints
  └── Output: Client-ready ZIP with all context files, diagrams, and feature specs
         ↓
QUALITY GATE (Harness layer — v3.0.0 quality gate + v14.0.0 handoff protocol)
  ├── Hidden requirements catalog check (v10.0.0 §5)
  ├── Proactive architecture warning check (v10.0.0 §7)
  ├── Diagram completeness check (v6.0.0 §1)
  └── Feature spec structural validation (v1.0.0 §8)
         ↓
DELIVERY TO ENGINEER (ZIP download)
         ↓
RUWA EXECUTES (feature-by-feature, branch-by-branch)
  ├── Reads diagrams first (v6.0.0 §7)
  ├── Reads context files (v1.0.0 §7.2)
  ├── Implements features using all harness components
  └── Runs repo health check before each feature (v9.0.0 §1)
```

### How the Three Disciplines Work Together

```
CONTEXT ENGINEERING governs:
  What goes into each LangGraph node's context window.
  How research files are summarized before use.
  How feature specs reference diagrams (not re-explaining them).

MEMORY ENGINEERING governs:
  What Mem0 stores after each session.
  What Mem0 retrieves at the start of each session.
  How contradictions between memories are versioned.

HARNESS ENGINEERING governs:
  How tools are defined and exposed (FastMCP).
  How tool calls are secured and logged (tool-gateway + permissions.yaml).
  How failures are caught and reported (structured logging + OpenTelemetry).
  How cost is tracked (token budget + session cost estimate).
```

Confusing these three disciplines produces poorly-architected AI systems. Treating them as one "AI system" concern leads to:
- Context overload (no context engineering).
- Amnesia between sessions (no memory engineering).
- Brittle pipelines that crash on tool errors (no harness engineering).

Foundrie treats each as a separate discipline with separate quality standards.

---

## 10. NEW GENERATION INVARIANTS (87–97)

These are **additions** to invariants 1–86. All prior invariants remain in force.

87. `console.log` is never the logging mechanism in any Foundrie-generated backend code or Foundrie's own codebase. Every generated project includes a structured logging utility module as a mandatory feature spec. Violation is a generation quality error.

88. Every generated project's `docs/LOGGING.md` specifies: the centralized logging destination (chosen during Phase 4 discovery), log level policy, request ID requirement, alert threshold, retention policy, and sensitive data exclusion list.

89. Every API request in a generated project generates a UUID request ID. Every log entry emitted during that request includes the request ID. This is enforced as an acceptance criterion in the observability feature spec.

90. Foundrie generates context-engineered system prompts for all agentic projects: rules are structured (numbered lists, markdown tables), not prose; stale context is pruned between phases; working memory is never persisted beyond the current feature.

91. Foundrie generates Mem0 integration scaffolding (`lib/agent/memory.py` or equivalent) for all agentic projects. The scaffolding includes `remember()`, `recall()`, and `update()` methods with memory taxonomy applied.

92. Memory evolution (not overwrite) is enforced in all Mem0 integrations: contradictory new information creates a new versioned memory entry with a "superseded_by" pointer. Deletion of existing memories is prohibited except by explicit user request.

93. Foundrie generates FastMCP tool definitions for all agentic projects. Every tool has explicit security validation (permission check before execution) as the first step of its implementation. The tool's docstring documents its scope and security guarantees.

94. Every FastMCP tool call in a generated project passes through the tool gateway (v3.0.0 §2): authentication check, anomaly detection check, WASM sandbox execution, output validation — in that order.

95. Foundrie generates Firecrawl integration scaffolding for all research-intensive agentic projects. All URLs processed by Firecrawl pass through the malicious URL detection check (v10.0.0 §4) before Firecrawl fetches them.

96. The quality gate (harness layer) checks every generated ZIP for: hidden requirements completeness (v10.0.0), proactive architecture warnings (v10.0.0), diagram completeness (v6.0.0), and feature spec structural validation (v1.0.0). A ZIP that fails any gate check is not delivered — it is returned to the generation phase with specific failure reasons.

97. The three engineering disciplines (Context, Memory, Harness) are treated as separate concerns in all generated agentic projects. `context/ai-workflow-rules.md` has a separate section for each discipline with specific rules. Conflating them in the rules file is a generation quality error.

---

*Foundrie AI v12.0.0 — Production logging discipline, context/memory/harness engineering formalized, Mem0/FastMCP/Firecrawl production agent stack specified for Foundrie, RUWA, and all generated agentic projects*
*See FOUNDRIE_V13_0_0.md for dependency security in vibe-coded apps, the full client lifecycle management framework, and Foundrie-generated legal and business documents*
