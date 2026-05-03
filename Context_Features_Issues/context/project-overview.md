# Foundrie AI

## Overview

Foundrie AI is a pre-IDE architectural workspace for AI-assisted engineering. It helps engineers move from a raw product idea to a complete, machine-readable implementation package before writing code. The workspace combines Socratic discovery, architecture critique, collaborative diagramming, sequential UML/C4 generation, context-file generation, feature-spec generation, and ZIP export.

## Product Positioning

Foundrie AI is the upstream intelligence layer before an IDE or coding agent. It does not try to replace implementation tools such as Claude Code, Cursor, Windsurf, Copilot, or Codex. It prepares the package those tools need: requirements, architecture, diagrams, six context files, feature specs, and an agent entry point.

## Mental Model

Raw idea -> research intake -> discovery interview -> approved implementation plan -> requirements analysis -> architecture proposal -> sequential diagrams -> Artkins style guide -> six context files -> ordered feature specs -> ZIP download -> AI-assisted implementation.

## Goals

1. Turn vague ideas into structured functional and non-functional requirements.
2. Use a role-based AI firm model for planning, critique, writing, coding guidance, fast chat, and research synthesis.
3. Generate type-aware UML, C4, data, infrastructure, and system-design diagrams on a collaborative canvas.
4. Generate diagrams sequentially with visible progress and resilient error handling.
5. Produce a downloadable ZIP package named `{project-slug}_{YYYY-MM-DD_HH-mm-ss}.zip`.
6. Make the ZIP package immediately consumable by AI coding agents through `AGENTS.md`, `.agents/skills/`, `context/`, `feature-specs/`, `diagrams/`, `requirements/`, and `research/`.

## Primary Users

- Solo builders who want to avoid vague prompting and produce a disciplined implementation plan.
- Senior engineers who want an architecture review and documentation package before coding.
- Teams adopting AI coding agents who need consistent context files and feature specs.
- Technical founders who need to translate product intent into implementation-ready engineering artifacts.

## Core User Flow

1. User signs in.
2. User creates a project from a raw idea.
3. Foundrie starts a Socratic discovery interview and asks one question at a time.
4. User answers discovery questions until the system has enough requirements context.
5. AI generates a structured requirements analysis with functional requirements, non-functional requirements, hidden requirements, and scale estimates.
6. AI proposes an architecture and records trade-offs.
7. User reviews architecture on a collaborative React Flow canvas.
8. AI plans which diagrams are needed for the project.
9. Foundrie generates diagrams sequentially by category: structural, behavioral, architectural, data, and infrastructure.
10. Each completed diagram is rendered, captured as PNG, stored, and added to the export package.
11. AI generates six context files and ordered feature specs.
12. User reviews the generated docs.
13. User downloads a ZIP package ready for coding agents.

## Core Features

### Discovery and Requirements

- Streaming AI discovery interview.
- One-question-at-a-time Socratic flow.
- Requirements extraction and critique.
- Functional, non-functional, hidden, security, scalability, and cost analysis.
- Architecture decision record generation.

### Multi-Model AI Firm

- Principal Engineer: Gemini 2.5 Pro for orchestration and planning.
- Staff Reviewer: DeepSeek R1 for critique and trade-off analysis.
- Tech Writer: DeepSeek V3 for structured documents.
- Senior SWE: Qwen Coder for code-oriented implementation specs.
- Fast Chat: Groq-hosted Llama/Qwen for low-latency conversation.
- Research Team: Gemini Flash and Kimi K2 for comparison and synthesis.

### Robust Model Rotation

- Every AI generation uses task-based routing.
- Every primary model has a fallback chain.
- Provider availability is checked before calls.
- Attempts are logged with provider, model, success, error message, and duration.
- Users should receive useful product states instead of raw provider errors.

### Diagram Workspace

- Liveblocks-backed collaborative React Flow canvas.
- Diagram category sidebar.
- Type-aware UML and C4 shape libraries.
- Custom nodes for class, interface, lifeline, actor, entity, C4 person, C4 container, service, gateway, database, cache, and more.
- Custom edges for association, aggregation, composition, inheritance, dependency, synchronous messages, asynchronous messages, return messages, crow's-foot relationships, and C4 relationships.

### Sequential Generation

- AI plans an ordered diagram job list from project context.
- Jobs run one at a time.
- Each job moves through `queued`, `generating`, `rendering`, `capturing`, `done`, or `error`.
- Failed jobs produce error placeholders and do not stop the batch.
- Completed diagrams are grouped into export folders by category.

### Export Package

- Root `AGENTS.md`.
- Root `ARTKINS_STYLE_GUIDE.md`.
- Six context files.
- Auto-numbered feature specs.
- Diagram PNGs organized by category.
- Requirements documents.
- ZIP generation through Trigger.dev and JSZip.
- ZIP storage in Vercel Blob with database metadata.
- Research workspace for uploaded screenshots, image assets, frame ZIPs, extracted frames, research documents, pasted notes, scraped links, Context7 findings, and synthesized project research.

## Scope

### In Scope

- Clerk authentication and user sync.
- Project CRUD and project phases.
- Neon Postgres metadata through Prisma.
- Vercel Blob artifact storage.
- Multi-provider AI rotation engine.
- Discovery, requirements, architecture, diagram, context, feature-spec, and ZIP generation.
- Liveblocks collaborative canvas and presence.
- React Flow custom nodes and custom edges.
- Sequential diagram generation and PNG capture.
- Downloadable ZIP package.
- Approval-gated plans before implementation-impacting generation or coding work.
- Context7 skills and documentation lookup rules.
- Tavily and Obscura research connectors when configured.
- Exported research folder with `PROJECT_RESEARCH.md` and supporting assets.

### Out of Scope

- Billing and paid plan enforcement for the first implementation pass.
- Native mobile applications.
- Full human review workflow with approvals and comments.
- Enterprise organization permissions beyond single-user ownership.
- Team workspaces, project-level owner/editor/viewer RBAC, custom admin portals, PostgreSQL RLS, ABAC, audit logs, and hardware-key admin controls unless later requirements explicitly demand them.
- Direct code generation into a repository.
- Running generated application builds inside Foundrie.

## Success Criteria

1. A signed-in user can create a project and complete the discovery flow.
2. The system generates a requirements analysis from conversation history.
3. The system proposes architecture and plans the diagram set.
4. Diagrams are generated sequentially, rendered, captured as PNG, and stored.
5. Context files and feature specs are generated for the user's project.
6. The ZIP export matches the required folder structure exactly.
7. The exported package can be opened by a coding agent using `AGENTS.md` as the entry point.
