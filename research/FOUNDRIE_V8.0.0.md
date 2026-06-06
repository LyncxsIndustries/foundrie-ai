# FOUNDRIE AI — Research & Operating Specification
## Version 8.0.0

**Version**: 8.0.0
**Release Date**: 2026-05-19
**Status**: Superseded by v9.0.0
**Previous Version**: 7.0.0
**Base**: All v1.0.0 through v7.0.0 content remains in force. This version only documents what changes.
**Purpose**: Specify the multi-user collaborative canvas, the AI input queue state machine, session roles, LangGraph PostgresSaver autosave, electricity-loss recovery, diagram and spec rollback, and client-side + server-side idempotency guarantees.
**Source Research**: FOUNDRIE-RUWA-PATCH.md §§4, 5

---

## CHANGELOG — v8.0.0

### New [NEW]
- Multi-user canvas specification: shared view, cursor presence, sticky-note annotations, edit lock rules.
- AI input queue state machine: FREE → TYPING → SUBMITTED → RUNNING → BATCH_TAKEN — full transition rules and "still typing" protection.
- Batch-mode queuing rationale: why batching outperforms sequential processing for collaborative sessions.
- Voting / designated-responder model for AI questions requiring a single answer.
- Session roles: Session Owner, Co-Editor, Viewer, Guest — permissions per role.
- RUWA collaboration model: feature allocation, parallel branch safety, cross-instance file conflict detection.
- LangGraph PostgresSaver autosave: checkpoint granularity (every AI turn, every diagram, every spec draft, every human edit).
- Power-loss recovery: solo session recovery, collaborative session recovery — both fully specified.
- Diagram rollback, spec rollback, and conversation branch rollback.
- Client-side idempotency (`useIdempotentAction` hook) and server-side deduplication (Rust `IdempotencyStore`).
- Idempotency rules embedded in `context/code-standards.md` for all generated projects (payment initiation, email sends, DB writes, UI buttons).
- Generation invariants 52–60 added.

### Changes to Existing Content
- **Foundrie AI Layer (v2.0.0 §5)**: LangGraph now uses `PostgresSaver` checkpointing in all sessions (not just agentic projects). Every discovery session is resumable after crash or power loss.
- **Discovery Protocol (v6.0.0 §2)**: Phase 6 (Architecture Diagramming) now specifies that each diagram generation is a LangGraph checkpoint. If power is lost mid-diagram, generation resumes from the last completed diagram node.

### Deprecated
- Nothing deprecated. All v7.0.0 content preserved.

---

## TABLE OF CONTENTS (v8.0.0 additions only)

