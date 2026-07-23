# Feature 68 - Resume/Review/Discard Session Workflow

## Type

NEW FEATURE

## What This Delivers

Session state management system allowing users to pause discovery sessions, review session context before resuming, discard sessions to start fresh, and branch/fork sessions to explore alternative directions. Includes auto-save every 30 seconds, power-loss recovery, resume modal with last message preview, session history sidebar, and confirmation dialogs for destructive actions. Integrates with Feature 46's checkpoint system.

## Dependencies

- Feature 46 (Session Autosave & Power-Loss Recovery) provides the checkpoint foundation.
- Feature 10 (Discovery Chat) provides the conversation interface.
- Feature 53 (Dynamic Phase Completion Detection) provides phase tracking.

## Context To Read First

- `context/ai-workflow-rules.md` (Session management patterns)
- `context/build-plan.md` (Phase 9: Resume/Review/Discard Session Workflow)
- `context/progress-tracker.md`

## Context7 Docs To Check

- React Hook Form for session resume form
- Zustand for session state management

```bash
npx ctx7 library zustand "Persistent state with localStorage"
npx ctx7 library react-hook-form "Multi-step form with validation"
```

## Files Owned

- `lib/sessions/state-machine.ts`
- `lib/sessions/auto-save.ts`
- `components/discovery/SessionControls.tsx`
- `components/projects/ResumeSessionModal.tsx`
- `components/projects/SessionHistorySidebar.tsx`
- `app/api/sessions/[projectId]/pause/route.ts`
- `app/api/sessions/[projectId]/resume/route.ts`
- `app/api/sessions/[projectId]/discard/route.ts`
- `app/api/sessions/[projectId]/branch/route.ts`

## Files

CREATE: `lib/sessions/state-machine.ts` - session state transitions and validation
CREATE: `lib/sessions/auto-save.ts` - auto-save logic with 30s interval
CREATE: `components/discovery/SessionControls.tsx` - pause/save buttons in chat
CREATE: `components/projects/ResumeSessionModal.tsx` - modal with session context preview
CREATE: `components/projects/SessionHistorySidebar.tsx` - list of past sessions
CREATE: `app/api/sessions/[projectId]/pause/route.ts` - pause session endpoint
CREATE: `app/api/sessions/[projectId]/resume/route.ts` - resume session endpoint
CREATE: `app/api/sessions/[projectId]/discard/route.ts` - discard session endpoint
CREATE: `app/api/sessions/[projectId]/branch/route.ts` - branch/fork session endpoint
MODIFY: `app/(app)/projects/[projectId]/layout.tsx` - mount ResumeSessionModal
MODIFY: `app/(app)/projects/[projectId]/discovery/page.tsx` - integrate SessionControls
MODIFY: `context/progress-tracker.md` - mark feature progress

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.

- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: Session state must persist across page refreshes and browser closes (use database, not just client state).
- **CRITICAL**: Discarding a session is **permanent** - show strong confirmation with project name verification.
- **CRITICAL**: Auto-save must not block user interactions (run in background with debounce).

### Session State Machine

**States:**

```typescript
// lib/sessions/state-machine.ts

export enum SessionState {
  ACTIVE = 'ACTIVE',         // User actively chatting
  PAUSED = 'PAUSED',         // User explicitly paused
  COMPLETED = 'COMPLETED',   // Discovery finished, moved to next phase
  DISCARDED = 'DISCARDED',   // User discarded session
}

export const VALID_TRANSITIONS: Record<SessionState, SessionState[]> = {
  ACTIVE: [SessionState.PAUSED, SessionState.COMPLETED, SessionState.DISCARDED],
  PAUSED: [SessionState.ACTIVE, SessionState.DISCARDED],
  COMPLETED: [], // Terminal state
  DISCARDED: [], // Terminal state
};

export function canTransition(from: SessionState, to: SessionState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionSession(currentState: SessionState, newState: SessionState): SessionState {
  if (!canTransition(currentState, newState)) {
    throw new Error(`Invalid state transition: ${currentState} -> ${newState}`);
  }
  return newState;
}
```

### Database Schema Extension

**Add Session model:**

```prisma
model Session {
  id              String        @id @default(cuid())
  projectId       String
  project         Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  state           SessionState  @default(ACTIVE)
  
  // Context snapshot
  lastMessageId   String?
  currentPhase    String
  phaseConfidence Int?          // 0-100
  messageCount    Int           @default(0)
  
  // Metadata
  createdAt       DateTime      @default(now())
  lastActiveAt    DateTime      @default(now())
  pausedAt        DateTime?
  resumedAt       DateTime?
  completedAt     DateTime?
  discardedAt     DateTime?
  
  createdBy       String        // User ID who created
  
  @@index([projectId, state])
  @@index([projectId, lastActiveAt])
}

enum SessionState {
  ACTIVE
  PAUSED
  COMPLETED
  DISCARDED
}
```

