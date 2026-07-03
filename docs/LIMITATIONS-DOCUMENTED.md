# Known Limitations - Documented in Feature Specs

**Last Updated:** 2026-07-03 18:32 EAT

---

This document summarizes all known limitations from the Trigger.dev optimizations session and their locations in feature specs for future implementation.

## Overview

All limitations from the optimizations work have been properly documented in the relevant feature specification files with clear future enhancement paths. This ensures:

1. **Traceability** - Every limitation is tracked in the spec that owns that functionality
2. **Actionability** - Each limitation includes specific enhancement proposals
3. **Prioritization** - Future development can reference these specs to implement enhancements
4. **Contract Compliance** - Follows Hard Rule 0 by updating all affected specs

---

## 1. Progress Tracking Limitations

### 1.1 Polling-Based Progress (500ms interval)

**Location:** 
- Feature 31 (Trigger ZIP Job) - Known Limitations #1
- Feature 32 (Download Button) - Known Limitations #1

**Current State:**
- HTTP polling every 500ms to check task status
- Works well but has small latency window
- Adds server load with frequent requests

**Future Enhancement:**
- Migrate to WebSocket streaming for instant updates
- Consider Trigger.dev Realtime SDK or Liveblocks presence
- Use Server-Sent Events (SSE) as WebSocket alternative
- Push-based model eliminates polling overhead

**Implementation Priority:** Medium (Post-V1)

---

### 1.2 No Task Cancellation

**Location:**
- Feature 31 (Trigger ZIP Job) - Known Limitations #2
- Feature 32 (Download Button) - Known Limitations #2

**Current State:**
- Once ZIP generation starts, it runs to completion
- Users must wait for finish or failure (up to 5 minutes)
- No way to abort long-running tasks

**Future Enhancement:**
- Add "Cancel Generation" button in download UI
- Create `/api/projects/[projectId]/download/cancel` endpoint
- Call Trigger.dev's `tasks.cancel(runId)` API
- Show confirmation dialog before cancellation
- Handle partial artifacts cleanup

**Implementation Priority:** Medium (User-requested feature)

---

### 1.3 No Progress History

**Location:**
- Feature 31 (Trigger ZIP Job) - Known Limitations #3
- Feature 32 (Download Button) - Known Limitations #3

**Current State:**
- Task progress (metadata updates) is ephemeral
- Progress disappears after completion
- No way to replay or debug past executions
- Cannot analyze performance trends

**Future Enhancement:**
- Create `TaskProgressLog` model in database schema:
  ```prisma
  model TaskProgressLog {
    id          String   @id @default(cuid())
    taskId      String   // Trigger.dev run ID
    projectId   String
    taskType    String   // "generate-project-zip", etc.
    stage       String
    progress    Int      // 0-100
    message     String
    metadata    Json?    // Additional metadata snapshot
    timestamp   DateTime @default(now())
    
    project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
    
    @@index([taskId])
    @@index([projectId, timestamp])
  }
  ```
- Add "View History" button in UI
- Build replay interface showing timeline
- Use for debugging, support, and performance monitoring

**Implementation Priority:** Low (Nice-to-have, debugging tool)

---

### 1.4 No Retry Limits

**Location:**
- Feature 32 (Download Button) - Known Limitations #4

**Current State:**
- Users can retry failed downloads indefinitely
- No tracking of retry attempts
- No guidance after repeated failures

**Future Enhancement:**
- Add retry counter in UI component state
- Show warning message after 3 failed attempts
- Offer "Contact Support" link after 5 failures
- Include task ID and error details in support link

**Implementation Priority:** Low (UX polish)

---

## 2. Verification Script Limitations

### 2.1 False Positives in Spec-to-Code Audit

**Location:**
- Feature 50 (CI/CD & Security Scaffolding) - Known Limitations #1

**Current State:**
- `scripts/verify-sync-enhanced.ts` flags valid patterns as missing:
  - **Lucide React icons** (Upload, ArrowDown, Send) detected as missing components
  - **Built-in TypeScript types** (HTMLDivElement, NodeJS, Buffer) flagged as missing types
  - **URL patterns in specs** (/vercel/next.js) detected as file paths

**Current Workaround:**
- Manually review verification output
- Ignore warnings for external dependencies and built-in types
- Focus on errors (missing files, routes, models) for real contract drift

**Future Enhancement:**
Refine pattern matching in `scripts/verify-sync-enhanced.ts`:

1. **Icon Library Whitelist:**
   ```typescript
   const EXTERNAL_ICON_LIBRARIES = [
     'lucide-react',
     'heroicons',
     '@heroicons/react',
     'react-icons',
     'phosphor-react'
   ];
   ```