1. [Multi-User Canvas](#1-multi-user-canvas)
2. [AI Input Queue State Machine](#2-ai-input-queue-state-machine)
3. [Session Roles](#3-session-roles)
4. [RUWA Collaboration Model](#4-ruwa-collaboration-model)
5. [Autosave Architecture (LangGraph PostgresSaver)](#5-autosave-architecture)
6. [Power-Loss Recovery](#6-power-loss-recovery)
7. [Rollback — Diagrams, Specs, and Conversations](#7-rollback)
8. [Idempotency — Client and Server](#8-idempotency)
9. [New Generation Invariants (52–60)](#9-new-generation-invariants)

---

## 1. MULTI-USER CANVAS

Every Foundrie session has a shared canvas powered by Liveblocks (v2.0.0 TypeScript stack). All collaborators see simultaneously:
- The discovery conversation in real time.
- Diagrams being built live as the AI generates them (Phase 6 of v6.0.0).
- Each other's cursor positions (Liveblocks presence).
- Who currently "holds" the input (the active speaker).
- The feature spec list being assembled.

### Canvas Access Rules

| Action | Who Can Do It |
|---|---|
| Pan and zoom the diagram canvas | Any collaborator, any time |
| Add sticky-note annotation to a diagram node | Any collaborator |
| Highlight a diagram element | Any collaborator |
| Edit diagram nodes (move, add connections) | Session Owner or Co-Editor only |
| Send messages to the AI | Session Owner or Co-Editor |
| Approve architecture | Session Owner only |
| Download ZIP | Session Owner (Co-Editor with owner approval) |

---

## 2. AI INPUT QUEUE STATE MACHINE

This is the most operationally complex part of collaborative sessions.

### States

```
FREE        → no one is typing, AI is idle
TYPING      → a user is composing input (field locked for others)
SUBMITTED   → user sent message, AI is processing
RUNNING     → AI is generating response (field in queue mode)
BATCH_TAKEN → AI took all queued messages, processing as a batch
```

### Transition Rules

```
FREE → TYPING:
  First user to click the input field claims it.
  All others see: "[Username] is typing..."
  Input field is visually locked for others (grayed border, disabled cursor).
  All others see a "Queue your message" input above the main field.

TYPING → SUBMITTED:
  User hits Enter or clicks Send.
  Field returns to QUEUE MODE. AI begins processing.

SUBMITTED → RUNNING:
  AI starts generating (streaming tokens visible on canvas).
  Any user can type and submit to the queue.
  Queued messages stack: "Queue (3 pending)"

RUNNING → BATCH_TAKEN:
  AI finishes its current generation.
  AI picks up ALL queued messages at once and addresses them together.
  Example: "Alex asked about auth, Sam asked about the DB schema —
            let me address both."

BATCH_TAKEN → RUNNING:
  AI processes the batch, streams response.
  Queue empties. New messages can be added immediately.

RUNNING → FREE (if queue is empty):
  AI finishes. No queue. Field is FREE. First to click claims it.
```

### "Still Typing" Protection

If a user is mid-composition when the AI finishes and takes the batch:
- Their in-progress message is **not** taken.
- They see: "AI just picked up the batch. Your message will go in the next round."
- Their draft is preserved in the queue box.
- When they submit, it becomes the first item in the new queue.

### Why Batch Mode Outperforms Sequential

Sequential: O(N) round trips for N collaborators. With 5 users, each question takes 5× as long.

Batch: AI takes all pending questions at once. Response is richer (it sees how questions relate), and latency per user drops dramatically. One generation serves all.

### AI Questions Requiring a Single Answer

When the AI asks a question with mutually exclusive answers (e.g., "What is your expected user scale at launch?"), the UI surfaces a voting widget:

```
AI: "What is your expected user scale at launch?"

UI shows to all collaborators:
  Option A: "< 1,000 users" (Sarah's vote)
  Option B: "1,000–10,000 users" (Alex's vote)
  Option C: "> 10,000 users"
  [Write custom answer]

  SESSION OWNER has final say after 30 seconds.
  If no response in 30s: SESSION OWNER is pinged.
```

---

## 3. SESSION ROLES

| Role | Permissions |
|---|---|
| **Session Owner** | Full control. Approves architecture. Downloads ZIP. Locks/unlocks collaborators. Final say on all decisions. |
| **Co-Editor** | Sends messages to AI. Edits diagram nodes. Cannot download ZIP without owner approval. Cannot approve architecture. |
| **Viewer** | Read-only. Sees canvas, conversation, diagrams. Adds sticky-note annotations. Cannot interact with AI. |
| **Guest** | Time-limited Viewer access (expires in 24h). For client or stakeholder reviews. |

---

## 4. RUWA COLLABORATION MODEL

RUWA executes sequentially — one feature at a time. Collaboration means multiple engineers each running their own RUWA instance on parallel feature branches.

### Feature Allocation Protocol

Foundrie allocates features to engineers during Phase 7 (Feature Spec Generation):

```
Feature 05: assigned to Engineer A → branch: feature/05-payments
Feature 06: assigned to Engineer B → branch: feature/06-notifications
Feature 07: assigned to Engineer C → branch: feature/07-user-crud

Each engineer runs RUWA independently on their own machine.
All RUWA instances read the same Foundrie ZIP — same truth, different features.
The Feature DAG (v6.0.0) ensures no two assigned features overlap in scope.
```

Feature allocation is recorded in `context/progress-tracker.md`:

```markdown
| # | Feature | Assigned To | Branch | Status |
|---|---|---|---|---|
| 05 | Payments | engineer-a | feature/05-payments | IN PROGRESS |
| 06 | Notifications | engineer-b | feature/06-notifications | NOT STARTED |
```

### Cross-Instance File Conflict Detection

RUWA detects when two parallel branches would touch the same file:

```
RUWA detects: feature/06 and feature/07 both modify lib/db/client.ts

RUWA reports:
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PARALLEL BRANCH CONFLICT RISK
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  FILE:    lib/db/client.ts
  ALSO MODIFIED BY: feature/06 (Engineer B)
  RECOMMENDATION: Coordinate before pushing. One of you should
                   wait for the other to merge first.
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 5. AUTOSAVE ARCHITECTURE (LANGGRAPH POSTGRESSAVER)

Every Foundrie session uses LangGraph's `PostgresSaver` for checkpointing. This is extended from v2.0.0's Python AI layer.

```python
from langgraph.checkpoint.postgres import PostgresSaver

checkpointer = PostgresSaver.from_conn_string(os.environ["DATABASE_URL"])
app = workflow.compile(checkpointer=checkpointer)

# Every node execution writes a checkpoint automatically.
# If power fails mid-session: LangGraph restores from last checkpoint.
# No data loss beyond the current in-progress turn.
```

### Checkpoint Granularity

| Event | Checkpoint Written |
|---|---|
| Every AI response turn | ✅ |
| Every diagram generation | ✅ + diagram stored in Vercel Blob |
| Every feature spec draft | ✅ |
| Every human edit to a spec | ✅ with diff (undo history) |
| Every diagram approval | ✅ with approval timestamp |

---

## 6. POWER-LOSS RECOVERY

### Solo Session Recovery

```
User reopens Foundrie (any device — web or Tauri desktop).

Session detected: "You have an active session for [Project Name]."

Options:
  [Resume from where I left off]
  [Review session history]
  [Discard and start over]

On resume:
  LangGraph loads the last checkpoint.
  Conversation history rendered exactly as it was.
  Any mid-generation diagram is re-rendered from last complete state.
  Engineer continues as if nothing happened.
```

### Collaborative Session Recovery (All Collaborators Lose Power)

```
Session lives in Neon Postgres (cloud) — not on any local machine.

All collaborators independently reconnect.
First collaborator to reconnect becomes acting Session Owner.
When all collaborators reconnect: full session state is restored.
The AI's last response is re-displayed.
Any in-progress diagram generation resumes from the last completed node.
```

---

## 7. ROLLBACK — DIAGRAMS, SPECS, AND CONVERSATIONS

### Diagram Rollback

```
Human: "Go back to the ERD before I approved the subscription change."

Foundrie restores the diagram to that checkpoint version (diagrams/v1/04-erd.dbml).
All feature specs derived from the changed diagram are marked "needs re-review."
The progress-tracker.md diagram version log is updated.
```

### Feature Spec Rollback

```
Human: "Revert Feature 08 to the version before I added multi-tenant support."

Foundrie restores the spec to the specified checkpoint.
RUWA is notified if it has already begun implementing the changed spec.
```

### Conversation Branch Rollback (Architecture Exploration)

```
Human: "What if I went monolith instead of microservices?
        Let's explore that branch."

Foundrie creates a branch checkpoint from the current conversation state.
Foundrie explores the monolith architecture in the branch.
Human can compare the two architecture outcomes side by side on the canvas.
Human selects which branch to continue from.
The rejected branch is preserved in session history (not deleted).
```

---

## 8. IDEMPOTENCY — CLIENT AND SERVER

### The Problem

Any user action that triggers an AI request (send message, Generate ZIP, Approve Architecture) must not fire twice if clicked twice. No duplicate ZIP generations. No duplicate session starts. No double-charged LLM API calls.

### Client-Side Idempotency Hook

```typescript
// Foundrie web app — React (TypeScript)
function useIdempotentAction<T>(action: () => Promise<T>) {
  const pendingRef = useRef<string | null>(null);

  return async () => {
    if (pendingRef.current !== null) {
      // Action already in flight — ignore this click
      return;
    }
    const idempotencyKey = crypto.randomUUID();
    pendingRef.current = idempotencyKey;
    try {
      await action();
    } finally {
      pendingRef.current = null;
    }
  };
}

// Usage:
const sendMessage = useIdempotentAction(async () => {
  await foundrie.send(message, { idempotencyKey: currentKey });
});
```

### Server-Side Deduplication (Rust)

```rust
// idempotency_store.rs — Rust Axum middleware
pub struct IdempotencyStore {
    cache: RwLock<HashMap<String, CachedResponse>>,
    ttl: Duration,
}

impl IdempotencyStore {
    pub async fn check_or_run<F, R>(&self, key: &str, f: F) -> R
    where F: Future<Output = R>
    {
        {
            let cache = self.cache.read().await;
            if let Some(cached) = cache.get(key) {
                if cached.timestamp.elapsed() < self.ttl {
                    return cached.response.clone(); // return cached, skip re-run
                }
            }
        }
        let result = f.await;
        self.cache.write().await.insert(key.to_string(), CachedResponse {
            response: result.clone(),
            timestamp: Instant::now(),
        });
        result
    }
}
```

### Idempotency Rules in Generated `context/code-standards.md`

Every Foundrie-generated project's `context/code-standards.md` includes:

```markdown
## Idempotency Rules

Every write operation a user might retry must be idempotent:
  - Stripe payment initiation: use Stripe idempotency_key header
  - Email sends: check sent_at before sending (never send twice)
  - Database writes: use upsert, not insert + catch duplicate-key error
  - Background job triggers: Trigger.dev tasks are idempotent by task ID
  - API mutations: check if resource already exists before creating

UI rules:
  - All buttons disable immediately on click until response received
  - Loading states prevent re-submission
  - Forms: disable submit button on submit, re-enable only on error
  - Never show a spinner AND leave the button enabled simultaneously
```

---

## 9. NEW GENERATION INVARIANTS (52–60)

These are **additions** to invariants 1–51. All prior invariants remain in force.

52. LangGraph PostgresSaver checkpoints every turn, diagram generation, and spec draft in all Foundrie sessions (not just agentic projects). Sessions are always resumable.
53. Every diagram is versioned. Rollback to any prior diagram version is supported. The `progress-tracker.md` diagram version log records which version each feature spec was written from.
54. Conversation branch rollback (architecture exploration) preserves both branches. The rejected branch is never deleted from session history.
55. All UI buttons in Foundrie and in all generated web apps disable immediately on click and re-enable only on error. This is an acceptance criterion in every UI feature spec.
56. All Foundrie session actions (send message, Generate ZIP, Approve Architecture) are protected by a client-side `useIdempotentAction` hook and a server-side `IdempotencyStore`. Duplicate requests are deduplicated at the Rust API layer.
57. Feature allocation for parallel RUWA instances is recorded in `context/progress-tracker.md`. Foundrie generates the allocation table during Phase 7.
58. Session Owner role is always established before any Foundrie session begins. A session without an Owner cannot proceed to Phase 6 (Architecture Diagramming).
59. Idempotency rules (Stripe key, email guard, upsert, job ID, button disable) are always embedded in `context/code-standards.md`. They are acceptance criteria in payment and mutation feature specs.
60. Power-loss recovery is verified by Foundrie at session start: if an active unfinished session exists for the engineer, the resume prompt is shown before a new session can be started.

---

*Foundrie AI v8.0.0 — Multi-user canvas, AI input queue state machine, session roles, LangGraph PostgresSaver autosave, power-loss recovery, diagram/spec rollback, and idempotency*
*See FOUNDRIE_V9_0_0.md for codebase corruption handling, file ownership in the feature DAG, the scope change protocol, and project management document generation*
