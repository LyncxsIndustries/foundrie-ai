# FOUNDRIE AI — Research & Operating Specification
## Version 5.0.0

**Version**: 5.0.0
**Release Date**: 2026-05-19
**Status**: Superseded by v6.0.0
**Previous Version**: 4.0.0
**Base**: All v1.0.0 through v4.0.0 content remains in force. This version only documents what changes.
**Purpose**: Formalize Foundrie's own monorepo structure, introduce Architecture Decision Records (ADRs) as a generated ZIP artifact, extend project-type generation to cover mobile, blockchain, and real-time systems in full, add blue-green deployment as a generated CD option, integrate RLUF into Foundrie's improvement flywheel, and adopt DSPy for automated discovery prompt optimization.
**Source Research**: AGENTIC-SECURITY.md §§2, 10 · MULTI-LANGUAGE-ARCHITECTURE-PROGRAMMING.md §§11.2, 11.7, 11.8

---

## CHANGELOG — v5.0.0

### New [NEW]
- Foundrie's own monorepo structure (`apps/`, `packages/`, `infra/`, `data/`) formally specified.
- ADR (Architecture Decision Record) generation — every stack or architecture decision from the discovery session produces a file in `docs/adr/`.
- Mobile app project type: full generation rules for React Native (Expo) and Flutter projects.
- Blockchain project type: full generation rules for Solana (Rust/Anchor), Ethereum (Solidity/Hardhat), and CosmWasm projects.
- Real-time system project type: full generation rules for WebSocket-first, NATS-backed, and Liveblocks-powered systems.
- Blue-green deployment option — generated as an alternative CD strategy alongside canary in the CI/CD feature spec.
- RLUF (Reinforcement Learning from User Feedback) integrated into Foundrie's flywheel as a production-scale training strategy.
- DSPy automatic prompt optimization — Foundrie uses DSPy to continuously optimize its own discovery prompts against the golden session dataset.
- `CONTRIBUTING.md` extended to cover the ADR process and monorepo contribution rules.
- Generation invariants 29–35 added.

### Changes to Existing Content
- **Stack-Agnostic Generation Rules (v1.0.0 §11)**: Mobile, blockchain, and real-time rules upgraded from stub to full specification (see Sections 4–6 below).
- **CI/CD Feature Spec (v3.0.0 §4)**: Blue-green deployment steps added as a configurable alternative in the CD phase (Steps 12–22).
- **Data Flywheel (v4.0.0 §1)**: RLUF added as a Tier-5 signal source; DSPy optimization added as Stage 3 execution tool.

### Deprecated
- Nothing deprecated. All v4.0.0 content preserved.

---

## TABLE OF CONTENTS (v5.0.0 additions only)

