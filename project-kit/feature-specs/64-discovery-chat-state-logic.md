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

- `lib/discovery/state-manager.ts` (NEW)
- `lib/discovery/completion-detector.ts` (NEW)

## Files

CREATE: `lib/discovery/state-manager.ts` - chat state tracking and persistence
CREATE: `lib/discovery/completion-detector.ts` - dynamic completion detection
MODIFY: `prisma/schema.prisma` - add discoveryStatus, messageCount, projectComplexity to Project model
MODIFY: `components/discovery/DiscoveryChat.tsx` - integrate state management
MODIFY: `app/api/discovery/message/route.ts` - update state on each message
MODIFY: `app/api/discovery/complete/route.ts` - handle chat completion
UPDATE: `lib/discovery/state-manager.test.ts` - test state transitions
UPDATE: `lib/discovery/completion-detector.test.ts` - test completion logic

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract, update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch.

### Database Schema Updates

```prisma
model Project {
  // ... existing fields
  
  // Discovery state tracking
  discoveryStatus    DiscoveryStatus @default(NOT_STARTED)
  messageCount       Int              @default(0)
  projectComplexity  ProjectComplexity @default(STANDARD)
  discoveryCompletedAt DateTime?
  
  // ... existing relations
}

enum DiscoveryStatus {
  NOT_STARTED
  IN_PROGRESS
  DONE
  DISCARDED
}

enum ProjectComplexity {
  SIMPLE    // 3-4 phases, 5-10 messages
  STANDARD  // 6-7 phases, 15-25 messages
  COMPLEX   // 8 phases, 30+ messages
}
```

### State Manager

```typescript
// lib/discovery/state-manager.ts
export class DiscoveryStateManager {
  async incrementMessageCount(projectId: string): Promise<number>
  async markComplete(projectId: string): Promise<void>
  async markDiscarded(projectId: string): Promise<void>
  async canResume(projectId: string): Promise<boolean>
  async getState(projectId: string): Promise<DiscoveryState>
}
```

### Completion Detector

```typescript
// lib/discovery/completion-detector.ts
export class CompletionDetector {
  detectComplexity(messages: Message[]): ProjectComplexity
  shouldComplete(messageCount: number, complexity: ProjectComplexity, latestMessage: string): boolean
  analyzeMessageDepth(messages: Message[]): number
}
```

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

- [ ] Prisma schema includes discoveryStatus, messageCount, projectComplexity fields
- [ ] Message count increments on each discovery message
- [ ] Project complexity is auto-detected based on message content
- [ ] Dynamic stopping condition prevents endless questioning
- [ ] SIMPLE projects complete after 5-10 messages
- [ ] STANDARD projects complete after 15-25 messages
- [ ] COMPLEX projects complete after 30+ messages
- [ ] discoveryStatus transitions: NOT_STARTED → IN_PROGRESS → DONE
- [ ] "Discard chat" marks status as DISCARDED
- [ ] Chat can be resumed if status is IN_PROGRESS
- [ ] discoveryCompletedAt timestamp is set when marked DONE
- [ ] "Generate Requirements" button appears only when status is DONE
- [ ] State persistence survives page refresh
- [ ] All state transitions are tested
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at Feature 65
- [ ] All quality gates pass
- [ ] CodeRabbit review completed and all findings resolved (recommended quality gate)

## Setup Instructions

No new external accounts or API keys required. This feature extends existing Prisma schema and discovery logic.

After implementing schema changes:
```bash
npm run db:generate
npm run db:migrate
```

For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
