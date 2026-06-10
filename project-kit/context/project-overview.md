# Foundrie AI

## Contract Synchronization Gate

Any implementation change that corrects or changes a contract must be reflected in the same branch across the affected feature spec, dependent future specs, relevant context files, root AGENTS.md, and progress-tracker.md. Contracts include Prisma fields and relations, route signatures, auth helper signatures, AI task names and callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, and file ownership. A feature is not ready for review while later specs or context still describe stale fields, old API shapes, or invalid contracts.


## Overview

Foundrie AI is a pre-IDE architectural workspace for AI-assisted engineering. It helps engineers move from a raw product idea to a complete, machine-readable implementation package before writing code. The workspace combines Socratic discovery, architecture critique, collaborative diagramming, a diagram-first generation gate, sequential UML/C4/data/infrastructure generation, context-file generation, feature-spec generation, and ZIP export.

Foundrie holds the conversation, designs the architecture visually, and produces a ZIP that a downstream coding agent (RUWA) can build from with zero ambiguity. The division of responsibility is absolute: **Foundrie owns what and why; RUWA owns how and when; the human owns approval and judgment.**

## Product Positioning

Foundrie AI is the upstream intelligence layer before an IDE or coding agent. It does not replace implementation tools such as RUWA, Claude Code, Cursor, Windsurf, Copilot, or Codex. It prepares the package those tools need: requirements, architecture, the full diagram suite, six context files, ordered feature specs, project-management documents, and an agent entry point.

Every file Foundrie writes is an instruction. The quality of the downstream build is a direct function of the quality of Foundrie's output. Vagueness becomes wrong code; ambiguity becomes confusion; omission becomes missed features.

## Mental Model

Raw idea -> research intake -> Socratic discovery interview -> approved implementation plan -> requirements analysis -> architecture proposal -> **all diagrams generated and approved (diagram-first gate)** -> feature specs written from diagrams -> Artkins style guide -> six context files -> ordered feature specs -> ZIP download -> AI-assisted implementation.

## The 8-Phase Discovery Protocol

1. **Problem & Users** — what problem, who uses it, what they do today, what success looks like in six months.
2. **Core Flows** — the happy path, supporting workflows, CRUD surface, external services.
3. **Scope & Constraints** — explicit out-of-scope, prior failures, timeline, team capability, design references.
4. **Technical Direction** — Foundrie proposes a stack from the language decision matrix, records the decision in an ADR, and chooses deployment strategy and logging destination.
5. **Feature Sequence** — preliminary build sequence, revised after diagrams.
6. **Architecture Diagramming (the diagram-first gate)** — System Context first, then Container, then all remaining applicable diagrams; each reviewed and approved on the canvas before specs are written.
7. **Feature Spec Generation** — the Feature Dependency Graph is topologically sorted into numbered specs, with file ownership, hidden requirements, and proactive architecture warnings.
8. **ZIP Assembly** — diagrams, context files, feature specs, research, project-management docs, and docs are bundled into the named ZIP.

The diagram-first gate is a hard stop: no feature spec file is created and no ZIP is assembled until every applicable diagram is generated, reviewed, and explicitly approved.

## Goals

1. Turn vague ideas into structured functional and non-functional requirements through a three-level Socratic model.
2. Use a role-based AI firm model for planning, critique, writing, coding guidance, fast chat, and research synthesis, all behind a multi-model rotation engine.
3. Generate type-aware UML, C4, data, infrastructure, and system-design diagrams on a collaborative canvas, before any spec is written.
4. Generate diagrams sequentially with visible progress, versioning, and resilient error handling.
5. Surface hidden requirements and proactive architecture warnings before specs are approved.
6. Produce a downloadable ZIP named `{project-slug}_{YYYY-MM-DD_HH-mm-ss}.zip`.
7. Make the ZIP immediately consumable by AI coding agents through `AGENTS.md`, `.agents/skills/`, `context/`, `feature-specs/`, `diagrams/`, `requirements/`, `project-management/`, `docs/`, and `research/`.

## Primary Users

- Solo builders who want to avoid vague prompting and produce a disciplined implementation plan.
- Senior engineers who want an architecture review and documentation package before coding.
- Teams adopting AI coding agents who need consistent context files, diagrams, and feature specs.
- Technical founders who need to translate product intent into implementation-ready engineering artifacts.
- Collaborators invited by a project owner to co-edit diagrams and architecture on a shared canvas.

## Core User Flow

1. User signs in (Clerk; GitHub App for repo-connected sessions).
2. User creates a project from a raw idea. Foundrie classifies the description as Level 1 (vague), 2 (partially specified), or 3 (over-specified) and responds accordingly.
3. Foundrie runs the Socratic discovery interview, one question at a time, surfacing hidden requirements.
4. AI generates a structured requirements analysis (functional, non-functional, hidden, scale, security).
5. AI proposes an architecture and records trade-offs in ADRs.
6. Foundrie generates the full diagram suite sequentially on the collaborative React Flow canvas, starting with the System Context Diagram.
7. The user reviews and approves each diagram. The diagram-first gate holds until approval.
8. AI generates the Feature Dependency Graph, six context files, and ordered feature specs from the approved diagrams.
9. The user reviews the generated docs.
10. The user downloads a ZIP package ready for coding agents.

