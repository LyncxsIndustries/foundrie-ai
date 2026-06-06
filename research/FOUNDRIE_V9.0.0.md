# FOUNDRIE AI — Research & Operating Specification
## Version 9.0.0

**Version**: 9.0.0
**Release Date**: 2026-05-19
**Status**: Superseded by v10.0.0
**Previous Version**: 8.0.0
**Base**: All v1.0.0 through v8.0.0 content remains in force. This version only documents what changes.
**Purpose**: Define RUWA's continuous repository health monitor, file ownership assignment in the Feature Dependency Graph, the scope change protocol (impact analysis, spec regeneration, ADR), and formalize the four project management documents Foundrie generates in every ZIP: SCOPE.md, TIMELINE.md, PRICING.md, and CHANGE_LOG.md. Also specifies feature removal handling.
**Source Research**: FOUNDRIE-RUWA-PATCH.md §§6, 7

---

## CHANGELOG — v9.0.0

### New [NEW]
- RUWA Repo Health Monitor: runs before every feature start and on every `git pull`. Classifies each upstream change as in-scope or out-of-scope. Reports broken builds before RUWA touches anything.
- File ownership assignment in the Feature DAG: Foundrie assigns file ownership per feature spec during Phase 7. No two active feature specs may own the same file simultaneously.
- RUWA Monitoring Mode for partial-adoption teams: detects external changes to in-scope files; reports before proceeding; never self-merges another dev's changes.
- Scope Change Protocol: Foundrie's Impact Analysis, triggered by any mid-development requirement change. Produces impact report (affected features, new features needed, diagram updates, timeline delta, cost delta) before any spec is regenerated.
- Feature removal protocol: NOT STARTED, IN PROGRESS, and COMPLETE cases each handled differently. Completed feature removal generates a new "removal" feature spec — never leaves dead code.
- `project-management/SCOPE.md` — formal in-scope/out-of-scope contract.
- `project-management/TIMELINE.md` — auto-generated from feature count and complexity estimates.
- `project-management/PRICING.md` — infrastructure cost estimation per service tier.
- `project-management/CHANGE_LOG.md` — updated by Foundrie on every approved scope change.
- ZIP file inventory updated: `project-management/` directory added.
- Generation invariants 61–68 added.

### Changes to Existing Content
- **ZIP File Inventory (v6.0.0 §6)**: `project-management/` directory added as mandatory.
- **AGENTS.md Hard Rules (v1.0.0 §7.4)**: Rule 17 added — "Before starting a feature, run the repo health check. Do not begin implementation if the build is broken due to an upstream change."
- **Feature Spec Quality (v1.0.0 §8)**: Every feature spec now generated with an explicit `Files Owned` field in addition to `Files to Create` and `Files to Modify`.

### Deprecated
- Nothing deprecated. All v8.0.0 content preserved.

---

## TABLE OF CONTENTS (v9.0.0 additions only)