**Migration needed:**
- Create `Session` model with all fields
- Add `SessionState` enum
- Add indexes for filtering by state and lastActiveAt

### Auto-Save Logic

**Save session every 30 seconds:**

```typescript
// lib/sessions/auto-save.ts

import { useEffect, useRef } from 'react';

const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export function useAutoSave(projectId: string, enabled: boolean) {
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    const saveSession = async () => {
      try {
        await fetch(`/api/sessions/${projectId}/auto-save`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
        // Silent failure - don't disrupt user
      }
    };

    intervalRef.current = setInterval(saveSession, AUTO_SAVE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [projectId, enabled]);
}
```

### SessionControls Component

**Pause/save buttons in chat:**

```typescript
'use client';

import { useState } from 'react';
import { Pause, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function SessionControls({ projectId }: { projectId: string }) {
  const [isPausing, setIsPausing] = useState(false);

  const handlePause = async () => {
    setIsPausing(true);

    try {
      const response = await fetch(`/api/sessions/${projectId}/pause`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to pause session');

      toast.success('Session paused. You can resume later from where you left off.');
    } catch (error) {
      toast.error('Failed to pause session');
    } finally {
      setIsPausing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePause}
        disabled={isPausing}
      >
        <Pause className="h-4 w-4 mr-2" />
        {isPausing ? 'Pausing...' : 'Pause Session'}
      </Button>

      <span className="text-xs text-muted">Auto-saves every 30s</span>
    </div>
  );
}
```

### ResumeSessionModal Component

**Modal with session context preview:**

```typescript
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface SessionContext {
  lastMessage: string;
  currentPhase: string;
  phaseConfidence: number;
  messageCount: number;
  pausedAt: Date;
}

interface ResumeSessionModalProps {
  projectId: string;
  sessionContext: SessionContext | null;
  onResume: () => void;
  onDiscard: () => void;
  onClose: () => void;
}

export function ResumeSessionModal({
  projectId,
  sessionContext,
  onResume,
  onDiscard,
  onClose,
}: ResumeSessionModalProps) {
  const [isResuming, setIsResuming] = useState(false);

  if (!sessionContext) return null;

  const handleResume = async () => {
    setIsResuming(true);
    try {
      const response = await fetch(`/api/sessions/${projectId}/resume`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to resume');

      onResume();
    } catch (error) {
      console.error('Resume failed:', error);
    } finally {
      setIsResuming(false);
    }
  };

  return (
    <Dialog open={!!sessionContext} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Resume Session</DialogTitle>
          <DialogDescription>
            You have an unfinished discovery session.
            Paused {formatDistanceToNow(sessionContext.pausedAt, { addSuffix: true })}.
          </DialogDescription>
        </DialogHeader>

        {/* Session Context */}
        <div className="space-y-4 py-4">
          <div>
            <h4 className="text-sm font-semibold text-primary mb-2">Current Phase</h4>
            <p className="text-sm text-secondary">
              {sessionContext.currentPhase} ({sessionContext.phaseConfidence}% confidence)
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-primary mb-2">Progress</h4>
            <p className="text-sm text-secondary">
              {sessionContext.messageCount} messages exchanged
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-primary mb-2">Last Message</h4>
            <div className="p-3 bg-surface rounded-lg text-sm text-secondary">
              "{sessionContext.lastMessage.slice(0, 150)}..."
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onDiscard}>
            Start Fresh
          </Button>
          <Button onClick={handleResume} disabled={isResuming}>
            {isResuming ? 'Resuming...' : 'Resume Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Discard Confirmation

**Discard with project name verification:**

```typescript
'use client';