## Core Features

### Discovery and Requirements

- Streaming AI discovery interview, one-question-at-a-time Socratic flow.
- Three-level project classification.
- Requirements extraction and critique: functional, non-functional, hidden, security, scalability, cost.
- Hidden-requirements catalog check (200+ entries) and proactive architecture warnings.
- Architecture decision record generation.

### Multi-Model AI Firm

- Principal Engineer: Gemini 2.5 Pro (orchestration, planning, architecture).
- Staff Reviewer: DeepSeek R1 (critique, trade-offs, hidden risks).
- Tech Writer: DeepSeek V3 (context files, feature specs, RFCs).
- Senior SWE: Qwen Coder (code-oriented implementation specs).
- Fast Chat: Groq-hosted Llama/Qwen (low-latency conversation).
- Research Team: Gemini Flash and Kimi K2 (comparison, synthesis).

### Robust Model Rotation

- Task-based routing with a fallback chain (Claude Sonnet 4 → Gemini Pro → DeepSeek R1 → Kimi K2 → Qwen Coder).
- Rust key rotation engine across 50+ keys and 6 providers.
- Tier-based primary model selection (DeepSeek R1 free, Claude Sonnet 4 paid).
- NATS JetStream queuing with a transparent queue-position indicator instead of raw provider errors.
- Every attempt logged with provider, model, success, error, and duration.

### Diagram Workspace

- Liveblocks-backed collaborative React Flow canvas with presence and live cursors.
- The full 12-diagram suite: System Context, Container, Component, ERD, Sequence, DFD, State Machine, Deployment, API Map, Feature DAG, Agent Architecture, Security Architecture.
- Type-aware UML and C4 shape libraries; custom nodes and edges.
- Diagram versioning, with prior approved versions preserved.

### Sequential Generation

- AI plans an ordered diagram job list. Jobs run one at a time through `queued` → `generating` → `rendering` → `capturing` → `done`/`error`.
- A failed job produces an error placeholder and does not stop the batch.
- Each diagram generation is a LangGraph checkpoint, so power loss resumes from the last completed diagram.

### Export Package

- Root `AGENTS.md` and root `ARTKINS_STYLE_GUIDE.md`.
- Six context files, auto-numbered feature specs, the diagram suite, requirements documents, project-management documents, and docs (production checklist, quality gate, logging, security, privacy).
- Rust streaming ZIP generation through Trigger.dev, stored in Vercel Blob with database metadata.
- Research workspace for uploaded assets, frame ZIPs, extracted frames, documents, links, Context7 findings, and synthesized research.

### Collaboration, Recovery, and Quality

- Multi-user canvas with the AI input queue state machine and session roles.
- LangGraph PostgresSaver autosave and power-loss recovery; diagram, spec, and conversation-branch rollback.
- Client and server idempotency on all session actions.
- Three-category quality gate before any deliverable; seven-section handoff at project close.

## Scope

### In Scope

- Clerk authentication and user sync; GitHub App integration for repo-connected sessions.
- Project CRUD and the 8-phase project lifecycle.
- Project sharing: Owner invites Collaborators by email; Collaborators edit canvas, use AI, and download the ZIP.
- 2-role authorization (Owner and Collaborator) enforced at the application layer.
- Neon Postgres metadata through Prisma; Vercel Blob artifact storage; isolated MongoDB Atlas training data.
- Multi-provider AI rotation engine with the Rust key engine and NATS queuing.
- Discovery, requirements, architecture, the full diagram suite, context, feature-spec, and ZIP generation.
- Liveblocks collaborative canvas and presence; React Flow custom nodes and edges; sequential diagram generation and PNG capture.
- Downloadable ZIP package with the full product-contract structure.
- Approval-gated plans before implementation-impacting generation or coding work.
- Context7 skills and documentation lookup; Tavily, Obscura, and Firecrawl research connectors when configured.
- Exported research folder with `PROJECT_RESEARCH.md` and supporting assets.

### Out of Scope (v1)

- Full billing enforcement beyond the documented plan/Stripe model for the first implementation pass.
- Native mobile applications.
- Full human review workflow with approvals and comments beyond the diagram approval gate.
- Enterprise organization hierarchy beyond Owner/Collaborator.
- PostgreSQL RLS, ABAC, audit logs, hardware-key admin controls, or complex role hierarchies.
- Direct code generation into a repository or running generated application builds inside Foundrie.
- Invite-by-link (v1 uses email-based invites for existing Clerk users only).
- Ownership transfer between users.

## Success Criteria

1. A signed-in user can create a project and complete the 8-phase discovery flow.
2. The system generates a requirements analysis from conversation history and surfaces hidden requirements.
3. The system proposes architecture, generates the full diagram suite, and holds the diagram-first gate until approval.
4. Diagrams are generated sequentially, rendered, captured as PNG, versioned, and stored.
5. The Feature Dependency Graph, six context files, and ordered feature specs are generated from approved diagrams.
6. The ZIP export matches the required folder structure exactly.
7. The exported package can be opened by a coding agent using `AGENTS.md` as the entry point, with diagrams read before context files.
