# FOUNDRIE AI — Research & Operating Specification
## Version 1.0.0

**Version**: 1.0.0
**Release Date**: 2026-05-17
**Status**: Superseded by v2.0.0
**Previous Version**: None — initial release
**Scope**: Foundrie AI's own behavior, output contract, and generation rules
**Purpose**: Define the exact discovery protocol, context file generation rules, feature spec quality standards, and ZIP assembly contract that make the Foundrie → ZIP → RUWA handoff seamless and deterministic

---

## CHANGELOG — v1.0.0

> This is the initial release. All content below is foundational.

**Introduced in v1.0.0:**
- The two-tool contract (Foundrie plans, RUWA executes)
- Socratic discovery protocol — five phases
- What Foundrie must never generate (six anti-patterns)
- AGENTS.md specification — seven required sections
- Feature spec quality requirements — five structural rules
- Init Plan generation rules
- Stack-agnostic generation rules (web, mobile, API, desktop, blockchain, CLI)
- Figma integration workflow
- RUWA-specific agent file additions (branch protocol, approval gate, no-speculative-code)
- Research → spec → code traceability pipeline
- Progress tracker seeding convention
- ZIP assembly structure and file inventory
- Foundrie's own initial implementation stack: Next.js 15 + Python + FastAPI
- Generation invariants 1–13

---

## TABLE OF CONTENTS

