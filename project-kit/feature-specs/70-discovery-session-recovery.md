# Feature 70 - Discovery Session Recovery & Resume

## Type

ENHANCEMENT

## What This Delivers

Implements robust recovery mechanisms for interrupted discovery sessions. Supports page refresh resume, browser crash recovery, power loss recovery via LangGraph checkpoints, and cross-device session continuation. Stores phase state, message history, and context in database with automatic checkpoint sync. After this feature, discovery sessions are resilient to all common failure modes.

## Dependencies

- Feature 65 (Discovery Phase State Machine) - provides phase state
- Feature 64 (Discovery Chat State & Logic) - conversation versioning
- Feature 67 (Discovery-to-Requirements Handoff) - preserves handoff data

## Context To Read First

- `context/architecture-context.md`
- `research/FOUNDRIE_V15.0.0.md` (Conversation State Persistence)
- `context/code-standards.md`

## Files Owned

- `lib/discovery/session-recovery.ts` (NEW)
- `lib/discovery/checkpoint-sync.ts` (NEW)
- `app/api/discovery/[projectId]/recover/route.ts` (NEW)

## Files

CREATE: `lib/discovery/session-recovery.ts` - recovery logic and state restoration
CREATE: `lib/discovery/checkpoint-sync.ts` - LangGraph checkpoint synchronization
CREATE: `app/api/discovery/[projectId]/recover/route.ts` - session recovery endpoint
MODIFY: `components/discovery/DiscoveryChat.tsx` - detect and offer recovery on mount
MODIFY: `trigger/streaming-chat.ts` - create checkpoints after each AI response
CREATE: `lib/discovery/session-recovery.test.ts` - test recovery scenarios

## Acceptance Criteria

- [ ] Page refresh resumes discovery at exact message
- [ ] LangGraph checkpoints created after each AI turn
- [ ] Recovery offers: Resume / Review history / Start fresh
- [ ] Cross-device continuation works (read from database)
- [ ] Phase state restored correctly
- [ ] Handoff data preserved through interruptions
- [ ] Recovery UI shows last activity timestamp
- [ ] All recovery paths tested
- [ ] `context/progress-tracker.md` updated to point at Feature 71 (formerly 65)

## Setup Instructions

No new dependencies. Uses existing LangGraph PostgresSaver and Prisma.