import { useState } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DiscardConfirmationProps {
  projectName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DiscardConfirmation({ projectName, onConfirm, onCancel }: DiscardConfirmationProps) {
  const [input, setInput] = useState('');
  const isValid = input === projectName;

  return (
    <AlertDialog open onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-error">Discard Session?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. All progress in the current session will be permanently lost.
            Messages will remain in the database but will be hidden from the UI.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <label htmlFor="confirm-input" className="text-sm text-secondary block mb-2">
            Type <span className="font-semibold text-primary">{projectName}</span> to confirm:
          </label>
          <Input
            id="confirm-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Project name"
            className="w-full"
          />
        </div>

        <AlertDialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!isValid}
          >
            Discard Session
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### SessionHistorySidebar Component

**List past sessions:**

```typescript
'use client';

import { formatDistanceToNow } from 'date-fns';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

interface SessionHistory {
  id: string;
  state: SessionState;
  messageCount: number;
  lastActiveAt: Date;
  currentPhase: string;
}

interface SessionHistorySidebarProps {
  sessions: SessionHistory[];
  currentSessionId: string;
  onSelectSession: (sessionId: string) => void;
}

export function SessionHistorySidebar({
  sessions,
  currentSessionId,
  onSelectSession,
}: SessionHistorySidebarProps) {
  return (
    <div className="w-64 border-l border-border p-4 space-y-4">
      <h3 className="text-lg font-semibold text-primary">Session History</h3>

      <div className="space-y-2">
        {sessions.map((session) => {
          const isCurrent = session.id === currentSessionId;

          return (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                isCurrent ? 'bg-primary/10 border border-primary' : 'bg-surface hover:bg-surfaceElevated'
              }`}
            >
              {/* Status Icon */}
              <div className="flex items-center gap-2 mb-2">
                {session.state === 'ACTIVE' && <Clock className="h-4 w-4 text-primary" />}
                {session.state === 'PAUSED' && <Clock className="h-4 w-4 text-warning" />}
                {session.state === 'COMPLETED' && <CheckCircle className="h-4 w-4 text-success" />}
                {session.state === 'DISCARDED' && <XCircle className="h-4 w-4 text-error" />}

                <span className="text-sm font-semibold text-primary capitalize">
                  {session.state.toLowerCase()}
                </span>
              </div>

              {/* Metadata */}
              <div className="text-xs text-secondary space-y-1">
                <div>{session.currentPhase}</div>
                <div>{session.messageCount} messages</div>
                <div>{formatDistanceToNow(session.lastActiveAt, { addSuffix: true })}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

### API Routes

**Pause Session:**

```typescript
// app/api/sessions/[projectId]/pause/route.ts

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  const user = await requireAuth(req);
  await requireProjectMember(params.projectId, user.id);

  await prisma.session.updateMany({
    where: {
      projectId: params.projectId,
      state: SessionState.ACTIVE,
    },
    data: {
      state: SessionState.PAUSED,
      pausedAt: new Date(),
    },
  });

  return Response.json({ success: true });
}
```

**Resume Session:**

```typescript
// app/api/sessions/[projectId]/resume/route.ts

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  const user = await requireAuth(req);
  await requireProjectMember(params.projectId, user.id);

  await prisma.session.updateMany({
    where: {
      projectId: params.projectId,
      state: SessionState.PAUSED,
    },
    data: {
      state: SessionState.ACTIVE,
      resumedAt: new Date(),
      lastActiveAt: new Date(),
    },
  });

  return Response.json({ success: true });
}
```

**Discard Session:**

```typescript
// app/api/sessions/[projectId]/discard/route.ts

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  const user = await requireAuth(req);
  await requireProjectOwner(params.projectId, user.id); // Owner only

  await prisma.session.updateMany({
    where: {
      projectId: params.projectId,
      state: { in: [SessionState.ACTIVE, SessionState.PAUSED] },
    },
    data: {
      state: SessionState.DISCARDED,
      discardedAt: new Date(),
    },
  });

  // Create new active session
  await prisma.session.create({
    data: {
      projectId: params.projectId,
      state: SessionState.ACTIVE,
      currentPhase: 'Problem & Users',
      createdBy: user.id,
    },
  });

  return Response.json({ success: true });
}
```

## Out of Scope

- Session branching with visual diff (show differences between branches)
- Session merge (combine two branches into one)
- Session versioning (rollback to specific message)
- Collaborative session management (multiple users in same session)

## Future Modifications

- Future features may add session branching UI with visual diff
- Future features may add session merge capability
- Future features may add session export/import (share sessions between projects)

## Quality Gates

- Run `npm run test` and ensure it passes (minimum 12 new tests: 4 state machine, 3 auto-save, 5 API routes)
- Run `npm run build` and ensure it passes
- Run `npm run security:all` and ensure it passes before push
- Test all state transitions (active → paused → active, active → discarded, etc.)
- Test power-loss recovery (close browser mid-session, reopen)

## Acceptance Criteria

- [ ] Session state persists in database with ACTIVE, PAUSED, COMPLETED, DISCARDED states
- [ ] State machine validates transitions (no invalid jumps)
- [ ] Auto-save runs every 30 seconds when session active
- [ ] Auto-save does not block user interactions (runs in background)
- [ ] SessionControls shows "Pause Session" button in chat header
- [ ] Pausing session updates state to PAUSED with pausedAt timestamp
- [ ] ResumeSessionModal shows on project open if PAUSED session exists
- [ ] Modal displays last message preview, current phase, confidence, message count
- [ ] User can resume session (restores to ACTIVE state)
- [ ] User can discard session (requires project name verification)
- [ ] Discarding marks session as DISCARDED and creates new ACTIVE session
- [ ] Session history sidebar shows past sessions with status icons
- [ ] Sessions sorted by lastActiveAt desc
- [ ] Owner-only for discard operation
- [ ] Non-members cannot pause/resume/discard sessions (404 error)
- [ ] Accessibility: Keyboard navigation, focus trapping in modals, screen reader labels
- [ ] `context/progress-tracker.md` updated to mark feature DONE
- [ ] `npm run build` passes with no warnings
- [ ] CodeRabbit review completed (recommended quality gate)