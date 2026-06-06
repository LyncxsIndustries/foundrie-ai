# FOUNDRIE AI — Research & Operating Specification
## Version 4.0.0

**Version**: 4.0.0
**Release Date**: 2026-05-19
**Status**: Superseded by v5.0.0
**Previous Version**: 3.0.0
**Base**: All v1.0.0 through v3.0.0 content remains in force. This version only documents what changes.
**Purpose**: Add Foundrie's own continuous improvement flywheel, onboarding UX specification (60-second first value), MVP delivery timeline template, Tauri desktop app distribution for Foundrie itself, and the AI-era automation tooling stack that Foundrie recommends for all generated projects.
**Source Research**: AGENTIC-SECURITY.md Sections 9–13

---

## CHANGELOG — v4.0.0

### New [NEW]
- Data flywheel architecture — how Foundrie gets smarter from each session.
- MAPE control loop (Monitor-Analyze-Plan-Execute) for Foundrie's own model improvement.
- Implicit signal hierarchy (Tier 1–4) — how to rank feedback from user sessions.
- C.L.E.A.N. data pipeline for training data quality.
- RLVR training path — using ZIP download + RUWA build pass rate as verifiable reward.
- Training method comparison (RLHF, RLVR, DPO, Constitutional AI) for Foundrie's improvement roadmap.
- Fine-tuning stages 1–5: from raw API usage through full RLHF loop.
- 60-second first value principle and onboarding UX spec for Foundrie itself.
- Progressive disclosure model (Level 1–4) for Foundrie's feature surface.
- Contextual onboarding patterns (empty state templates, inline tips, agent-guided setup).
- Onboarding success metrics (TTFV, Day-1 Activation, Day-7 Retention).
- 4-week AI-accelerated MVP delivery template — generated as `project-management/TIMELINE.md` (formalized in v9.0.0).
- MVP feature flag strategy — Foundrie generates `LAUNCH_FLAGS.md` for MVP handoffs.
- Client handoff package specification.
- Tauri desktop app for Foundrie — Rust + TypeScript, replaces any future Electron consideration.
- Foundrie desktop distribution targets and auto-update strategy.
- AI-era automation tooling stack (2026 standard) embedded in generated project docs.
- Figma → RUWA → Code pipeline specification (one-way import; extended to bidirectional in v10.0.0).
- Core Web Vitals targets for all generated web apps — enforced as acceptance criteria.
- Animation performance rules (GPU-only, `force3D`, `useLayoutEffect`) embedded in `context/code-standards.md`.
- Generation invariants 24–28 added.

### Deprecated [DEPRECATED]
- No features deprecated. All v3.0.0 content preserved.

---

## TABLE OF CONTENTS (v4.0.0 additions only)

