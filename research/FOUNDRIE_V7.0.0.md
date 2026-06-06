# FOUNDRIE AI — Research & Operating Specification
## Version 7.0.0

**Version**: 7.0.0
**Release Date**: 2026-05-19
**Status**: Superseded by v8.0.0
**Previous Version**: 6.0.0
**Base**: All v1.0.0 through v6.0.0 content remains in force. This version only documents what changes.
**Purpose**: Define Foundrie's full GitHub integration: GitHub App authentication model, access level matrix, the reference repository pattern, an existing-project onboarding protocol, the six team topology handling strategies, task-scoped session mode, CODEOWNERS generation, and the `.foundrie/` personal workspace for solo adoption.
**Source Research**: FOUNDRIE-RUWA-PATCH.md §2

---

## CHANGELOG — v7.0.0

### New [NEW]
- GitHub App installation flow — Foundrie operates as a GitHub App (not OAuth), with fine-grained installation-level permissions.
- Access level matrix: own repos (full), collaborator-write (full), collaborator-read (read-only), public (read-only), private-other (no access).
- Reference repository pattern: working repo vs read-only reference repos in a Foundrie session.
- Existing project onboarding protocol: reverse-architecture derivation when no Foundrie files are present.
- Six team topology handling strategies (Full Adoption → Solo Adoption on Shared Repo).
- Task-Scoped Session Mode: mini-ZIP for a specific GitHub Issue on a non-Foundrie team.
- `.foundrie/` personal workspace directory for solo engineers on shared repos (gitignored).
- CODEOWNERS file generation in every project ZIP.
- GitHub branch protection configuration generated in the CI/CD feature spec (v3.0.0).
- `EXECUTION_GUIDE.md` generated for non-RUWA executors (Cursor, Claude Code, manual).
- GitHub Issues + PR linking — Foundrie connects feature specs to GitHub Issues during planning.
- Generation invariants 45–51 added.

### Changes to Existing Content
- **AGENTS.md Hard Rules (v1.0.0 §7.4)**: Rule 16 added — "If running on a shared repo without team adoption, operate from `.foundrie/` as root and never push Foundrie files to `main`."
- **CI/CD Feature Spec (v3.0.0 §4)**: Branch protection configuration (required PR, required CodeRabbit review, required status checks, no force pushes) added as a generated GitHub API/Terraform resource in the CI feature spec.
- **ZIP File Inventory (v6.0.0 §6)**: `.github/CODEOWNERS` added as a generated file in every ZIP.

### Deprecated
- Nothing deprecated. All v6.0.0 content preserved.

---

## TABLE OF CONTENTS (v7.0.0 additions only)