1. [RUWA Repo Health Monitor](#1-ruwa-repo-health-monitor)
2. [File Ownership in the Feature DAG](#2-file-ownership-in-the-feature-dag)
3. [RUWA Monitoring Mode (Partial Adoption)](#3-ruwa-monitoring-mode)
4. [Scope Change Protocol](#4-scope-change-protocol)
5. [Feature Removal Protocol](#5-feature-removal-protocol)
6. [Project Management Documents (Generated Files)](#6-project-management-documents)
7. [Updated Feature Spec Structure (Files Owned Field)](#7-updated-feature-spec-structure)
8. [New Generation Invariants (61–68)](#8-new-generation-invariants)

---

## 1. RUWA REPO HEALTH MONITOR

RUWA runs a lightweight health monitor before every feature start and on every `git pull`. This is embedded in `context/ai-workflow-rules.md`.

```
RUWA REPO HEALTH CHECK (runs before Feature N begins):

1. git fetch origin — what has changed on main since last merge?
2. git log --oneline origin/main..HEAD — our branch changes
3. git log --oneline HEAD..origin/main — others' changes to main

For each commit others added to main:
  CLASSIFY: does it touch files in our current feature's scope?
  CLASSIFY: does it touch shared libraries we depend on?
            (package.json, shared types, Prisma schema, shared utils)
  CLASSIFY: does it break our current branch build?

Run: npm run build → does the build still pass?
Run: npm run test → do our tests still pass?
```

### When Upstream Change Breaks the Branch

```
RUWA reports:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UPSTREAM CHANGE BROKE CURRENT BRANCH — HUMAN REVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SOURCE:    commit a1b2c3d by @otherdev, merged to main 2h ago
CHANGE:    Modified lib/db/client.ts — changed getConnection() signature
IMPACT:    Feature 05 calls getConnection() — 3 TypeScript errors
BUILD:     ✗ FAIL

MY ANALYSIS:
  Option A: Patch our call to match their new signature (5 min fix)
  Option B: Open a discussion on their PR (they should fix it)
  Option C: Pause Feature 05 and wait for team sync

I recommend Option A — their change looks intentional.
I can apply the patch now.

[Apply patch now]  [Open discussion]  [Pause]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**RUWA never silently patches upstream changes.** It always reports what it found, what it proposes to do, and why. Human approves before RUWA touches any code introduced by another developer.

---

## 2. FILE OWNERSHIP IN THE FEATURE DAG

Foundrie assigns file ownership per feature spec during Phase 7 (Feature Spec Generation). This is an extension of the Feature Dependency Graph (v6.0.0 §3.10).

### Ownership Rules

```
FEATURE DAG WITH FILE OWNERSHIP:

Feature 05 — Authentication
  Owns: src/lib/auth/*, app/api/auth/*, middleware.ts

Feature 06 — Database Schema
  Owns: prisma/schema.prisma, prisma/migrations/*, lib/db/*

Feature 07 — User CRUD
  Owns: app/api/users/*, src/lib/users/*
  Reads (not owns): prisma schema (owned by Feature 06)

OWNERSHIP RULES:
  No two ACTIVE feature specs may own the same file.
  A feature that needs a file owned by another active feature
  must wait for that feature to complete and merge first.
  This is enforced by the feature DAG ordering.
```

### Conflict Prevention at Planning Time

If two features touch the same file, Foundrie resolves it at Phase 7 — before RUWA ever runs:
- **Reorder**: Make one depend on the other (adds a DAG edge).
- **Split ownership**: Each feature owns a different part of the file (e.g., different functions, or different lines of a config).
- **Merge features**: If the overlap is 80%+, consolidate into one feature spec.

This prevents merge conflicts at build time by eliminating them at planning time.

---

## 3. RUWA MONITORING MODE (PARTIAL ADOPTION)

For Topology 2 teams (v7.0.0 §5): RUWA watches `main` for external changes that affect its active feature scope.

Added to `context/ai-workflow-rules.md` for Topology 2 projects:

```markdown
## RUWA Monitoring Mode

On every `git pull origin main`:
  RUWA runs: git diff HEAD..origin/main
  RUWA classifies each changed file:
    - In active feature spec scope → FLAG for human review
    - Not in active feature spec scope → log, no action needed
    - Conflicts with current feature branch → HALT, report to human

RUWA never:
  - Auto-merges changes from other developers
  - Resolves conflicts on behalf of other developers
  - Continues feature implementation while the build is broken

RUWA always:
  - Shows the full diff of the conflicting change
  - Explains why it's flagged (in-scope vs build-breaking)
  - Presents options (incorporate / reject / pause / discuss)
  - Waits for human decision before proceeding
```

---

## 4. SCOPE CHANGE PROTOCOL

### Trigger Conditions

Mid-development requirement changes fall into three categories:
1. **Addition**: Client wants a new feature added (e.g., "add a subscription tier system").
2. **Removal**: Client wants an existing feature removed (e.g., "remove team collaboration").
3. **Redesign**: Client wants an existing feature significantly changed (e.g., "redesign the dashboard").

### Impact Analysis (Foundrie's Response to Any Scope Change)

```
SCOPE CHANGE IMPACT ANALYSIS:

REQUESTED CHANGE: Add subscription tier system

COMPLETED FEATURES AFFECTED: None
IN-PROGRESS FEATURES AFFECTED: Feature 08 (partial overlap)
PENDING FEATURES AFFECTED: Features 09, 11, 14 (dependencies change)

NEW FEATURES NEEDED:
  - Feature 08b: Stripe Billing Setup
  - Feature 08c: Subscription Tier Enforcement
  - Feature 08d: Subscription Management UI

DIAGRAMS NEEDING UPDATE:
  - 04-erd.dbml (new subscriptions table)
  - 05-sequence-payment-flow.mermaid (checkout flow changes)
  - 02-container.svg (Stripe integration added)

TIMELINE IMPACT: +8–12 days estimated
COST IMPACT: +Stripe API costs (~$0 dev, 0.25% + $0.10/transaction prod)

Would you like to proceed with this scope change?
[Yes, regenerate affected specs]  [No, document only as rejected request]
```

### What Happens on Approval

1. Foundrie updates all affected diagrams (creates new diagram versions — v6.0.0 §5).
2. Foundrie regenerates all affected feature specs.
3. Foundrie generates new feature specs for additions.
4. Foundrie updates `project-management/CHANGE_LOG.md` with the change record.
5. Foundrie generates an ADR documenting the scope change decision (v5.0.0 §2).
6. All modified specs are flagged in `progress-tracker.md` as "REVISED — re-review required."

---

## 5. FEATURE REMOVAL PROTOCOL

### Case 1: Feature is NOT STARTED

```
Foundrie marks it CANCELLED in progress-tracker.md.
Feature spec moved to feature-specs/cancelled/.
No code exists. Nothing to undo.
```

### Case 2: Feature is IN PROGRESS (RUWA mid-implementation)

```
RUWA pauses immediately when notified.

RUWA reports:
  "Feature [N] has been cancelled.
   I have [X] files in progress on branch feature/NN-name.
   Options:
   [Delete all files and revert branch]
   [Commit current state as a draft and archive the branch]"

Human chooses. RUWA executes.
```

### Case 3: Feature is COMPLETE (merged to main)

This is the most complex case. Dead code cannot be left in the codebase.

**Foundrie generates a new "removal" feature spec**:

```markdown
# Feature NN-removal — Remove [Feature Name]

**Feature**: NN-removal
**Name**: Remove Subscription Tier System
**Type**: REMOVAL (removes Feature 08, 08b, 08c, 08d)
**Branch**: feature/NN-remove-subscriptions

## Objective
Remove the subscription tier feature and all related code, leaving
the codebase in a clean state with no dead references.

## Files to Delete
[Exact list of all files created by the removed features]

## Files to Modify
[Exact paths + what imports, references, and routes to remove]

## Implementation Notes
- Remove Stripe from package.json and any Stripe API calls
- Remove subscriptions table migration (create down migration)
- Remove subscription-related UI routes and components
- Run: grep -r "subscription" src/ to find any remaining references

## Acceptance Criteria
- [ ] `npm run build` passes with zero TypeScript errors
- [ ] No dead imports: `npx ts-unused-exports` returns zero
- [ ] grep -r "subscription" src/ returns zero results
- [ ] Database migration runs cleanly in both directions
```

This creates a clean git history: `feat: remove subscription tier system` — not scattered dead code.

---

## 6. PROJECT MANAGEMENT DOCUMENTS (GENERATED FILES)

All four files are generated by Foundrie in Phase 8 (ZIP Assembly) and placed in `project-management/`.

### SCOPE.md

```markdown
# Project Scope

## In Scope
[Auto-generated from all feature spec names — one line per feature]

## Out of Scope
[Auto-generated from all feature spec "Out of Scope" sections — consolidated]

## Assumptions
[Auto-generated from architecture decisions and tech choices in discovery]

## Constraints
[Timeline, budget tier, team size, compliance requirements]

## Change Request Process
Any scope change triggers Foundrie's Impact Analysis before work begins.
An updated SCOPE.md, TIMELINE.md, PRICING.md, and CHANGE_LOG.md are
generated on every approved scope change.
```

### TIMELINE.md

```markdown
# Project Timeline

**Estimated Start**: [date of ZIP download]
**Estimated Completion**: [start + sum of feature estimates]

| Feature | Estimate | Depends On | Assigned To | Status |
|---|---|---|---|---|
| 01 Design System | 1–2 days | None | — | NOT STARTED |
| 02 Authentication | 1–2 days | None | — | NOT STARTED |
[... all features with estimates]

**Methodology**: RUWA implements one feature per day on average.
Complex features (AI integration, real-time, payments): 2 days.
Simple features (CRUD, UI components): 0.5–1 day.
```

### PRICING.md

```markdown
# Cost Estimation

## Monthly Running Costs (Infrastructure)

| Service | Plan | Monthly Cost |
|---|---|---|
| Vercel (hosting) | Hobby (free) → Pro ($20/mo at scale) | $0–$20 |
| Neon Postgres | Free (0.5 GB) → Launch ($19/mo) | $0–$19 |
| Clerk (auth) | Free (10K MAU) → Pro ($25/mo) | $0–$25 |
| Trigger.dev (jobs) | Free (50K runs) → Hobby ($5/mo) | $0–$5 |
| Anthropic API (AI) | Pay-per-use | $[estimated from token usage] |

**Total at launch (free tier)**: $0/month
**Total at scale (1K+ users)**: $69–$89/month estimated

NOTE: Service tier preferences were captured during discovery Phase 5.
      All estimates reflect your stated preference: [free / paid / hybrid].
```

### CHANGE_LOG.md

```markdown
# Change Log

## [YYYY-MM-DD] — Initial Scope
Features: [count] (see TIMELINE.md)
Timeline: [range] days estimated

## [YYYY-MM-DD] — Change Request 01: [Title]
Requested by: [Client / Engineer]
Impact: [+N features, +M diagram updates, +X days]
Status: Approved / Rejected
[If approved: links to updated specs and diagrams]
```

---

## 7. UPDATED FEATURE SPEC STRUCTURE (FILES OWNED FIELD)

The feature spec structure from v1.0.0 §8.1 gains one new required field:

```markdown
# Feature NN — [Feature Name]

**Feature**: NN
**Name**: [descriptive name]
**Type**: NEW FEATURE | MODIFICATION | REMOVAL
**Depends on**: Feature MM (or "None")
**Branch**: feature/NN-feature-slug

## Files Owned                          ← [NEW FIELD — v9.0.0]
[Exact paths this feature exclusively owns.
 No other active feature spec may modify these files while this spec is active.]

## Files to Create
[Exact paths relative to project root]

## Files to Modify
[Exact paths + what changes in each]

[... rest of spec structure unchanged from v1.0.0 §8.1]
```

---

## 8. NEW GENERATION INVARIANTS (61–68)

These are **additions** to invariants 1–60. All prior invariants remain in force.

61. Every generated project ZIP includes `project-management/SCOPE.md`, `TIMELINE.md`, `PRICING.md`, and `CHANGE_LOG.md`. These files are not optional.
62. Every feature spec includes a `Files Owned` field. Foundrie ensures no two active feature specs declare ownership of the same file.
63. Any mid-development scope change triggers Foundrie's Impact Analysis before any spec is regenerated. The human must approve the impact report before work begins.
64. Feature removal from a COMPLETE (merged) feature always generates a new "removal" feature spec. Dead code is never left in the codebase.
65. RUWA never silently patches changes made by other developers. Every external change to an in-scope file is reported to the human with options before any action is taken.
66. RUWA runs a repo health check (git fetch + build + test) before every feature start. A broken build due to upstream changes is reported and resolved before the feature begins.
67. `project-management/CHANGE_LOG.md` is updated by Foundrie on every approved scope change, including: date, requester, impact summary, feature delta, timeline delta, and cost delta.
68. Scope change decisions (approved or rejected) are recorded in an ADR (v5.0.0 §2). The Impact Analysis output is attached as the ADR's context section.

---

*Foundrie AI v9.0.0 — Repo health monitor, file ownership, RUWA monitoring mode, scope change protocol, feature removal, and project management document generation (SCOPE, TIMELINE, PRICING, CHANGE_LOG)*
*See FOUNDRIE_V10_0_0.md for Figma bidirectional integration, large file handling, file security pipeline, and intelligent suggestions (hidden requirements, Socratic levels, proactive warnings)*