1. [The Foundrie Data Flywheel](#1-the-foundrie-data-flywheel)
2. [MAPE Control Loop](#2-mape-control-loop)
3. [Implicit Signal Hierarchy (Tier 1–4)](#3-implicit-signal-hierarchy)
4. [The C.L.E.A.N. Data Pipeline](#4-the-clean-data-pipeline)
5. [Training Methods and Fine-Tuning Stages](#5-training-methods-and-fine-tuning-stages)
6. [Foundrie's Onboarding UX](#6-foundries-onboarding-ux)
7. [The 4-Week AI-Accelerated MVP Timeline](#7-mvp-timeline)
8. [MVP Feature Flag Strategy](#8-mvp-feature-flags)
9. [Client Handoff Package Specification](#9-client-handoff-package)
10. [Foundrie Tauri Desktop App](#10-foundrie-tauri-desktop)
11. [AI-Era Automation Tooling Stack](#11-ai-era-automation-tooling)
12. [Figma → RUWA → Code Pipeline](#12-figma--ruwa--code-pipeline)
13. [Web App Performance Requirements (Enforced in Specs)](#13-web-app-performance-requirements)
14. [New Generation Invariants (24–28)](#14-new-generation-invariants)

---

## 1. THE FOUNDRIE DATA FLYWHEEL

Every session Foundrie runs generates signal. The more engineers use Foundrie, the better its plans become, the better RUWA's builds turn out, the more engineers adopt Foundrie — a compounding competitive moat.

```
┌─────────────────────────────────────────────────────────────┐
│                  FOUNDRIE DATA FLYWHEEL                      │
│                                                              │
│  ENGINEERS use Foundrie → discovery session                  │
│     ↓                                                        │
│  SIGNALS: ZIP downloaded?, RUWA build pass/fail?,           │
│           spec revision count, diagram approval rate,        │
│           session duration, plan acceptance                  │
│     ↓                                                        │
│  TELEMETRY PIPELINE                                          │
│  NATS → anonymize/clean → MongoDB Atlas (training DB)        │
│     ↓                                                        │
│  DATA CURATION                                               │
│  Filter failures → extract negative examples                 │
│  HITL review of edge cases → golden labels                  │
│  Synthetic augmentation of rare project types               │
│     ↓                                                        │
│  FINE-TUNING (RLVR: build pass rate as verifiable reward)   │
│  DPO/RLVR on curated dataset → eval → stage deploy          │
│     ↓                                                        │
│  BETTER FOUNDRIE → better specs → RUWA builds pass faster   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. MAPE CONTROL LOOP

Foundrie's own improvement follows the MAPE (Monitor-Analyze-Plan-Execute) cycle:

```
MONITOR   → collect: ZIP download rate, RUWA first-build pass rate,
            spec revision count, diagram approval iterations,
            feature spec ambiguity reports from RUWA

ANALYZE   → categorize failure modes:
            - Discovery gaps (spec generated without surfacing key requirement)
            - Diagram inaccuracies (ERD didn't match actual schema needed)
            - Spec ambiguity (RUWA reported discrepancy instead of building)
            - Stack mismatch (recommended stack was wrong for the use case)

PLAN      → improvement strategy per failure category:
            - Discovery gaps → expand hidden requirements catalog
            - Diagram inaccuracies → tighten diagram auto-generation rules
            - Spec ambiguity → more explicit Implementation Notes templates
            - Stack mismatch → refine language decision matrix

EXECUTE   → fine-tune or prompt-optimize, evaluate on held-out set, deploy
```

---

## 3. IMPLICIT SIGNAL HIERARCHY

Not every signal requires explicit user feedback. Foundrie collects and ranks signals by reliability:

```
TIER 1 — VERIFIABLE GROUND TRUTH (best signal, no annotation needed)
  - RUWA's build passes on first attempt: ✓/✗
  - RUWA's tests pass without editing the spec: ✓/✗
  - ZIP downloaded after session (plan accepted): ✓/✗
  - Diagram approved without modification: ✓/✗ (count of revision iterations)
  - RUWA reported zero spec discrepancies: ✓/✗

TIER 2 — STRONG IMPLICIT SIGNALS
  - Human approved the plan with no session restarts
  - Session completed all 8 phases without abandonment
  - Feature count not reduced after spec review
  - Engineer added reference repos during discovery (engaged)
  - Scope change triggered immediately after ZIP download (plan was wrong)

TIER 3 — EXPLICIT FEEDBACK
  - Thumbs up/down on a generated spec
  - "This recommendation was wrong" — logged with context
  - "I had to significantly edit this feature spec"

TIER 4 — SYNTHETIC/HUMAN ANNOTATION
  - Internal review team ratings of Foundrie-generated plans
  - Red-team adversarial sessions testing discovery robustness
  - A/B test outcomes (which Foundrie version had higher RUWA build-pass rate?)
```

---

## 4. THE C.L.E.A.N. DATA PIPELINE

Before any session data enters Foundrie's training pipeline, it is cleaned:

```
C — CLARITY      Remove ambiguous or contradictory sessions
L — LOGGING      Every cleaning decision logged with reason code
E — EVALUATION   Cleaned data evaluated on quality rubric before use
A — ADJUSTMENT   Cleaning rules updated as new failure modes emerge
N — DOCUMENTATION Every dataset version documented (schema, source, date, n=)
```

```python
class FoundrieTrainingDataPipeline:
    def clean(self, raw_sessions: list[dict]) -> list[dict]:
        return (
            raw_sessions
            |> self.remove_pii()           # scrub emails, keys, PII (from v3.0.0)
            |> self.deduplicate()          # exact + near-duplicate removal
            |> self.filter_quality()       # remove sessions with < 3 phases completed
            |> self.normalize_format()     # standardize to training schema
            |> self.filter_outliers()      # remove extreme token counts
            |> self.label_failures()       # tag with failure mode category
            |> self.verify_labels()        # human-in-loop spot check 5%
        )
```

---

## 5. TRAINING METHODS AND FINE-TUNING STAGES

### Training Method Comparison

| Method | Signal Source | Best For | Used By |
|---|---|---|---|
| **RLHF** | Human annotators comparing plans | General plan quality | Anthropic Claude (early) |
| **RLVR** | Objective: RUWA build pass rate | Code plan accuracy | Foundrie target (Stage 4) |
| **DPO** | Preference pairs from engineer choices | Efficient fine-tuning | Foundrie Stage 4 |
| **Constitutional AI** | AI-generated critiques of plans | Safety, quality gates | Anthropic (Claude) |

### Fine-Tuning Stages for Foundrie's Own Model

```
STAGE 1: USE FOUNDATION MODEL (API) — current state
  Claude Sonnet 4 via Anthropic API + multi-model rotation (v2.0.0).
  Collect build pass/fail, ZIP download rate, diagram approval signals.
  Cost: API fees only.

STAGE 2: PROMPT ENGINEERING + RAG — immediate next step
  System prompt encodes all Foundrie invariants and generation rules.
  RAG provides project-type-specific spec templates at inference time.
  Cost: Engineering time only.

STAGE 3: FEW-SHOT + DSPy PROMPT OPTIMIZATION — after 500+ sessions
  DSPy optimizes discovery prompts against collected golden dataset.
  Objective: maximize RUWA first-build pass rate.
  Cost: Compute for optimization runs.

STAGE 4: FINE-TUNE SMALLER MODEL — after 1,000+ labeled sessions
  Fine-tune an 8B–70B model on Foundrie-specific discovery data.
  Use DPO or RLVR (build pass rate as verifiable reward signal).
  Cost: GPU compute on cloud spot instances.

STAGE 5: FULL RLHF LOOP — after 100K+ daily active engineers
  Human annotation pipeline. Reward model. PPO/GRPO.
  Cost: Significant — only when volume justifies it.
```

---

## 6. FOUNDRIE'S ONBOARDING UX

### The 60-Second First Value Principle

Engineers using Foundrie must experience value within 60 seconds of landing on the app.

```
Time 0:00 — Engineer opens Foundrie
Time 0:10 — Sees: "What are you building?" (single clear CTA)
Time 0:20 — Types their first project description
Time 0:45 — Foundrie surfaces the first discovery question (or shows starter templates)
Time 1:00 — Engineer sees Foundrie actively shaping their project plan
```

### Progressive Disclosure (Level 1–4)

```
LEVEL 1 (Day 1): Basic discovery conversation → feature spec list → ZIP download
LEVEL 2 (Day 3): Diagram canvas introduced contextually after first session
LEVEL 3 (Week 1): GitHub integration surfaced when repo discussion arises
LEVEL 4 (Week 2): Power features: collaboration, reference repos, custom research
```

### Contextual Onboarding Patterns

- **Empty state templates**: When a new session opens with no context, Foundrie offers 5 starter prompts relevant to detected or selected project category.
- **Inline tips**: Contextual hints during discovery. Example: `"💡 I noticed you mentioned Stripe — I'll include payment failure handling as a separate feature spec, which is often missed."`
- **Agent-guided setup**: If the engineer's description is Level 1 (vague), Foundrie asks targeted questions rather than asking them to be more specific generically.
- **Progress visibility**: Foundrie always shows which discovery phase it is in. Example: `"Phase 3 of 5 — Scope & Constraints"`
- **Sample workspace**: New users without a project idea can explore a pre-built demo session.

### Onboarding Success Metrics

```
Time to First Value (TTFV)    → target: < 60 seconds to first discovery question
Day-1 Activation Rate         → % who download a ZIP in their first session
Day-7 Retention               → % who return for a second project
ZIP Download Rate             → % of sessions that result in a downloaded ZIP
Diagram Approval Rate         → % of generated diagrams approved without modification
RUWA Build Pass (Tier 1)      → % of ZIPs where RUWA builds on first attempt

If Day-1 activation < 60%:   onboarding conversation quality needs improvement
If RUWA Build Pass < 80%:    spec generation quality needs improvement
```

---

## 7. THE 4-WEEK AI-ACCELERATED MVP TIMELINE

Foundrie generates this timeline perspective as part of the discovery conversation for client-deliverable projects. It feeds `project-management/TIMELINE.md` (formalized in v9.0.0).

```
WEEK 1: Foundation (AI accelerates 10×)
  - Foundrie discovery session: architecture, diagrams, all specs generated
  - Human: scaffold project, setup git, configure env vars
  - RUWA: Feature 01 (design system) + Feature 02 (auth) by end of week
  - Foundrie's role: plan complete, ZIP downloaded, no further discovery needed

WEEK 2: Core Features
  - RUWA: Features 03–06 (database, core CRUD, key workflows)
  - Human: reviews and approves each, tests in browser
  - Foundrie's role: available for scope clarifications, generates Scope Amendment
    docs if client requests changes

WEEK 3: Polish + Security
  - RUWA: Features 07–10 (UI polish, error handling, edge cases, CI/CD)
  - Security scanning integrated in every feature (v3.0.0 mandatory)
  - Foundrie's role: generates impact analysis if new requirements surface

WEEK 4: Staging + Handoff
  - Deploy to staging, client walkthrough, acceptance testing
  - Foundrie generates the client handoff package (Section 9)
  - RUWA: finalizes docs, production checklist verification
```

---

## 8. MVP FEATURE FLAG STRATEGY

Foundrie generates `LAUNCH_FLAGS.md` in the ZIP for MVP projects:

```markdown
# Launch Flags

## What This Document Is
A record of features that are intentionally hidden from the client
at delivery time. Each flag maps to a future feature spec or release.

## Active Flags at Handoff

| Flag | Status | What It Controls | Future Release |
|---|---|---|---|
| `multi-agent-orchestration` | OFF | Multi-agent AI features | v1.1 |
| `voice-input` | ON | Voice-to-text input | Shipped |
| `git-integration` | BETA (10%) | GitHub repo connection | v1.1 |
| `code-review-agent` | OFF | Automated PR review | v1.2 |

## Instructions for Client
These flags are controlled via LaunchDarkly / GrowthBook.
Contact [engineer] to enable any beta feature for testing.
```

---

## 9. CLIENT HANDOFF PACKAGE SPECIFICATION

Foundrie generates a complete handoff package at project end. This specification defines what must be in it:

```
REQUIRED ITEMS:
  ✓ Deployed staging URL with credentials
  ✓ Architecture diagram (system components + data flows) — from diagrams/ directory (v6.0.0)
  ✓ Environment variable documentation (what each does, where to get values)
  ✓ Runbook: how to restart services, check logs, deploy updates
  ✓ Known limitations document (what is out of scope, what to watch)
  ✓ Monitoring dashboard link (Grafana) with explanation of key metrics
  ✓ Admin access to all cloud resources
  ✓ Domain/SSL setup instructions
  ✓ Recorded walkthrough video (Loom — 10–15 minutes)
  ✓ 30-day support SLA definition
  ✓ context/progress-tracker.md showing all completed features
  ✓ Security scan report (all scans passing — from v3.0.0)
  ✓ LAUNCH_FLAGS.md explaining hidden features
```

The formal handoff packet structure (7 sections: Project Summary, Deliverables Index, Credentials, License, Known Limitations, Maintenance Notes, Future Recommendations) is specified in v14.0.0.

---

## 10. FOUNDRIE TAURI DESKTOP APP

Foundrie's desktop distribution uses Tauri 2.0 (Rust backend + TypeScript React frontend). The same Rust execution layer from v2.0.0 is shared between the server and desktop app.

### Why Tauri

| Concern | Electron | Tauri |
|---|---|---|
| Binary size | 150–200 MB | 3–10 MB |
| Memory | 200–400 MB | 20–50 MB |
| Backend language | Node.js | Rust (same as Foundrie execution layer) |
| Security | Chromium sandbox | OS WebView + Rust security model |
| Startup time | 2–5 seconds | <200 ms |

### Tauri Desktop Architecture

```rust
// Tauri 2.0 backend — same Rust execution layer (v2.0.0) exposed as desktop commands
#[tauri::command]
async fn generate_zip(project_id: String, state: tauri::State<'_, AppState>) -> Result<String, String> {
    let zip_bytes = state.zip_builder.build(&project_id).await
        .map_err(|e| e.to_string())?;
    // Save to user's Downloads folder
    let path = state.downloads_path.join(format!("{}.zip", project_id));
    tokio::fs::write(&path, zip_bytes).await.map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().to_string())
}
```

```typescript
// TypeScript + React frontend — identical to the web app
// No context switching between web and desktop development
import { invoke } from '@tauri-apps/api/core';

async function downloadZip(projectId: string) {
  const path = await invoke<string>('generate_zip', { projectId });
  toast.success(`ZIP saved to ${path}`);
}
```

### Desktop Distribution

```
Cross-compilation targets:
  x86_64-apple-darwin, aarch64-apple-darwin (macOS)
  x86_64-unknown-linux-gnu, aarch64-unknown-linux-gnu (Linux)
  x86_64-pc-windows-msvc (Windows)

Distribution channels:
  - GitHub Releases: .dmg + .deb + .rpm + .msi
  - Homebrew cask: brew install --cask foundrie
  - Auto-update: Tauri updater plugin, triggered on session open
```

---

## 11. AI-ERA AUTOMATION TOOLING STACK

Foundrie embeds the 2026 standard tooling stack in generated project docs and uses it internally:

```
DESIGN & FRONTEND
  Figma → source of truth for design systems
  v0.dev / Vercel AI → React component generation from Figma/description
  Cursor / Windsurf → AI-native IDE for frontend development
  Tailwind CSS v4 → AI generates styling fastest with utility classes

BACKEND & AGENT LOGIC
  Claude Code → agentic coding in terminal for backend/infra
  Cursor → IDE-based coding with full codebase context
  GitHub Copilot → inline completion for quick tasks

INFRASTRUCTURE & DEVOPS
  Terraform → all infrastructure as code (from v3.0.0)
  GitHub Actions → CI/CD pipeline (22-step from v3.0.0)
  Docker + Buildkit → immutable containerized artifacts

OBSERVABILITY
  Grafana Cloud → dashboards, alerting
  Sentry → error tracking with AI-powered root cause analysis
  LangSmith / Arize → agent-specific tracing and evaluation

SECURITY
  Semgrep → SAST for custom rules
  Snyk → dependency scanning + AI-generated fix PRs
  Gitleaks → secret detection

MODEL IMPROVEMENT
  Weights & Biases → experiment tracking
  LangSmith → LLM evaluation and dataset management
  NVIDIA NeMo → fine-tuning pipeline for specialized models
```

This tooling matrix is generated as `docs/TOOLING.md` in every Foundrie ZIP.

---

## 12. FIGMA → RUWA → CODE PIPELINE

Foundrie handles Figma integration as a one-way import in v4.0.0 (extended to bidirectional in v10.0.0).

```
1. Human provides Figma link or exports frames as images
   in the Foundrie discovery session

2. Foundrie AI analyzes Figma export:
   - Extracts color tokens, typography scale, spacing system
   - Records motion intent from prototype interactions
   - Generates research/visual-analysis.md

3. Foundrie generates context/ui-context.md:
   - Complete design system specification
   - Exact color values, font families, animation timing

4. Feature 01 (Design System) implementation notes reference:
   research/visual-analysis.md and context/ui-context.md

5. RUWA implements design-system.ts matching Figma tokens

6. Human reviews in browser — approves or requests adjustments
```

**Generated `design-system.ts` pattern:**

```typescript
export const tokens = {
  colors: {
    brand: { primary: '#00d18f', secondary: '#7c3aed' },
    surface: { base: '#07090b', elevated: '#11161a' },
    text: { primary: '#eef5f2', muted: '#7e8c86' },
  },
  motion: {
    fast: { duration: 0.2, ease: 'power2.out' },
    entrance: { duration: 0.9, ease: 'power4.out' },
  },
} as const;
```

---

## 13. WEB APP PERFORMANCE REQUIREMENTS (ENFORCED IN SPECS)

Every web app feature spec Foundrie generates includes performance-related acceptance criteria derived from Core Web Vitals targets:

```
Core Web Vitals (enforced as acceptance criteria in Feature 01):
  LCP (Largest Contentful Paint): < 2.5 s
  FID (First Input Delay):         < 100 ms
  CLS (Cumulative Layout Shift):   < 0.1
  TTFB (Time to First Byte):       < 600 ms
  Initial JS Bundle:               < 200 KB gzipped

Achieved via (embedded in context/code-standards.md):
  - Server Components by default (zero client JS for data fetching)
  - next/image with automatic WebP/AVIF conversion
  - Dynamic imports for heavy components (GSAP, charts, editors)
  - Edge deployment for static assets
```

**Animation performance rules in generated `context/code-standards.md`:**

```
ANIMATION RULES (required in all UI features):
  1. Animate only transform + opacity — never width/height/margin/padding
  2. Always use force3D: true on animated elements
  3. Use useLayoutEffect (not useEffect) for GSAP animations
  4. Scope all GSAP with gsap.context() — prevents memory leaks
  5. Always return ctx.revert() in cleanup function
  6. Use dynamic import for GSAP plugins: import('gsap/ScrollTrigger')
```

---

## 14. NEW GENERATION INVARIANTS (24–28)

These are **additions** to invariants 1–23. All prior invariants remain in force.

24. All generated web apps include Core Web Vitals acceptance criteria (LCP < 2.5s, FID < 100ms, CLS < 0.1) in Feature 01's acceptance criteria.
25. Foundrie always generates a Tauri-based desktop distribution spec when the project includes a desktop target. Electron is never recommended.
26. All GSAP animation rules (GPU-only properties, `useLayoutEffect`, `gsap.context()`, `ctx.revert()`) are embedded in generated `context/code-standards.md` and enforced as acceptance criteria in UI feature specs.
27. Foundrie's telemetry pipeline feeds the data flywheel. All signal collection follows the Tier 1–4 hierarchy. PII is scrubbed before any signal is stored (from v3.0.0).
28. The C.L.E.A.N. framework is applied to all Foundrie training data before any fine-tuning operation.

---

*Foundrie AI v4.0.0 — Data flywheel, onboarding UX, MVP timeline, Tauri desktop, and AI-era automation integrated*
*See FOUNDRIE_V5_0_0.md for monorepo architecture, generated project types (mobile/blockchain/real-time), ADRs, blue-green deployment, RLUF, DSPy, 3D UI layer, and tooling reference matrix*