1. [GitHub App Authentication](#1-github-app-authentication)
2. [Access Level Matrix](#2-access-level-matrix)
3. [The Reference Repository Pattern](#3-the-reference-repository-pattern)
4. [Existing Project Onboarding Protocol](#4-existing-project-onboarding-protocol)
5. [The Six Team Topologies](#5-the-six-team-topologies)
6. [Task-Scoped Session Mode](#6-task-scoped-session-mode)
7. [CODEOWNERS Generation](#7-codeowners-generation)
8. [EXECUTION_GUIDE.md for Non-RUWA Executors](#8-execution_guidemd)
9. [New Generation Invariants (45–51)](#9-new-generation-invariants)

---

## 1. GITHUB APP AUTHENTICATION

Foundrie operates as a **GitHub App**, not a simple OAuth integration. GitHub Apps have:
- Installation-level permissions (not user-level) — scoped to specific repos.
- Bot identity (not user identity) — Foundrie's commits and reviews appear as `foundrie-bot`.
- Fine-grained permissions — only what Foundrie needs, no more.

### Auth Methods Supported

| Method | Notes |
|---|---|
| Sign in with GitHub (primary) | Makes repo access frictionless for engineers |
| Sign in with Google | For users who prefer Google identity |
| Sign in with Apple | iOS app (Tauri mobile target) |
| Sign in with email/password | Fallback only |

### GitHub App Installation Flow

```
User signs in → Foundrie requests GitHub App installation
→ User lands on GitHub App installation page
→ User selects: "All repositories" or "Select repositories"
→ Foundrie App installed with permissions:
    Contents:      Read + Write (own repos)
    Pull requests: Read + Write
    Issues:        Read
    Metadata:      Read
    Workflows:     Read + Write (CI/CD integration)
→ Foundrie receives installation token
→ Foundrie can now list, read, and write to authorized repos
```

---

## 2. ACCESS LEVEL MATRIX

| Repo Type | Access | What Foundrie/RUWA Can Do |
|---|---|---|
| Your own repos (private + public) | Full | Read all files, write Foundrie context files, create branches, open PRs, read CI status |
| Repos you're a collaborator on (Write access) | Full | Same as above |
| Repos you're a collaborator on (Read access) | Read only | Browse code, reference files, cannot push |
| Other people's public repos | Read only | Browse public code for reference patterns |
| Other people's private repos | No access | Privacy boundary — not accessible |

---

## 3. THE REFERENCE REPOSITORY PATTERN

A Foundrie session can have one **working repo** (where you build) and one or more **reference repos** (where you borrow patterns, but do not modify).

```
WORKING REPO (full write access):
  your-project/
  ├── AGENTS.md            ← Foundrie writes this
  ├── context/             ← Foundrie writes these
  ├── feature-specs/       ← Foundrie writes these
  └── src/                 ← RUWA writes this

REFERENCE REPOS (read-only):
  old-project-1/           ← your own previous project, auth pattern reference
  open-source-lib/         ← public repo, implementation example
  client-existing-app/     ← their existing codebase
```

### How Reference Repos Flow into Specs

During the Foundrie discovery session, when the engineer says: "I want to use the same auth pattern from my old project" → Foundrie reads the auth implementation from the reference repo → extracts the relevant pattern → bakes it into the feature spec's Implementation Notes as explicit guidance.

RUWA then implements to match that pattern without re-reading the reference repo.

**Reference repo extraction is recorded in `research/reference-patterns.md`** with:
- Which reference repo was read.
- Which file was the source.
- What pattern was extracted.
- Which feature spec uses it.

---

## 4. EXISTING PROJECT ONBOARDING PROTOCOL

**Scenario**: The project already has 50,000+ lines of code. No AGENTS.md. No context files. No feature specs. The client says "add these features."

### Foundrie's Reverse-Architecture Protocol

```
STEP 1 — Foundrie reads the repo (via GitHub App)
  Reads: package.json / Cargo.toml / pubspec.yaml → detects stack
  Reads: source file samples from key directories
  Reads: README.md, existing docs
  Reads: existing CI/CD pipeline configuration
  Reads: git log (last 30 commits) → understands recent activity

STEP 2 — Foundrie generates REVERSE ARCHITECTURE DOCUMENTS
  From the existing code, Foundrie derives:
  - Inferred System Context Diagram (who calls what)
  - Inferred ERD (from schema files or ORM models)
  - Inferred API Map (from route files)
  - Inferred Component Diagram (from source structure)
  All labeled: "INFERRED — verify with team before proceeding"

STEP 3 — Foundrie presents to engineer:
  "I've analyzed your existing codebase. Here is what I found.
   Please correct anything that's wrong before I generate specs."

STEP 4 — Engineer corrects + approves the inferred architecture

STEP 5 — Foundrie generates ONLY new feature specs + context files
  Context files reference existing code, not override it.
  AGENTS.md Init Plan states:
    "This is an existing project. Do not reinitialize.
     Do not scaffold. Read src/ before making any changes."

STEP 6 — RUWA opens in Foundrie Integration Mode
  Detects: AGENTS.md present → Foundrie Integration Mode active
  Detects: existing src/ code → reads it before implementing features
  Reads Foundrie context files as additions, not replacements
```

### RUWA Invariant for Existing Projects

Added to `context/ai-workflow-rules.md` for all existing-project ZIPs:

```markdown
## Existing Project Invariant

RUWA never overwrites, deletes, or refactors existing code that
is not covered by a feature spec.

If existing code conflicts with a feature spec:
  RUWA reports the conflict to the human before proceeding.
  RUWA never resolves the conflict unilaterally.
```

---

## 5. THE SIX TEAM TOPOLOGIES

Foundrie handles every real-world team composition. The topology is detected or stated during discovery Phase 4.

### Topology 1: Full Adoption — All Devs Use Foundrie + RUWA

Every feature is a Foundrie spec. Every branch follows `feature/NN-name`. Every PR comes from RUWA. No tooling divergence.

**Foundrie generates**: Standard ZIP with all files. No special adaptations needed.

### Topology 2: Partial Adoption — Mixed Team

Half the team uses Foundrie + RUWA; the other half uses other tools or no AI tools.

**Foundrie generates**: ZIP with an additional `context/ai-workflow-rules.md` section defining **RUWA Monitoring Mode**: RUWA runs a health check on every `git pull` and classifies each changed file as in-scope or out-of-scope for the active feature. External in-scope changes require human review before proceeding. (Full protocol in v9.0.0.)

### Topology 3: Zero Adoption — Solo Engineer on a Shared Repo

The engineer is the only one using Foundrie. The team has not agreed to Foundrie files in the repo.

**Foundrie generates**: All files placed in `.foundrie/` sub-directory. `AGENTS.md` specifies `.foundrie/` as the root. `.gitignore` entry for `.foundrie/` included if team has not adopted it.

```
my-project/
├── src/                ← shared — all devs
├── .github/            ← shared CI
├── .foundrie/          ← YOURS ONLY (gitignored if team hasn't adopted)
│   ├── AGENTS.md
│   ├── context/
│   ├── feature-specs/
│   ├── diagrams/
│   └── research/
└── .gitignore          ← .foundrie/ added here
```

### Topology 4: Mixed AI Tools — Cursor, Claude Code, RUWA Coexist

Foundrie doesn't care what execution tool is used. The ZIP is tool-agnostic. Feature specs can be executed by RUWA (full fidelity), Claude Code (reads AGENTS.md), Cursor (reads context files), or a human typing manually.

**Foundrie generates**: Standard ZIP + `EXECUTION_GUIDE.md` (Section 8 below).

### Topology 5: "Bad Actor" Devs — Direct Pushes, No Review, AI Slop

**Foundrie generates**: Branch protection configuration in the CI feature spec (see §9 of this document) that blocks all direct pushes to `main`, requires PR + CodeRabbit review + CI pass before merge.

### Topology 6: Invited Collaborator — Working in Someone Else's Repo

Two sub-cases:
- **Write access**: `.foundrie/` in your fork or their repo; your branches/PRs are clean; RUWA operates from `.foundrie/`.
- **Fork + upstream PR**: `.foundrie/` in your fork; the upstream never knows Foundrie exists.

**Foundrie generates**: `.foundrie/`-based ZIP with AGENTS.md noting fork/upstream relationship.

---

## 6. TASK-SCOPED SESSION MODE

When an engineer is assigned a specific GitHub Issue on a non-Foundrie team.

```
TASK-SCOPED SESSION PROTOCOL:

Trigger: "I need to implement GitHub Issue #247 — add Stripe payment flow"

Step 1: Foundrie reads Issue #247 via GitHub Issues API
Step 2: Foundrie reads the existing codebase via GitHub App
Step 3: Foundrie generates a mini-ZIP:
  - No full architecture generation
  - Context files reference existing codebase
  - Feature spec covers only the task scope
  - AGENTS.md: "Task-scoped mode. Do not implement outside spec scope."
  - diagrams/ includes only diagrams relevant to the task scope

Step 4: RUWA opens mini-ZIP
  - Reads existing codebase before implementing
  - Implements only the task scope
  - Branch: feature/247-stripe-payment-flow
  - On completion: PR links back to Issue #247 automatically
```

---

## 7. CODEOWNERS GENERATION

Foundrie generates `.github/CODEOWNERS` in every project ZIP. Ownership protects sensitive paths and ensures RUWA-generated files get appropriate review gates.

```
# .github/CODEOWNERS — generated by Foundrie
# Sensitive paths require explicit review

# Foundrie planning files (if committed to repo)
context/             @foundrie-bot
feature-specs/       @foundrie-bot
diagrams/            @foundrie-bot

# Security-sensitive paths
src/lib/auth/        @foundrie-bot
src/lib/db/          @foundrie-bot
tools/permissions.yaml  @foundrie-bot  (v3.0.0 — agentic projects)

# All other code: team lead review
*                    @team-lead
```

### GitHub Branch Protection (Generated in CI Feature Spec)

The CI feature spec (v3.0.0 §4) now also includes:

```yaml
# Generated GitHub branch protection via Terraform or GitHub API
branch_protection:
  main:
    required_pull_request_reviews:
      required_approving_review_count: 1
      dismiss_stale_reviews: true
    required_status_checks:
      strict: true
      contexts:
        - "lint-and-typecheck"
        - "unit-tests"
        - "security-scan"
        - "build"
    restrictions:
      push_bypass: []     # no one can bypass — not even admins
    allow_force_pushes: false
    allow_deletions: false
```

---

## 8. EXECUTION_GUIDE.MD FOR NON-RUWA EXECUTORS

Generated in every ZIP when Topology 4 is detected (mixed AI tools). Placed at root.

```markdown
# Execution Guide for Non-RUWA Agents

This project was planned with Foundrie AI.
If you are using Claude Code, Cursor, or executing manually,
follow this guide to execute feature specs correctly.

## Before You Start
1. Read context/project-overview.md — understand the full picture.
2. Read context/architecture-context.md — know the stack before touching it.
3. Read diagrams/02-container.svg — understand what you're building.

## Implementing a Feature
1. Read the feature spec you are assigned.
2. Read diagrams/05-sequence-[flow].svg for the flows your feature touches.
3. Follow the Implementation Notes exactly.
4. Acceptance Criteria = your definition of done.
5. When complete: open a PR from branch feature/NN-feature-slug.

## Rules
- Do not implement outside the spec scope.
- Do not invent architecture not in the diagrams.
- If something in the spec conflicts with the codebase: open a discussion first.

The diagrams and context files are the ground truth.
```

---

## 9. NEW GENERATION INVARIANTS (45–51)

These are **additions** to invariants 1–44. All prior invariants remain in force.

45. Foundrie always operates as a GitHub App (not OAuth) for write-capable repository integration.
46. For existing projects without Foundrie files, Foundrie generates reverse-architecture documents before writing any specs. Inferred diagrams are always labeled "INFERRED — verify before proceeding."
47. When the team topology is Solo or Mixed, Foundrie generates a `.foundrie/`-rooted ZIP. The `.gitignore` entry for `.foundrie/` is included unless the team has agreed to commit Foundrie files.
48. RUWA never operates in Task-Scoped Mode without a corresponding GitHub Issue reference. The Issue number is recorded in AGENTS.md and linked in the PR.
49. Every generated project ZIP includes `.github/CODEOWNERS` with at minimum `src/lib/auth/` and `src/lib/db/` protected.
50. GitHub branch protection configuration is always generated in the CI feature spec for every project. No project ships without branch protection for `main`.
51. `EXECUTION_GUIDE.md` is generated whenever Topology 4 (mixed AI tools) is detected during discovery. It is placed at the ZIP root.

---

*Foundrie AI v7.0.0 — GitHub App integration, access matrix, reference repos, existing-project onboarding, six team topologies, task-scoped sessions, CODEOWNERS, and non-RUWA execution guide*
*See FOUNDRIE_V8_0_0.md for real-time collaboration (multi-user canvas, AI input queue), session rollback, electricity-loss recovery, and idempotency*
