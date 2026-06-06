# FOUNDRIE AI — Research & Operating Specification
## Version 6.0.0

**Version**: 6.0.0
**Release Date**: 2026-05-19
**Status**: Superseded by v7.0.0
**Previous Version**: 5.0.0
**Base**: All v1.0.0 through v5.0.0 content remains in force. This version only documents what changes.
**Purpose**: Establish diagramming as Foundrie's primary feature — the activity that happens before any feature spec is written. Define the full diagram suite, the diagram-first gate, the updated 8-phase discovery protocol, diagram versioning, the diagram technology stack, and the updated ZIP structure that includes a `diagrams/` directory.
**Source Research**: FOUNDRIE-RUWA-PATCH.md §1

---

## CHANGELOG — v6.0.0

### Breaking Changes (MAJOR bump: 5.0.0 → 6.0.0)
- **Discovery protocol** extended from 5 phases to **8 phases**. Phases 6, 7, and 8 are new: Architecture Diagramming, Feature Spec Generation (from diagrams), and ZIP Assembly. No spec is written before Phase 6 completes.
- **ZIP structure** now includes mandatory `diagrams/` directory. Any ZIP without it is invalid.
- **Feature spec ordering** is now derived from the Feature Dependency Graph (DAG), not from conversational order. The DAG is a generated diagram.
- **RUWA startup sequence** updated: RUWA reads all diagrams before reading any context file (new Steps 4–7 in the reading order).

### New [NEW]
- The Diagram-First Gate: hard invariant — no feature spec is written until all applicable diagrams are generated and human-approved.
- Full diagram suite specification: 12 diagram types, each with trigger condition (always vs conditional).
- System Context Diagram (C4 Level 1) — always generated first.
- Container Diagram (C4 Level 2) — generated after Context Diagram is approved.
- Component Diagram (C4 Level 3) — generated per container with > 3 internal components.
- Entity Relationship Diagram (ERD) — always generated if project has a database.
- Sequence Diagrams — one per core user flow; minimum 3 for any app.
- Data Flow Diagram (DFD) — always generated if project handles user data, payments, or AI signals.
- State Machine Diagram — conditional; only if objects have lifecycle states.
- Deployment Diagram — always if more than one deployment target exists.
- API Map Diagram — always if more than 3 API endpoints exist; auto-generates OpenAPI YAML.
- Feature Dependency Graph (DAG) — always; drives feature spec ordering.
- Agent Architecture Diagram — conditional; only for agentic projects.
- Security Architecture Diagram — always; maps seven-layer model (v3.0.0) to actual infrastructure.
- Diagram versioning: old diagram versions stored in `diagrams/vN/` when changed.
- Diagram technology stack table (authoring tool per type, export format per type).
- Updated ZIP file inventory with full `diagrams/` structure.
- Updated AGENTS.md reading order (Steps 4–7 are new diagram reads).
- Updated RUWA invariant: RUWA never implements a DB table, API route, or component not in the corresponding diagram.
- Generation invariants 36–44 added.

### Changes to Existing Content
- **Discovery Protocol (v1.0.0 §5)**: Phases 1–5 unchanged; Phases 6–8 added.
- **ZIP Assembly (v1.0.0 §15)**: `diagrams/` directory added as mandatory section.
- **AGENTS.md Reading Order (v1.0.0 §7.2)**: Steps 4–7 inserted (diagram reads before context files).

### Deprecated
- Nothing deprecated. All v5.0.0 content preserved.

---

## TABLE OF CONTENTS (v6.0.0 additions only)

