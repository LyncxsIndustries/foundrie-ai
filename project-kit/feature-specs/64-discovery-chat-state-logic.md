# Feature 64 - Discovery Chat State & Logic

## Type

ENHANCEMENT

## What This Delivers

Fixes the state management logic for Discovery Chat to track completion status, count messages accurately, and implement dynamic stopping conditions. The AI adapts its question depth based on project complexity (SIMPLE: 5-10 messages, STANDARD: 15-25 messages, COMPLEX: 30+ messages). The system tracks "DONE" state in the database, enables accurate chat resumption, and exposes the "Generate Requirements" button only when chat is complete. After this feature, Discovery Chat behaves as a structured conversation with clear endpoints.

## Dependencies

- Feature 10 (Discovery Chat) - base chat implementation
- Feature 53 (Dynamic Phase Completion) - complexity classification logic
- Feature 63 (Discovery Chat UI Fixes) - UI refinements
- Feature 05 (AI Rotation Engine) - AI orchestration

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `research/FOUNDRIE_RESEARCH.md` (v15.0.0 dynamic phase completion)
- `context/code-standards.md`
- `context/ai-workflow-rules.md`

## Context7 Docs To Check

```bash
npx ctx7 library prisma "update model fields and relations"
npx ctx7 library next.js "server actions and optimistic updates"
```

## Files Owned

- `lib/conversations/completion.ts` (NEW)
- `app/api/conversations/[projectId]/complete/route.ts` (NEW)
- `app/api/conversations/[projectId]/resume/route.ts` (NEW)
- `app/api/conversations/[projectId]/complete-update/route.ts` (NEW)
- `app/api/conversations/[projectId]/rollback/route.ts` (NEW)
- `app/api/conversations/[projectId]/versions/route.ts` (NEW)
- `app/api/conversations/[projectId]/status/route.ts` (NEW)

## Files

CREATE: `lib/conversations/completion.ts` - conversation versioning and completion helpers
CREATE: `app/api/conversations/[projectId]/complete/route.ts` - mark conversation done
CREATE: `app/api/conversations/[projectId]/resume/route.ts` - resume for updates (creates new version)
CREATE: `app/api/conversations/[projectId]/complete-update/route.ts` - complete an update session
CREATE: `app/api/conversations/[projectId]/rollback/route.ts` - restore previous version
CREATE: `app/api/conversations/[projectId]/versions/route.ts` - list all snapshots
CREATE: `app/api/conversations/[projectId]/status/route.ts` - get conversation state
MODIFY: `prisma/schema.prisma` - add isDone, messageCount, completionReason, currentVersion, activeVersionId to Conversation model
MODIFY: `lib/conversations/store.ts` - increment messageCount on each message
MODIFY: `app/api/conversations/[projectId]/chat/route.ts` - block messages when isDone=true
MODIFY: `app/api/requirements/[projectId]/generate/route.ts` - mark conversation done before triggering
MODIFY: `lib/ai/prompts/discovery.ts` - add dynamic stopping logic based on message count and complexity
MODIFY: `trigger/streaming-chat.ts` - pass conversation state to AI for adaptive completion
UPDATE: `app/api/conversations/[projectId]/completion.test.ts` - test versioning and completion logic

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract, update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch.

### Database Schema Updates

```prisma
model Conversation {
  // ... existing fields
  
  // Chat completion state (Feature 64)
  isDone            Boolean @default(false)  // Conversation marked complete
  messageCount      Int     @default(0)      // Running count of messages
  completionReason  String?                  // "user_generated_requirements" | "auto_completed" | "discarded"
  currentVersion    Int     @default(1)      // Current version number (V1, V2, etc.)
  activeVersionId   String?                  // ID of the active snapshot, null = using live messages
  
  snapshots         ConversationSnapshot[]   // Versioned snapshots
  
  // ... existing relations
}

// Versioned snapshots of conversation state (Feature 64).
// Created when user marks conversation as "done" or creates an "update".
model ConversationSnapshot {
  id             String   @id @default(cuid())
  conversationId String
  version        Int      // V1, V2, V3, etc.
  messageCount   Int      // Messages at time of snapshot
  snapshotReason String   // "initial_completion" | "project_update"
  label          String?  // Optional user-provided label
  messageIds     String[] // Array of message IDs included in this version

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@unique([conversationId, version])
  @@index([conversationId, version])
}
```