1. [Foundrie's Own Monorepo Structure](#1-foundries-own-monorepo-structure)
2. [Architecture Decision Records (ADRs)](#2-architecture-decision-records)
3. [Mobile App Generation Rules (Full Spec)](#3-mobile-app-generation-rules)
4. [Blockchain Generation Rules (Full Spec)](#4-blockchain-generation-rules)
5. [Real-Time System Generation Rules (Full Spec)](#5-real-time-system-generation-rules)
6. [Blue-Green Deployment in Generated CD Pipelines](#6-blue-green-deployment)
7. [RLUF Integration into the Data Flywheel](#7-rluf-integration)
8. [DSPy Automatic Prompt Optimization](#8-dspy-prompt-optimization)
9. [New Generation Invariants (29–35)](#9-new-generation-invariants)

---

## 1. FOUNDRIE'S OWN MONOREPO STRUCTURE

Foundrie's own codebase is a monorepo managed with Turborepo. This structure is the reference implementation for any generated "AI coding agent" project type.

```
/foundrie/
│
├── apps/
│   ├── web/                    # Next.js 16 — Foundrie canvas UI (Layer 3)
│   ├── desktop/                # Tauri 2.0 — desktop distribution (v4.0.0)
│   └── api-gateway/            # Go Gin — routing layer (Layer 4)
│
├── packages/
│   ├── foundrie-core/          # Rust Axum — ZIP builder, key rotation (Layer 1)
│   ├── ai-layer/               # Python LangGraph — discovery orchestration (Layer 2)
│   ├── diagram-engine/         # Rust — Mermaid/SVG/DBML generation
│   ├── telemetry/              # Shared OpenTelemetry SDK (v3.0.0)
│   ├── auth/                   # Clerk shared module
│   └── config/                 # Shared config schemas (Zod + Pydantic)
│
├── infra/
│   ├── terraform/
│   │   └── environments/
│   │       ├── dev/
│   │       ├── staging/
│   │       └── prod/
│   ├── kubernetes/
│   └── docker/
│
├── data/
│   ├── training/               # Curated fine-tuning datasets (C.L.E.A.N. pipeline)
│   ├── evals/                  # Golden session benchmarks
│   ├── synthetic/              # Augmented rare project-type examples
│   └── schemas/                # MongoDB Atlas training data schemas
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── release.yml
│       ├── security-scan.yml
│       └── model-eval.yml
│
├── turbo.json
└── README.md
```

**Monorepo tooling**: Turborepo for task orchestration. All packages share a single `node_modules` resolution at root. Rust packages share a workspace `Cargo.toml`. Python packages share a `pyproject.toml` at root.

---

## 2. ARCHITECTURE DECISION RECORDS (ADRS)

Every significant technical decision made during a Foundrie discovery session must produce a corresponding ADR in `docs/adr/`. These are generated by Foundrie and placed in the ZIP.

### ADR Naming Convention

```
docs/adr/ADR-[NNNN]-[kebab-case-decision-title].md
```

### ADR Template (Generated by Foundrie)

```markdown
# ADR-[NNNN]: [Decision Title]

**Date**: [ISO date from session]
**Status**: Accepted | Proposed | Deprecated | Superseded by ADR-NNNN
**Deciders**: [Project team / engineer name from discovery]

## Context
[What question was being decided, and why it mattered for this project specifically]

## Decision
[The exact choice made]

## Rationale
[Why this choice over the alternatives. Includes benchmark data or
 case study reference if available — per Section 10.3 of FOUNDRIE-RUWA-PATCH]

## Consequences
- Positive: [what this enables]
- Negative: [what this trades away]
- Neutral: [what this changes without clear positive/negative valence]

## Alternatives Considered
| Alternative | Reason Rejected |
|---|---|
| [Option A] | [Why not] |
```

### When Foundrie Generates an ADR

Foundrie generates one ADR per decision in these categories:
- Primary language per layer (if non-default from v2.0.0 decision matrix)
- Database choice (with justification)
- Authentication library choice
- Deployment target
- Any choice where the engineer overrode Foundrie's recommendation

### ADR in `context/architecture-context.md`

Every generated `context/architecture-context.md` includes:

```markdown
## Architecture Decisions

The following decisions were made during the Foundrie session.
Full rationale is in docs/adr/:

| ADR | Decision | File |
|---|---|---|
| ADR-0001 | Stack: Next.js 16 + Rust Axum + Neon Postgres | docs/adr/ADR-0001-stack-choice.md |
| ADR-0002 | Auth: Clerk (over Auth.js) | docs/adr/ADR-0002-auth-choice.md |
[...]
```

---

## 3. MOBILE APP GENERATION RULES (FULL SPEC)

Replaces the stub in v1.0.0 §11.2. This is the complete generation specification for mobile projects.

### Stack Selection

| Platform | Primary Stack | When to Choose |
|---|---|---|
| Cross-platform (iOS + Android) | TypeScript · Expo SDK 52 · React Native | Team has TypeScript/web skills; faster iteration; 90%+ of use cases |
| Performance-critical native | Rust native modules (Nitro Modules) | Heavy computation: image processing, local AI, cryptography |
| Design-system-heavy iOS | Swift + SwiftUI | Client explicitly requires native iOS only |
| Design-system-heavy Android | Kotlin + Jetpack Compose | Client explicitly requires native Android only |

### Expo Feature Sequence (Default Mobile Path)

```
Feature 01: Navigation structure + design tokens
  - Expo Router file-based navigation scaffold
  - Design token file: constants/tokens.ts
  - Base layout: app/_layout.tsx with theme provider
  
Feature 02: Authentication flow
  - Clerk Expo integration
  - Sign-in, sign-up, verify screens
  - useAuth hook for protected route gates
  
Feature 03: API client + data model
  - tRPC or REST client setup
  - TanStack Query for cache management
  - Type-shared with Next.js backend (if monorepo)
  
Feature 04: First functional screen
  - Core value-delivery screen implemented
  - Pull-to-refresh, loading states, error states
  
Feature NN: Push notifications
  - Expo Notifications + backend webhook handler
  - Always a separate spec — notification architecture is non-trivial
```

### Mobile-Specific Acceptance Criteria Rules

Every mobile feature spec must include:
- `[ ] App builds without errors on iOS simulator`
- `[ ] App builds without errors on Android emulator`
- `[ ] No console warnings related to this feature`
- `[ ] Navigation back/forward works correctly`
- `[ ] Loading, error, and empty states are implemented`

### Rust Native Modules (When Applicable)

Foundrie generates a separate feature spec "Feature NN — Native Module: [Purpose]" when:
- Image/video processing is required.
- Local AI inference (Whisper, on-device LLM) is in scope.
- Cryptographic operations are required.
- File compression/decompression at scale is needed.

The spec uses Nitro Modules for React Native and includes the full Rust + C++ bridging setup.

---

## 4. BLOCKCHAIN GENERATION RULES (FULL SPEC)

Replaces the stub in v1.0.0 §11.5.

### Chain Selection Decision Matrix

```
User wants to build on:     Use:              Language:
────────────────────────────────────────────────────────────────
Solana                       Anchor            Rust (mandatory)
NEAR                         near-sdk-rs        Rust (mandatory)
Stellar                      Soroban SDK       Rust (mandatory)
CosmWasm (Cosmos)            cosmwasm-std       Rust (mandatory)
Ethereum / EVM chains        Hardhat or Foundry Solidity
Starknet                     Scarb             Cairo
```

### Solana Feature Sequence (Default Smart Contract Path)

```
Feature 01: Development environment
  - Anchor framework setup
  - Solana test validator config
  - Keypair generation and airdrop for development
  
Feature 02: Contract structure + test setup
  - Program module skeleton (programs/[name]/src/lib.rs)
  - Anchor test framework: tests/[name].ts
  - Instruction handlers stubbed with error types
  
Feature 03: First deployable contract + tests
  - Core instruction implemented (e.g., initialize, deposit, withdraw)
  - Property-based tests using Mollusk or Bankrun
  - All edge cases covered before any frontend work
  
Feature 04: Frontend integration
  - Next.js + @solana/web3.js + Anchor client types
  - Wallet adapter (Phantom, Backpack)
  - Read state + send transactions
```

### Blockchain-Specific Acceptance Criteria Rules

Every smart contract feature spec must include:
- `[ ] All tests pass: anchor test`
- `[ ] Zero clippy warnings: cargo clippy -- -D warnings`
- `[ ] Program compiles to WASM/BPF without errors`
- `[ ] Test coverage covers all error paths`

### Frontend ↔ Contract Type Safety

Foundrie generates a type-sharing feature spec when the stack includes both a contract and a frontend:

```
Feature NN: Contract Type Bindings
  - Export Anchor IDL types to TypeScript
  - Generated client in lib/anchor/[program-name].ts
  - Type safety enforced at every RPC call site
```

---

## 5. REAL-TIME SYSTEM GENERATION RULES (FULL SPEC)

Replaces the stub in v1.0.0 §11. New project type.

### Real-Time Architecture Decision

```
Use Case                              Architecture
────────────────────────────────────────────────────────────────────
Collaborative editing (docs/canvas)   Liveblocks (managed CRDT)
Live presence (cursors, avatars)      Liveblocks presence API
Chat / messaging                      Rust Axum WebSocket + NATS
Real-time dashboards (read-heavy)     Server-Sent Events (Next.js + Rust)
Event-driven microservices            NATS JetStream
High-throughput pipelines             Kafka (Redpanda managed)
```

### Real-Time Feature Sequence

```
Feature 01: WebSocket/SSE infrastructure
  - If Liveblocks: install + configure room schema
  - If Rust WebSocket: Axum ws handler + Tokio broadcast channel
  - If NATS: connection setup, subject naming convention
  
Feature 02: Presence layer
  - Who is online: user ID → cursor position or status
  - Conflict-free merge (CRDT if Liveblocks; last-write-wins otherwise)
  
Feature 03: Real-time state sync
  - The object being shared (document, canvas, game state)
  - Optimistic updates on the client, server reconciliation
  
Feature NN: Persistence + replay
  - Real-time events persisted to Neon Postgres (immutable event log)
  - Replay from a point-in-time for audit or recovery
```

### Real-Time Acceptance Criteria Rules

Every real-time feature spec must include:
- `[ ] Two browser tabs opened simultaneously show live updates within 200ms`
- `[ ] Reconnection after network drop restores state correctly`
- `[ ] Disconnected user's presence is removed within 5 seconds`

---

## 6. BLUE-GREEN DEPLOYMENT IN GENERATED CD PIPELINES

Added as an optional CD strategy alongside canary (v3.0.0 §4). Foundrie generates the appropriate strategy based on discovery answers about deployment risk tolerance and rollback speed requirements.

### When Foundrie Recommends Blue-Green

- The project has long-lived user sessions (games, chat, collaborative tools) that cannot be gracefully interrupted by canary traffic splitting.
- The client explicitly requires instant rollback capability (<30 seconds).
- The team's traffic volume is low enough that canary percentages would mean <10 real users on the new version.

### Generated Blue-Green Steps (Additions to CD Phase)

```
Blue-Green Strategy (alternative to canary — generated in cd.yml):

STEP A: Deploy GREEN (new version) → 0% traffic
  - New task definition registered in ECS / new Kubernetes deployment
  - Health checks run against green target group
  - Smoke tests run against green (not exposed to users)

STEP B: Flip traffic
  - Load balancer target group updated: blue → green
  - DNS TTL set low (30s) before flip for fast propagation
  - All new sessions go to green

STEP C: Monitor window (15 minutes)
  - Error rate compared: green vs blue baseline
  - If error spike: flip back to blue instantly (< 30s rollback)
  - If clean: blue decommissioned after 1 hour

Generated Terraform resource additions:
  - aws_lb_listener_rule with weighted target groups
  - aws_ecs_service with multiple task definition revisions
  - CloudWatch alarm on error rate differential
```

### ADR Generated for Deployment Choice

Foundrie always generates `docs/adr/ADR-NNNN-deployment-strategy.md` documenting whether canary or blue-green was chosen and why.

---

## 7. RLUF INTEGRATION INTO THE DATA FLYWHEEL

RLUF (Reinforcement Learning from User Feedback) extends v4.0.0's flywheel with production-scale user interaction as a training signal source.

### RLUF vs RLHF for Foundrie

| Approach | Signal | Scale | Foundrie Application |
|---|---|---|---|
| RLHF | Human annotator pairs | Limited by annotator throughput | Stage 4 (v4.0.0) |
| RLUF | Live user interactions + implicit signals | Scales with user count | Stage 3.5 (new) |
| RLVR | Verifiable build pass/fail | Unlimited at scale | Stage 4 primary (v4.0.0) |

### RLUF Signal Sources for Foundrie

```
USER INTERACTION SIGNALS (collected via Foundrie web app telemetry):

Positive RLUF signals (spec quality approved):
  - Human approved a diagram on first iteration (zero revision requests)
  - ZIP downloaded within 5 minutes of plan presentation (immediate acceptance)
  - Human's first RUWA build attempt passed without spec edits
  - Session completed all 8 phases without restart

Negative RLUF signals (spec quality issues):
  - Human restarted the discovery conversation mid-session
  - Same diagram revised 3+ times before approval
  - Human edited a feature spec manually before handing to RUWA
  - RUWA reported a spec discrepancy (couldn't implement as written)
  - Human added a requirement that Foundrie should have surfaced in discovery

Preference pairs (RLUF training data):
  Session A vs Session B: same project category, different Foundrie model versions.
  Which session produced a RUWA build-pass rate > 90%? That's the preferred session.
```

### RLUF Implementation in Foundrie's Training Pipeline

```python
# MongoDB training collection: foundrie_rluf_pairs
# Each document = one preference pair from two sessions

{
  "session_preferred": "sess_abc123",   # higher build pass rate
  "session_rejected": "sess_def456",    # lower build pass rate
  "project_category": "saas-web-app",
  "model_version_preferred": "foundrie-dspy-v3",
  "model_version_rejected": "foundrie-base-v2",
  "build_pass_rate_preferred": 0.94,
  "build_pass_rate_rejected": 0.61,
  "spec_revision_count_preferred": 0.4,  # avg revisions per spec
  "spec_revision_count_rejected": 2.1,
  "created_at": "2026-05-19T..."
}
```

This preference pair dataset feeds DPO (Direct Preference Optimization) fine-tuning at Stage 4.

---

## 8. DSPY AUTOMATIC PROMPT OPTIMIZATION

DSPy replaces manual prompt engineering for Foundrie's discovery conversation prompts. This is Stage 3 in the fine-tuning path (v4.0.0 §5).

### What DSPy Optimizes in Foundrie

Foundrie's discovery conversation has five phases (v1.0.0 §5.1), each driven by specific prompts. DSPy optimizes:
- The question selection strategy per phase.
- Which follow-up question to ask given a vague answer.
- Which hidden requirements to surface for a given project category.
- The sequence of architecture proposals.

### DSPy Optimization Setup

```python
import dspy

# Define the Foundrie discovery module
class FoundrieDiscovery(dspy.Module):
    def __init__(self):
        self.phase1 = dspy.ChainOfThought("problem_description -> clarifying_questions")
        self.hidden_req = dspy.Predict("project_type, phase1_answers -> hidden_requirements")
        self.stack_propose = dspy.Predict("requirements, team_skills -> stack_proposal")

    def forward(self, problem_description: str):
        phase1 = self.phase1(problem_description=problem_description)
        hidden = self.hidden_req(project_type=..., phase1_answers=phase1.clarifying_questions)
        stack = self.stack_propose(requirements=..., team_skills=...)
        return dspy.Prediction(questions=phase1, hidden=hidden, stack=stack)

# Optimization target: maximize RUWA build pass rate on held-out sessions
teleprompter = dspy.BootstrapFewShot(
    metric=ruwa_build_pass_rate_metric,
    max_bootstrapped_demos=8,
)
optimized = teleprompter.compile(FoundrieDiscovery(), trainset=session_training_data)
```

### Golden Dataset for DSPy

The DSPy optimization runs against a golden dataset of 500+ Foundrie sessions where:
- The ZIP was downloaded.
- RUWA's first build passed.
- Zero spec discrepancies were reported.
- The human approved all diagrams within 2 iterations.

This dataset lives in `data/evals/foundrie-golden-sessions.jsonl`.

---

## 9. NEW GENERATION INVARIANTS (29–35)

These are **additions** to invariants 1–28. All prior invariants remain in force.

29. Every Foundrie session where an architecture decision deviates from the decision matrix (v2.0.0 §9) generates a corresponding ADR in `docs/adr/`.
30. Mobile app projects always generate Expo SDK as the default cross-platform choice unless the human explicitly selects native Swift or Kotlin. The deviation is recorded in an ADR.
31. Smart contract projects always use Rust for Solana, NEAR, and Stellar chains. Foundrie never proposes JavaScript/TypeScript for on-chain programs on these chains.
32. Real-time project types always include a persistence + replay feature spec. Real-time without durability is incomplete.
33. Foundrie selects blue-green vs canary during discovery Phase 4. The deployment strategy is documented in `context/architecture-context.md` and in an ADR.
34. DSPy optimization runs are executed against the golden session dataset before any Foundrie model version is promoted to production.
35. RLUF preference pairs are generated for every A/B test of Foundrie model versions. Preference is determined by RUWA build-pass rate on the same project category, not by human rater comparison alone.

---

*Foundrie AI v5.0.0 — Monorepo structure, ADRs, mobile/blockchain/real-time project types, blue-green deployment, RLUF, and DSPy integrated*
*See FOUNDRIE_V6_0_0.md for diagram-first architecture: the full diagram suite, diagram-first gate, updated discovery protocol (8 phases), diagram versioning, and technology stack*