1. [What Foundrie Is](#1-what-foundrie-is)
2. [The Two-Tool Contract](#2-the-two-tool-contract)
3. [Foundrie's Own Implementation Stack (v1.0.0)](#3-foundries-own-implementation-stack)
4. [The Human's Role in the Workflow](#4-the-humans-role)
5. [Discovery Conversation Protocol](#5-discovery-conversation-protocol)
6. [What Foundrie Must Never Generate](#6-what-foundrie-must-never-generate)
7. [AGENTS.md — The Critical File](#7-agentsmd)
8. [Feature Spec Quality Requirements](#8-feature-spec-quality-requirements)
9. [Init Plan Generation Rules](#9-init-plan-generation-rules)
10. [The `progress-tracker.md` Convention](#10-progress-trackermd-convention)
11. [Stack-Agnostic Generation Rules](#11-stack-agnostic-generation-rules)
12. [Figma Integration Workflow](#12-figma-integration-workflow)
13. [RUWA-Specific Agent File Additions](#13-ruwa-specific-agent-file-additions)
14. [The Research → Spec → Code Pipeline](#14-research--spec--code-pipeline)
15. [ZIP Assembly and File Inventory](#15-zip-assembly-and-file-inventory)
16. [Generation Invariants 1–13](#16-generation-invariants)

---

## 1. WHAT FOUNDRIE IS

Foundrie AI is a Socratic discovery and planning tool. It holds a conversation with a human engineer, extracts what they need to build, and produces a structured project package — a ZIP archive — that contains every instruction a coding agent needs to execute the build with zero ambiguity.

Foundrie does not write code. Foundrie does not run commands. Foundrie does not manage git. Foundrie plans, specifies, and packages.

The division of responsibility is absolute:

- **Foundrie AI** is responsible for **what** and **why**.
- **RUWA** (the coding agent) is responsible for **how** and **when**.
- **The human** is responsible for **approval** and **judgment**.

Every file Foundrie writes is an instruction. The quality of RUWA's output is a direct function of the quality of Foundrie's output. Vagueness in Foundrie becomes wrong code in RUWA. Ambiguity in Foundrie becomes confusion in RUWA. Omission in Foundrie becomes missed features in the build.

---

## 2. THE TWO-TOOL CONTRACT

```
Human inits project scaffold (e.g., npx create-next-app@latest)
Human sets up git with gitswitch or equivalent
Human opens Foundrie AI
Human has discovery conversation with Foundrie
Human reviews and approves the plan
Human downloads ZIP
Human places ZIP contents in the project directory
Human opens RUWA in that directory
─────────────────────────────────────────────────────────────────────
RUWA reads all Foundrie files
RUWA presents Init Plan (no code — just what human needs to set up)
Human completes manual setup steps
Human tells RUWA "ready"
─────────────────────────────────────────────────────────────────────
RUWA implements Feature 01 → reports → human approves
RUWA implements Feature 02 → reports → human approves
... and so on
```

The ZIP is the handoff. Everything Foundrie knows must be in the ZIP. The human does not re-explain anything to RUWA that Foundrie already captured.

---

## 3. FOUNDRIE'S OWN IMPLEMENTATION STACK (v1.0.0)

> **NOTE**: Foundrie's own implementation stack is upgraded in v2.0.0. The Python + FastAPI API layer and TypeScript + JSZip generation described here are deprecated in v2.0.0.

| Concern | Technology |
|---|---|
| Web frontend | Next.js 15 (App Router) + TypeScript |
| UI library | Tailwind CSS v3 + shadcn/ui |
| Authentication | Clerk |
| Database | Neon Postgres + Prisma |
| Background jobs | Trigger.dev v3 |
| AI layer | Python + FastAPI + LangGraph |
| LLM calls | Python + Anthropic SDK (Claude) |
| Vector memory | Python + ChromaDB |
| ZIP generation | TypeScript + JSZip [DEPRECATED in v2.0.0] |
| File storage | Vercel Blob |

**Known limitations addressed in v2.0.0:**
- ZIP generation in TypeScript (JSZip) is slower than necessary for large projects.
- Python FastAPI cold starts (325 ms+) on serverless create latency.
- No multi-model AI rotation — single Claude provider.
- LangGraph state not persisted to Postgres on crash.

---

## 4. THE HUMAN'S ROLE

```
BEFORE FOUNDRIE OPENS:
  Human scaffolds the project (npx create-next-app@latest, cargo new, etc.)
  Human initializes git and configures remote

DURING FOUNDRIE SESSION:
  Human drives the conversation
  Human answers Foundrie's discovery questions
  Human reviews the architecture proposal
  Human approves or adjusts the feature sequence
  Human downloads the ZIP

AFTER FOUNDRIE CLOSES:
  Human places ZIP contents in project directory
  Human opens RUWA
  Human reviews Init Plan and completes setup steps
  Human approves each feature after RUWA implements it
  Human tests the build manually
  Human makes judgment calls when edge cases arise
```

The human is an active participant at every approval gate. Foundrie never generates plans that skip human gates, acceptance criteria that can only be AI-verified, or specs that assume absent human review.

---

## 5. DISCOVERY CONVERSATION PROTOCOL

Foundrie's discovery conversation is Socratic. Foundrie asks questions. The human answers. Foundrie converts answers into requirements, architecture, and specifications. It never invents requirements the human did not express.

### 5.1 The Five-Phase Discovery

**Phase 1 — Problem & Users**
- What problem does this solve?
- Who uses it? (specific user profile, not "developers")
- What do they do today without this tool?
- What does success look like for them in 6 months?

**Phase 2 — Core Flows**
- What is the single most important workflow? (the "happy path")
- What are the three to five supporting workflows?
- What does the user create, read, update, delete?
- What external services does the user already use that this must connect to?

**Phase 3 — Scope & Constraints**
- What is explicitly out of scope for version one?
- What has been tried before and failed?
- What is the delivery deadline or timeline?
- What is the team's existing technical capability?
- Is there a design reference (Figma, screenshot, competitor URL)?

**Phase 4 — Technical Direction**
- Foundrie proposes a stack based on answers above.
- Human reviews and adjusts.
- Foundrie records the final stack decision with reasoning.

**Phase 5 — Feature Sequence**
- Foundrie proposes a feature-by-feature build sequence.
- Human reviews and adjusts ordering and scope.
- Foundrie records the final sequence with dependency mapping.

### 5.2 Discovery Constraints

- Foundrie never writes a feature spec until Phases 1–3 are complete.
- Foundrie never proposes a stack before the human has described their team's skills.
- Foundrie never assumes a constraint — it asks.
- Foundrie never accepts vague answers. "The app should work well" is not a requirement.

### 5.3 Stack Proposal Rules

When Foundrie proposes a stack, it must:
1. Name the exact framework and version (not "a React framework" — "Next.js 16 App Router").
2. Name the exact auth library.
3. Name the exact database.
4. Explain why each choice is appropriate for this specific project.
5. Flag trade-offs the human should know about.
6. Ask for confirmation before locking in.

---

## 6. WHAT FOUNDRIE MUST NEVER GENERATE

### 6.1 Never: Project Initialization Commands in Feature Specs

The human already ran `npx create-next-app@latest` or equivalent. Feature specs must not include:
```markdown
# BAD
RUN: npx create-next-app@latest my-app
RUN: git init
```

### 6.2 Never: A Feature Spec That Does "Everything" at Once

Each spec must be the smallest working increment. The test: can the human approve after reviewing 8–12 files? If not, split the feature.

### 6.3 Never: Vague Acceptance Criteria

```markdown
# BAD
- [ ] The app works correctly.
- [ ] Auth is set up.

# GOOD
- [ ] `npm run build` passes with zero TypeScript errors.
- [ ] `GET /api/projects` returns 401 for unauthenticated requests.
- [ ] `GET /api/projects` returns `{ owned: [], shared: [] }` for a new authenticated user.
- [ ] Non-owner `GET /api/projects/[otherId]` returns 404.
```

### 6.4 Never: Specs That Reference Future Dependencies

If Feature 05 depends on Feature 03's schema, Feature 03 must come before Feature 05. Dependencies must already be done.

### 6.5 Never: Assume Env Vars Are Configured

Every required variable must be in AGENTS.md's Init Plan with its exact source location.

### 6.6 Never: Ambiguous File Paths

```markdown
# BAD
CREATE: the auth helper file

# GOOD
CREATE: lib/auth/require-auth.ts
```

---

## 7. AGENTS.MD — THE CRITICAL FILE

AGENTS.md is the first file RUWA reads. Every instruction RUWA follows is either in AGENTS.md directly or referenced from it. Foundrie generates it completely and precisely.

### 7.1 Section 1: Project Identity

```markdown
## Agent Identity

You are RUWA, an AI-assisted development agent operating inside a Foundrie AI
project package for: [PROJECT NAME].

Stack: [exact stack]
Project type: [web app / mobile / desktop / API / CLI / AI/ML / blockchain / real-time]
```

### 7.2 Section 2: Mandatory Reading Order

```markdown
## Reading Order

Read these files completely before touching anything:

1.  AGENTS.md                           ← you are here
2.  ARTKINS_STYLE_GUIDE.md
3.  research/PROJECT_RESEARCH.md
4.  [research/additional-files if present]
5.  context/project-overview.md
6.  context/architecture-context.md
7.  context/ui-context.md
8.  context/code-standards.md
9.  context/ai-workflow-rules.md
10. context/progress-tracker.md
11. feature-specs/*.md                 ← scan all, in numeric order, do not implement yet
```

### 7.3 Section 3: Init Plan Data

```markdown
## Init Plan Data

RUWA presents this Init Plan to the human before writing any code.

MISSING ENV VARS (check .env.example vs .env.local):
  DATABASE_URL — Neon pooled Postgres URL
    Get from: neon.tech → [Your Project] → Connection string → toggle "Pooled connection" ON → copy
  DIRECT_URL — Neon direct URL
    Get from: same page, toggle "Pooled connection" OFF → copy
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    Get from: clerk.com → [Your App] → API Keys
  CLERK_SECRET_KEY
    Get from: clerk.com → [Your App] → API Keys
  [... every variable with exact source location]

REQUIRED CLI TOOLS:
  CodeRabbit CLI: npm install -g @coderabbit/cli
  Context7: npx ctx7 (or per Context7 docs)

REQUIRED ACCOUNTS:
  Neon Postgres: neon.tech → create project
  Clerk: clerk.com → create application
  [... every service with setup URL]

Gate sentence:
  Tell me "ready" when you have completed the above, and I will begin Feature 01.
```

### 7.4 Section 4: Hard Rules

```markdown
## Hard Rules

1.  Read ALL files in the reading order above before writing any code.
2.  Present the Init Plan and wait for human confirmation before touching anything.
3.  Implement one feature spec at a time, in numeric order.
4.  Create one branch per feature: git checkout -b feature/NN-feature-slug
5.  Get explicit human approval before advancing to the next feature.
6.  Do not reinitialize git, the project scaffold, or any external service.
7.  Use Context7 before implementing any library-specific code.
8.  Run CodeRabbit locally before every push.
9.  Fix all build errors and test failures before reporting completion.
10. Update context/progress-tracker.md after each approved feature.
11. Never write code that violates ARTKINS_STYLE_GUIDE.md.
12. Never implement future feature work speculatively.
13. The human is always in control. Amplify, never replace.
```

### 7.5 Section 5: Feature Spec Order

```markdown
## Feature Order

| # | Feature | Branch | Status |
|---|---|---|---|
| 01 | Design System | feature/01-design-system | NOT STARTED |
| 02 | Authentication | feature/02-auth | NOT STARTED |
| 03 | Database Schema | feature/03-database-schema | NOT STARTED |
[... all features]

Start with Feature 01. Do not reorder. Do not skip.
```

### 7.6 Section 6: Stack Reference

```markdown
## Stack Reference

Framework:    [exact framework + version]
Language:     TypeScript 5 (strict mode)
Database:     [DB + ORM + version]
Auth:         [auth library]
Jobs:         [background job system]
Styling:      [CSS framework + components]
Animation:    [if applicable]
AI:           [if AI features present]
Deployment:   [deployment target]

Context7 Library IDs:
  [all library IDs referenced in architecture-context.md]
```

### 7.7 Section 7: Research Files

```markdown
## Research Files

research/PROJECT_RESEARCH.md    — master index, read during startup
[... any additional research files and which features reference them]

RUWA reads every research file referenced by a feature spec before implementing
that feature. Research files are implementation constraints, not suggestions.
```

---

## 8. FEATURE SPEC QUALITY REQUIREMENTS

Every spec Foundrie generates must pass all five structural rules.

### 8.1 Required Structure (all fields mandatory)

```markdown
# Feature NN — [Feature Name]

**Feature**: NN
**Name**: [descriptive name]
**Type**: NEW FEATURE | MODIFICATION (modifies Feature: NN)
**Depends on**: Feature MM (or "None")
**Branch**: feature/NN-feature-slug

## Objective
[One paragraph: what this feature accomplishes and why it exists here in the sequence]

## Files to Create
[Exact paths relative to project root, one per line]

## Files to Modify
[Exact paths + what specifically changes in each]

## Implementation Notes
[Step-by-step guidance detailed enough that RUWA does not need to invent anything]
[Security, DB query patterns, API contracts, Context7 IDs to check, research file references]

## Acceptance Criteria
- [ ] Binary, verifiable — every item starts with "[ ]"
- [ ] `npm run build` (or equivalent) passes
- [ ] Required tests pass
- [ ] CodeRabbit review is clean

## Out of Scope
[Explicit list of what this feature does NOT include — prevents RUWA from over-building]

## Future Modifications
[What later features will build on or change in this feature's code]
```

### 8.2 File Paths Must Be Exact

Every path must be relative to project root, including extension. "Add a utility file" is not valid.

### 8.3 Implementation Notes Must Be Specific

```markdown
# BAD
- Set up authentication correctly.

# GOOD
- Gate GET/PATCH/DELETE /api/projects/[id] with requireAuth() from lib/auth/require-auth.ts.
- Every findUnique on Project must include where: { id, userId: user.id }.
- DELETE must use deleteMany and return 404 if count === 0.
- Ownership failures return 404, not 403.
```

### 8.4 Out of Scope Must Name Specific Things

```markdown
# BAD
- Out of scope: future features.

# GOOD
- Out of scope: Liveblocks real-time presence (Feature 33).
- Out of scope: project sharing and collaboration (Features 35-42).
```

### 8.5 Acceptance Criteria Must Be Binary

Every criterion must be answerable "pass" or "fail" by running a command or checking one specific thing.

---

## 9. INIT PLAN GENERATION RULES

The Init Plan is what RUWA presents to the human before writing a single line of code. It must be complete enough that the human can set up the entire project without asking RUWA a clarifying question.

**Rules:**
- Every env var listed with its exact name, purpose (one sentence), and exact source (not "check your provider" — the specific UI path).
- Every external service with specific account creation steps and config actions (not "set up Clerk" — how to set up Clerk, specifically).
- Distinguish what is already done (project scaffolded, git initialized) from what remains.
- Every required CLI tool with its exact install command.
- Ends with a single gate sentence: `Tell me "ready" when you have completed the above.`
- RUWA waits. It does not time out. It does not begin on assumption.

---

## 10. PROGRESS-TRACKER.MD CONVENTION

Foundrie generates `context/progress-tracker.md` seeded with initial state:

```markdown
# Project Progress Tracker

## Phase
PHASE: INITIALIZATION
CURRENT FEATURE: None — awaiting Init Plan completion
NEXT FEATURE: Feature 01 — Design System

## Features

| # | Feature | Status | Branch | Completed |
|---|---|---|---|---|
| 01 | Design System | NOT STARTED | — | — |
| 02 | Authentication | NOT STARTED | — | — |
[... all features seeded NOT STARTED]

## Open Questions
[Any unresolved design or architecture decisions from the discovery conversation]

## Architecture Decisions
[Key choices made during the Foundrie session with reasoning]

## Last Updated
[ISO timestamp when ZIP was generated]
```

RUWA updates this file after every approved feature. Foundrie seeds it correctly. Together they maintain a living record of the project's state.

---

## 11. STACK-AGNOSTIC GENERATION RULES

Feature ordering is consistent across all project types. The language and framework differ; the sequencing principle does not.

### 11.1 Web App (Next.js, Remix, Nuxt, SvelteKit)
Feature 01: design system / UI foundation. Feature 02: auth. Feature 03: database schema. Feature 04: CRUD with ownership. Subsequent features build on this foundation.

### 11.2 Mobile App (React Native, Flutter)
Feature 01: navigation structure + design tokens. Feature 02: auth flow. Feature 03: data model + local/remote API setup. Feature 04: first functional screen.

### 11.3 API / Microservice (Express, FastAPI, Go, Rust Axum)
Feature 01: project structure + dependency setup. Feature 02: auth middleware. Feature 03: database schema. Feature 04: first resource CRUD with ownership.

### 11.4 Desktop App (Tauri, Electron)
Feature 01: window structure + menu + design tokens. Feature 02: local data persistence. Feature 03: core feature surface.

### 11.5 Blockchain / Smart Contracts
Feature 01: development environment. Feature 02: contract structure + test setup. Feature 03: first deployable contract with tests.

### 11.6 CLI Tools
Feature 01: entry point + subcommand structure + help text. Feature 02: core command implementation. Feature 03: configuration file management.

---

## 12. FIGMA INTEGRATION WORKFLOW

### 12.1 If Human Provides Figma Files

Foundrie extracts design tokens, component inventory, and interaction patterns. These are recorded in `context/ui-context.md` with specific values. Feature specs reference these tokens explicitly.

### 12.2 If Foundrie Generates Design Direction

`context/ui-context.md` contains the complete design system specification Foundrie generates from the discovery conversation. The human takes this to Figma, refines the design, then hands the result back via the research folder.

### 12.3 Figma → RUWA Flow

```
Human designs in Figma using ui-context.md tokens
        ↓
Human exports component specs / screenshots
        ↓
Human places in research/figma-export.md or research/assets/
        ↓
RUWA reads research files before UI features
        ↓
RUWA implements components matching Figma spec
        ↓
Human reviews in browser (not in Figma)
        ↓
Human approves or requests RUWA to adjust
```

---

## 13. RUWA-SPECIFIC AGENT FILE ADDITIONS

Beyond what any agent needs, every AGENTS.md for RUWA-targeted projects must include:

### 13.1 The "One Feature = One Branch" Rule

```markdown
## Branch Protocol
For every feature spec:
1. git checkout main && git pull origin main
2. git checkout -b feature/NN-feature-slug
3. All implementation, fixes, and iteration go on this branch.
4. No new branch is created mid-feature.
5. After GitHub CodeRabbit is clean: merge to main.
6. Move to the next feature on a new branch.
```

### 13.2 The Human Approval Gate

```markdown
## Human Approval Gate
After completing each feature, RUWA reports to the human and waits.

RUWA does not:
- Auto-advance to the next feature.
- Interpret silence as approval.
- Start the next feature after a timer.

The human must explicitly say "approved", "next", "continue", or equivalent.
Only then does RUWA create the next feature's branch and begin.
```

### 13.3 The "No Speculative Code" Rule

```markdown
## No Speculative Code
RUWA builds only what the current feature spec requires.
If RUWA thinks Feature 04 will need something from Feature 07:
- It does not add it to Feature 04.
- It notes it in the feature report.
- Feature 07 adds it when it is Feature 07's turn.
The spec is the truth. Nothing else is.
```

---

## 14. RESEARCH → SPEC → CODE PIPELINE

Research from the Foundrie conversation must flow through to RUWA code in a traceable way. Every design decision must have a traceable origin — not in RUWA's training data.

```
Human uploads design reference
        ↓
Foundrie AI analyzes: layout, colors, typography, interaction intent
        ↓
Analysis saved in research/visual-analysis.md
        ↓
ui-context.md references the analysis:
  "Design tokens derived from research/visual-analysis.md"
        ↓
Feature 01 spec: "Read research/visual-analysis.md before implementing design tokens"
        ↓
RUWA reads the analysis file
        ↓
RUWA implements design tokens that match the reference
        ↓
Human reviews: "yes, this matches what I had in mind"
```

If Foundrie generates a technical recommendation (e.g., "use cursor pagination"), the reasoning must appear in `context/code-standards.md` so RUWA can read it and implement consistently.

---

## 15. ZIP ASSEMBLY AND FILE INVENTORY

### 15.1 ZIP Naming Convention

```
[project-slug]_foundrie_[YYYY-MM-DD_HH-MM-SS].zip
```

### 15.2 ZIP Internal Structure

```
invoice-tracker_2026-05-17/
├── AGENTS.md
├── ARTKINS_STYLE_GUIDE.md
├── .env.example
├── context/
│   ├── project-overview.md
│   ├── architecture-context.md
│   ├── ui-context.md
│   ├── code-standards.md
│   ├── ai-workflow-rules.md
│   └── progress-tracker.md
├── feature-specs/
│   ├── 01-design-system.md
│   ├── 02-authentication.md
│   ├── 03-database-schema.md
│   └── [all remaining specs...]
└── research/
    ├── PROJECT_RESEARCH.md
    └── [any design references, visual analyses, etc.]
```

### 15.3 File Content Requirements

| File | What It Must Contain |
|---|---|
| `AGENTS.md` | All seven sections: identity, reading order, init plan data, hard rules, feature order, stack reference, research files |
| `ARTKINS_STYLE_GUIDE.md` | The full style guide — copied verbatim, never summarized |
| `context/project-overview.md` | Problem, users, goals, core flow, scope, success criteria |
| `context/architecture-context.md` | Stack with exact versions, env var table with sources, API route map, DB schema |
| `context/ui-context.md` | Color tokens, typography, layout patterns, interaction rules |
| `context/code-standards.md` | TypeScript rules, framework patterns, auth/ownership rules, DB query discipline |
| `context/ai-workflow-rules.md` | Planning gate, Context7 rules, scoping rules, missing-requirement handling |
| `context/progress-tracker.md` | Current phase, all features NOT STARTED, Feature 01 is next |
| `feature-specs/NN-name.md` | All required fields: exact paths, binary criteria, Out of Scope, Future Modifications |
| `research/PROJECT_RESEARCH.md` | Research index — what files exist, how agent uses them |
| `.env.example` | Every required variable with placeholder names and source locations |

---

## 16. GENERATION INVARIANTS

These are non-negotiable rules for every Foundrie session and every generated ZIP:

1. Foundrie never writes a feature spec for something the human did not request.
2. Foundrie never omits an env var from the Init Plan section.
3. Foundrie never uses vague acceptance criteria ("works correctly", "looks good").
4. Foundrie never generates a spec with ambiguous file paths.
5. Foundrie never creates a spec with dependencies not ordered earlier in the sequence.
6. Foundrie never generates project initialization commands in feature specs.
7. Foundrie never generates a spec that covers more than one meaningful increment.
8. Foundrie always includes Out of Scope in every feature spec.
9. Foundrie always includes Future Modifications in every feature spec.
10. Foundrie always lists exact service setup steps (not "configure your provider").
11. Foundrie always generates the full style guide verbatim — never summarizes it.
12. Foundrie always records the reasoning for every architecture decision.
13. The human reviews and approves the plan before the ZIP is downloaded.

---

*Foundrie AI v1.0.0 — Initial release*
*See FOUNDRIE_V2_0_0.md for multi-language architecture: Rust ZIP generation, polyglot project defaults, language decision matrix, GSAP rules, performance targets*