### Completion Helpers

```typescript
// lib/conversations/completion.ts
export type CompletionReason = "user_generated_requirements" | "auto_completed" | "discarded";
export type SnapshotReason = "initial_completion" | "project_update";

export async function markConversationDone(
  projectId: string,
  reason: CompletionReason,
  label?: string
): Promise<{ success: true; version: number } | { success: false; error: string }>

export async function resumeConversationForUpdate(
  projectId: string
): Promise<{ success: true; newVersion: number } | { success: false; error: string }>

export async function completeUpdateSession(
  projectId: string,
  label?: string
): Promise<{ success: true; version: number } | { success: false; error: string }>

export async function rollbackToVersion(
  projectId: string,
  targetVersion: number
): Promise<{ success: true; restoredVersion: number } | { success: false; error: string }>

export async function getConversationVersions(projectId: string): Promise<ConversationSnapshot[]>

export async function getConversationStatus(projectId: string): Promise<{
  isDone: boolean;
  messageCount: number;
  currentVersion: number;
  completionReason: string | null;
  activeVersionId: string | null;
} | null>
```

### API Routes

- **POST `/api/conversations/[projectId]/complete`**: Mark conversation done (creates V1 snapshot)
- **POST `/api/conversations/[projectId]/resume`**: Resume for updates (increments version, marks undone)  
- **POST `/api/conversations/[projectId]/complete-update`**: Complete an update session (creates new snapshot)
- **POST `/api/conversations/[projectId]/rollback`**: Restore previous version (requires `version` in body)
- **GET `/api/conversations/[projectId]/versions`**: List all snapshots
- **GET `/api/conversations/[projectId]/status`**: Get conversation state (isDone, messageCount, currentVersion)

### Dynamic Stopping Logic

- **SIMPLE projects**: Stop after 5-10 messages when core requirements are clear
- **STANDARD projects**: Stop after 15-25 messages when architecture is defined
- **COMPLEX projects**: Stop after 30+ messages when all subsystems are understood

Use semantic analysis of message content to detect when sufficient information is gathered.

## Out of Scope

- Requirements generation logic (Feature 11)
- Requirements page integration (Feature 65)
- UI refinements beyond state display (Feature 63)
- Multi-user collaboration on discovery

## Future Modifications

- Feature 65 (Requirements Page Integration) - uses discoveryStatus to show/hide buttons
- Feature 71 (AI Rotation Models) - may enhance complexity detection with better models

## Quality Gates

- Run `npm run sync:check` and ensure it passes
- Run `npm run security:all` and ensure it passes  
- Run `npm run test` and ensure it passes
- Run `npm run build` and ensure it passes

## Acceptance Criteria

- [x] Conversation model includes isDone, messageCount, completionReason, currentVersion, activeVersionId fields
- [x] ConversationSnapshot model exists with version, messageCount, snapshotReason, label, messageIds fields
- [x] Message count increments on each conversation message (tracked in store.ts)
- [x] POST `/api/conversations/[projectId]/complete` marks conversation done and creates V1 snapshot
- [x] POST `/api/conversations/[projectId]/resume` resumes done conversations for updates (creates V2, V3, etc.)
- [x] POST `/api/conversations/[projectId]/complete-update` completes update sessions with new snapshot
- [x] POST `/api/conversations/[projectId]/rollback` restores previous versions
- [x] GET `/api/conversations/[projectId]/versions` lists all snapshots
- [x] GET `/api/conversations/[projectId]/status` returns conversation state
- [x] Chat POST route blocks new messages when isDone=true
- [x] Requirements generation marks conversation done before triggering
- [x] Discovery AI prompt includes dynamic stopping logic (SIMPLE 5-10, STANDARD 15-25, COMPLEX 30+ messages)
- [x] Streaming chat task fetches conversation state and passes to AI for adaptive completion
- [x] "Discard chat" marks completionReason as "discarded"
- [x] State persistence survives page refresh
- [x] All state transitions are tested (9 tests in completion.test.ts)
- [x] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at Feature 65
- [x] All quality gates pass (sync:check, security:all, test, build)
- [ ] CodeRabbit review completed and all findings resolved (recommended quality gate)

## Setup Instructions

No new external accounts or API keys required. This feature extends existing Prisma schema and discovery logic.

After implementing schema changes:
```bash
npm run db:generate
npm run db:migrate
```

For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