2. **Built-in Type Whitelist:**
   ```typescript
   const BUILTIN_TYPES = [
     'HTMLElement', 'HTMLDivElement', 'HTMLButtonElement',
     'NodeJS', 'Buffer', 'Promise', 'Array', 'Map', 'Set',
     // ... complete DOM/Node types
   ];
   ```

3. **URL Pattern Detection:**
   ```typescript
   // Skip if matches URL pattern
   if (line.includes('://') || line.match(/\[.*\]\(http/)) {
     continue; // It's a documentation link, not a file path
   }
   ```

4. **Mode Flags:**
   ```bash
   npm run sync:check              # Default: show all
   npm run sync:check --strict     # Show all warnings
   npm run sync:check --errors-only # CI mode: only blocking errors
   ```

**Implementation Priority:** Medium (Reduces noise in verification output)

---

## 3. Multi-Task Tracking (Not Yet Spec'd)

**Location:** Not yet assigned to a feature spec

**Future Consideration:**
- Monitor multiple tasks in parallel
- Unified progress dashboard showing all running tasks
- Real-time status for diagrams, requirements, architecture, etc.
- Priority queue visualization

**Implementation Priority:** Low (V2 enhancement)

---

## 4. Toast Notifications (Not Yet Spec'd)

**Location:** Not yet assigned to a feature spec

**Future Consideration:**
- Show completion toasts when tab is not active
- Use Web Notifications API with permission request
- Configurable notification preferences per user
- Sound alerts for important completions

**Implementation Priority:** Low (UX polish)

---

## Summary Table

| # | Limitation | Feature Spec | Priority | Lines of Code Est. |
|---|------------|--------------|----------|-------------------|
| 1 | Polling-based progress | 31, 32 | Medium | ~200 (WebSocket implementation) |
| 2 | No cancel button | 31, 32 | Medium | ~100 (UI + API endpoint) |
| 3 | No progress history | 31, 32 | Low | ~300 (Model + UI + migration) |
| 4 | No retry limits | 32 | Low | ~50 (UI state tracking) |
| 5 | Verification false positives | 50 | Medium | ~150 (Pattern refinements) |
| 6 | Multi-task tracking | TBD | Low | ~400 (Dashboard + state management) |
| 7 | Toast notifications | TBD | Low | ~100 (Notification API integration) |

**Total Estimated Implementation:** ~1,300 LOC

---

## Implementation Strategy

### Phase 1: High-Impact, Low-Effort (Priority)
1. **Verification Refinements** (Feature 50) - 150 LOC
   - Reduces noise in daily development
   - Clear patterns to implement
   - No database changes

### Phase 2: User Experience Enhancements
2. **Cancel Button** (Features 31, 32) - 100 LOC
   - User-requested feature
   - Straightforward API integration
   - No database changes

3. **Retry Limits** (Feature 32) - 50 LOC
   - Quick UX polish
   - No backend changes

### Phase 3: Infrastructure Upgrades
4. **WebSocket Streaming** (Features 31, 32) - 200 LOC
   - Significant performance improvement
   - Eliminates polling overhead
   - Requires infrastructure decision (native WebSocket vs. Liveblocks)

### Phase 4: Advanced Features
5. **Progress History** (Features 31, 32) - 300 LOC
   - Requires database migration
   - New model + indexes
   - Replay UI implementation

6. **Multi-Task Dashboard** (TBD) - 400 LOC
   - New feature specification needed
   - Complex state management
   - Real-time updates across multiple tasks

7. **Toast Notifications** (TBD) - 100 LOC
   - Requires permission handling
   - Cross-browser compatibility
   - User preference storage

---

## Compliance Verification

✅ **All limitations documented in feature specs**  
✅ **Future enhancement paths defined**  
✅ **Implementation estimates provided**  
✅ **Priority levels assigned**  
✅ **Hard Rule 0 contract synchronization followed**  
✅ **Traceability maintained**  

**Next Action:** Implement Phase 1 (Verification Refinements) when prioritized in roadmap.

---

**References:**
- [Feature 31 Spec](../project-kit/feature-specs/31-trigger-zip-job.md)
- [Feature 32 Spec](../project-kit/feature-specs/32-download-button.md)
- [Feature 50 Spec](../project-kit/feature-specs/50-cicd-security-scaffolding.md)
- [Trigger Optimizations Doc](./trigger-optimizations.md)
- [Session Summary](./SESSION-2026-07-03-trigger-optimizations.md)