1. [The Diagram-First Gate](#1-the-diagram-first-gate)
2. [Updated Discovery Protocol (8 Phases)](#2-updated-discovery-protocol)
3. [The Full Diagram Suite](#3-the-full-diagram-suite)
4. [Diagram Technology Stack](#4-diagram-technology-stack)
5. [Diagram Versioning](#5-diagram-versioning)
6. [Updated ZIP File Inventory (diagrams/)](#6-updated-zip-file-inventory)
7. [Updated AGENTS.md Reading Order](#7-updated-agentsmd-reading-order)
8. [Updated RUWA Invariant for Diagrams](#8-updated-ruwa-invariant)
9. [New Generation Invariants (36–44)](#9-new-generation-invariants)

---

## 1. THE DIAGRAM-FIRST GATE

The core architectural correction in v6.0.0. In v1.0.0–v5.0.0, feature specs were written from the conversation. This was wrong. Feature specs must be written from diagrams.

```
WRONG (v1.0.0–v5.0.0):
  Discovery conversation → Feature specs written → Diagrams generated optionally

CORRECT (v6.0.0):
  Discovery conversation → ALL DIAGRAMS GENERATED → Human reviews + approves
  → Feature specs written FROM diagrams → ZIP assembled → RUWA executes
```

**The diagram-first gate is a hard stop.** No feature spec file is created, no context file references a specific architecture choice, and no ZIP is assembled until:

1. All applicable diagrams have been generated.
2. The human has reviewed every diagram on the Foundrie canvas.
3. The human has explicitly approved the architecture (or iterated until approval).
4. Any change requests have been applied and re-reviewed.

This is what makes Foundrie different from every other planning tool: the architecture is visible, reviewable, and locked before a single line of spec is written.

---

## 2. UPDATED DISCOVERY PROTOCOL (8 PHASES)

Phases 1–5 are unchanged from v1.0.0 §5. Phases 6–8 are new.

```
Phase 1: Problem & Users (unchanged)
Phase 2: Core Flows (unchanged)
Phase 3: Scope & Constraints (unchanged)
Phase 4: Technical Direction (unchanged)
Phase 5: Feature Sequence (preliminary — revised after diagrams)
─────────────────────────────────────────────────────────────────────
Phase 6 [NEW]: Architecture Diagramming
  6.1  Generate System Context Diagram
  6.2  Human reviews → approves or requests changes → loop until approved
  6.3  Generate Container Diagram (from approved Context Diagram)
  6.4  Human reviews → approves or requests changes → loop until approved
  6.5  Generate all remaining applicable diagrams:
       ERD, Sequence Diagrams, DFD, State Machine, Deployment,
       API Map, Agent Architecture, Security Architecture
  6.6  Human reviews all remaining diagrams on canvas simultaneously
  6.7  Human approves complete architecture or iterates
─────────────────────────────────────────────────────────────────────
Phase 7 [NEW]: Feature Spec Generation (from diagrams)
  7.1  Generate Feature Dependency Graph (DAG)
  7.2  Topological sort → assign feature numbers
  7.3  Write each feature spec, tracing content to the diagram that governs it
  7.4  Human reviews feature spec sequence
  7.5  Human approves or adjusts ordering
─────────────────────────────────────────────────────────────────────
Phase 8 [NEW]: ZIP Assembly
  8.1  Compile all diagrams (.mermaid + .svg + format-specific exports)
  8.2  Compile all context files
  8.3  Compile all feature specs
  8.4  Compile all research files
  8.5  Bundle project-management files (formal spec in v9.0.0)
  8.6  Generate ZIP with naming convention
  8.7  Human downloads ZIP
```

---

## 3. THE FULL DIAGRAM SUITE

### 3.1 System Context Diagram (C4 Level 1)
**Trigger**: Always. First diagram in every session.

Shows the system and its relationship to external actors. The human must verify this first — if actors are wrong, no subsequent diagram is valid.

```
┌────────────────────────────────────────────────────────────┐
│  SYSTEM CONTEXT DIAGRAM                                     │
│                                                             │
│  [End User] ──── HTTPS ───→ [Your System Name]             │
│                               │                             │
│                     ┌─────────┼──────────┐                  │
│                     ▼         ▼          ▼                  │
│               [Clerk Auth] [Neon DB] [Anthropic API]        │
│                                                             │
│  Label: system name, external actors, protocols             │
└────────────────────────────────────────────────────────────┘
```

### 3.2 Container Diagram (C4 Level 2)
**Trigger**: Always. Generated immediately after Context Diagram is approved.

Shows deployable units — what runs where. Drives the feature spec count: one container = at minimum one feature spec for its setup.

Each container node must include: language label, framework label, port, protocol, deployment target.

### 3.3 Component Diagram (C4 Level 3)
**Trigger**: For every container with more than 3 internal components.

One diagram per container. For the Next.js app: pages, server components, client components, API routes. For the Rust API: handlers, middleware, repositories, service layers.

### 3.4 Entity Relationship Diagram (ERD)
**Trigger**: Always if the project has a database.

Fully normalized: all tables, column names, data types, primary keys, foreign keys, indexes, constraints.

```
USER ───< PROJECTS >─── FEATURES
  │                        │
  │                    FEATURE_SPECS
  │                        │
  └──── SESSIONS ──────────┘
           │
         MESSAGES
```

Reviewed and approved before the database schema feature spec is written.

### 3.5 Sequence Diagrams (Per Core Flow)
**Trigger**: One per core user flow. Minimum 3 for any app.

Required flows (adapt per project):
- Authentication: signup → verify → first login
- Core CRUD: create → list → update → delete
- Payment flow: plan selection → checkout → webhook → entitlement

Sequence diagrams are the **primary driver of Implementation Notes** in feature specs.

### 3.6 Data Flow Diagram (DFD)
**Trigger**: Always if project handles user data, payments, or AI training signals.

Shows where data comes from, where it goes, where it is transformed, where it is stored. Compliance reviewers (GDPR/CCPA) read this diagram — it maps directly to data handling obligations.

### 3.7 State Machine Diagram
**Trigger**: Conditional — only if the project has objects with lifecycle states.

Examples: order status (pending → confirmed → shipped → delivered), subscription (trial → active → past_due → cancelled), agent session (idle → running → waiting → complete → failed).

```
[IDLE] → [RUNNING] → [WAITING_FOR_HUMAN] → [COMPLETE]
   ↑                         ↓
   └──────── [FAILED] ←──────┘
```

Exported as both Mermaid `.mermaid` and XState JSON `.json` for downstream use.

### 3.8 Deployment Diagram
**Trigger**: Always if more than one deployment target.

Shows cloud infrastructure topology: which container goes to which provider, region, load balancer topology, database location relative to app servers.

### 3.9 API Map Diagram
**Trigger**: Always if more than 3 API endpoints.

Every route: method, path, auth requirement, request schema, response schema, DB table touched.

Auto-generates `diagrams/09-api-map.yaml` (OpenAPI spec) from this diagram. This is the file that feeds `context/architecture-context.md`'s API route map section.

### 3.10 Feature Dependency Graph (DAG)
**Trigger**: Always.

A directed acyclic graph where each node is a feature spec and each edge is a dependency. Foundrie topologically sorts this graph to produce the feature number sequence. The ordering is transparent to the human — they can see why Feature 05 comes before Feature 07.

### 3.11 Agent Architecture Diagram
**Trigger**: Conditional — only for agentic projects.

Shows the agent graph: LangGraph states, transitions, tools (capabilities), memory stores (ChromaDB, SQLite), human-in-the-loop gates.

### 3.12 Security Architecture Diagram
**Trigger**: Always.

Maps the seven-layer defense-in-depth model (v3.0.0 §1) to the actual project infrastructure. WAF → API gateway → authentication middleware → authorization → tool sandbox → data encryption at rest → infrastructure isolation.

---

## 4. DIAGRAM TECHNOLOGY STACK

| Diagram Type | Authoring (Canvas) | Export (ZIP) | Formats |
|---|---|---|---|
| System Context, Container | React Flow + C4 plugin | Mermaid `.md` + SVG | `.mermaid`, `.svg` |
| Component | React Flow custom nodes | Mermaid `.md` + SVG | `.mermaid`, `.svg` |
| Sequence | React Flow or Mermaid Live | Mermaid `.md` + SVG | `.mermaid`, `.svg` |
| ERD | React Flow custom node system | dbdiagram.io `.dbml` + PNG | `.dbml`, `.png` |
| DFD | React Flow | Mermaid `.md` + SVG | `.mermaid`, `.svg` |
| State Machine | React Flow + XState config export | XState JSON + Mermaid | `.json`, `.mermaid` |
| Deployment | React Flow | Mermaid `.md` + SVG | `.mermaid`, `.svg` |
| API Map | React Flow + table | OpenAPI `.yaml` (auto-generated) | `.yaml` |
| Feature DAG | React Flow DAG layout | Mermaid `.md` + SVG | `.mermaid`, `.svg` |
| Agent Architecture | React Flow (LangGraph-aware) | Mermaid `.md` + SVG | `.mermaid`, `.svg` |
| Security Architecture | React Flow | Mermaid `.md` + SVG | `.mermaid`, `.svg` |

**Rendering pipeline** (Foundrie Rust execution layer — v2.0.0):

```rust
// diagram_generator.rs — extends the Rust execution layer
pub struct DiagramPipeline {
    renderer: MermaidRenderer,
    storage: Arc<VercelBlobClient>,
}

impl DiagramPipeline {
    pub async fn render_all(&self, session: &FoundrieSession) -> Result<DiagramBundle> {
        let diagrams = vec![
            self.render_system_context(&session.context).await?,
            self.render_container_diagram(&session.containers).await?,
            self.render_erd(&session.schema).await?,
            self.render_api_map(&session.routes).await?,
            self.render_feature_dag(&session.features).await?,
        ];
        // Render to SVG for canvas review
        // Render to Mermaid .md for ZIP export
        let bundle = DiagramBundle::from(diagrams);
        self.storage.upload_all(&bundle).await?;
        Ok(bundle)
    }
}
```

---

## 5. DIAGRAM VERSIONING

When a diagram changes (due to architecture revision or requirement change):

```
diagrams/
├── v1/
│   ├── 01-system-context.svg    ← original approved version
│   └── 04-erd.dbml              ← original approved version
├── v2/
│   ├── 01-system-context.svg    ← revised after scope change
│   └── 04-erd.dbml              ← revised after subscription tier added
├── 01-system-context.svg        ← current version (symlink or latest)
└── 04-erd.dbml                  ← current version
```

The `context/progress-tracker.md` records which diagram version each feature spec was written from. This prevents implementing from a stale diagram.

```markdown
## Diagram Version Log
| Diagram | Version Used | Changed In |
|---|---|---|
| 04-erd.dbml | v2 | Change Request 01 (2026-05-24) |
| 01-system-context.svg | v2 | Change Request 01 |
| 02-container.svg | v1 | unchanged |
```

---

## 6. UPDATED ZIP FILE INVENTORY (diagrams/)

Addition to the ZIP structure from v1.0.0 §15.2:

```
[project-name]_foundrie_[YYYY-MM-DD]/
├── AGENTS.md
├── ARTKINS_STYLE_GUIDE.md
├── .env.example
│
├── diagrams/                               [NEW — all projects]
│   ├── 01-system-context.mermaid
│   ├── 01-system-context.svg
│   ├── 02-container.mermaid
│   ├── 02-container.svg
│   ├── 03-component-[service].mermaid      (one per container with > 3 components)
│   ├── 03-component-[service].svg
│   ├── 04-erd.dbml                         (if database present)
│   ├── 04-erd.png
│   ├── 05-sequence-[flow].mermaid          (one per core flow, min 3)
│   ├── 05-sequence-[flow].svg
│   ├── 06-data-flow.mermaid                (if user data/payments/AI signals)
│   ├── 06-data-flow.svg
│   ├── 07-state-machine.mermaid            (conditional)
│   ├── 07-state-machine.svg
│   ├── 07-state-machine.json               (XState config, conditional)
│   ├── 08-deployment.mermaid
│   ├── 08-deployment.svg
│   ├── 09-api-map.yaml                     (OpenAPI spec, if > 3 endpoints)
│   ├── 10-feature-dag.mermaid
│   ├── 10-feature-dag.svg
│   ├── 11-agent-architecture.mermaid       (conditional — agentic projects)
│   ├── 11-agent-architecture.svg
│   ├── 12-security-architecture.mermaid
│   └── 12-security-architecture.svg
│
├── context/
├── feature-specs/
├── research/
├── tools/                                  (v3.0.0 — agentic)
├── evals/                                  (v3.0.0 — agentic)
└── docs/
    └── adr/                                (v5.0.0)
```

---

## 7. UPDATED AGENTS.MD READING ORDER

The reading order from v1.0.0 §7.2 is updated. Steps 4–7 are new diagram reads:

```markdown
## Reading Order

Read these files completely before touching anything:

1.  AGENTS.md                              ← you are here
2.  ARTKINS_STYLE_GUIDE.md
3.  research/PROJECT_RESEARCH.md
4.  diagrams/01-system-context.svg         ← [NEW] understand the system at a glance
5.  diagrams/02-container.svg              ← [NEW] understand what to build and where
6.  diagrams/04-erd.dbml                   ← [NEW] understand the full data model
7.  diagrams/09-api-map.yaml               ← [NEW] understand all routes before coding any
8.  context/project-overview.md
9.  context/architecture-context.md
10. context/ui-context.md
11. context/code-standards.md
12. context/ai-workflow-rules.md
13. context/progress-tracker.md
14. feature-specs/*.md                     ← scan all, in numeric order, do not implement yet

Before implementing any feature that touches the API:
  Read diagrams/05-sequence-[flow].svg for that flow.
Before implementing the database schema:
  Cross-check against diagrams/04-erd.dbml.
Before implementing UI components:
  Cross-check against the component diagram.
```

---

## 8. UPDATED RUWA INVARIANT FOR DIAGRAMS

Added to `context/ai-workflow-rules.md` in every generated ZIP:

```markdown
## Diagram Compliance Invariant

RUWA never implements:
  - A database table not present in diagrams/04-erd.dbml
  - An API route not present in diagrams/09-api-map.yaml
  - A UI component not present in diagrams/03-component-*.svg
  - An agent node not present in diagrams/11-agent-architecture.svg

If a feature spec requires something not in the corresponding diagram:
  RUWA reports the discrepancy to the human before proceeding.
  RUWA does not invent schema, routes, or components.
  The diagram is the truth. The spec is an instruction derived from the diagram.
  If they conflict, the diagram wins — report the conflict.
```

---

## 9. NEW GENERATION INVARIANTS (36–44)

These are **additions** to invariants 1–35. All prior invariants remain in force.

36. No feature spec is written before all applicable diagrams have been generated and approved by the human. This gate is absolute — no exceptions.
37. Every ZIP includes a `diagrams/` directory. A ZIP without `diagrams/` is an invalid Foundrie output.
38. The Feature Dependency Graph is always generated and used to derive the feature spec ordering. Features are never ordered by conversation sequence alone.
39. RUWA reads all applicable diagrams in the updated reading order (Steps 4–7) before reading any context file.
40. RUWA never implements a DB table, API route, or component not present in the corresponding diagram. Discrepancies are reported, not resolved unilaterally.
41. Every diagram is versioned. The `progress-tracker.md` records which diagram version each feature spec was written from.
42. The System Context Diagram is always the first diagram generated. No other diagram is produced before the human approves the System Context.
43. The API Map Diagram auto-generates `diagrams/09-api-map.yaml` (OpenAPI spec). This file is the authoritative API contract in the ZIP.
44. The Security Architecture Diagram maps the seven-layer model (v3.0.0) to actual project infrastructure. It is always generated — never optional.

---

*Foundrie AI v6.0.0 — Diagram-first architecture: 8-phase discovery protocol, full 12-diagram suite, diagram-first gate, diagram versioning, updated ZIP structure, and updated RUWA reading order*
*See FOUNDRIE_V7_0_0.md for GitHub integration: GitHub App authentication, the reference repository pattern, existing project onboarding, and the six team topologies*
