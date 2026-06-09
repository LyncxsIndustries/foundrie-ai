# Feature 46 - Session Autosave & Power-Loss Recovery

## Type

NEW FEATURE

## What This Delivers

Resumable sessions: discovery turns, diagram generations, spec drafts, human edits, and approvals are checkpointed so a user can close the tab, lose power, or disconnect and resume exactly where they left off. On reopen, the user is offered Resume / Review history / Discard. Collaborative sessions live in the database (not any local machine) and restore for all participants on reconnect.

## Dependencies

- Feature 10 (Discovery Chat) and Feature 19 (Sequential Generation) must be complete (the things being checkpointed exist).
- Feature 03 (Database Schema) provides conversation, diagram, and context-file persistence.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Trigger.dev `/triggerdotdev/trigger.dev`
- Prisma `/prisma/web`
- Liveblocks `/liveblocks/liveblocks`

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `lib/session/checkpoint.ts`
- `app/api/projects/[projectId]/session/route.ts`
- `components/project/ResumeSessionPrompt.tsx`

## Files

CREATE: `lib/session/checkpoint.ts` - write/read session checkpoints derived from persisted state.
CREATE: `app/api/projects/[projectId]/session/route.ts` - return resumable session state.
CREATE: `components/project/ResumeSessionPrompt.tsx` - Resume / Review history / Discard.
MODIFY: `context/progress-tracker.md` - mark feature progress.

## Implementation Notes

- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens) is also baked into the generated projects, ensuring they are premium products.


- Checkpoint granularity: every AI turn, every diagram generation, every feature-spec draft, every human edit (with a diff for undo history), and every approval (with timestamp). In Foundrie's deployed Python layer this is LangGraph PostgresSaver; here, derive the resumable state from the already-persisted conversation, diagram, context-file, and execution-plan records and a lightweight checkpoint marker. Long-running generation tasks (Trigger.dev) are durable and resume from the last completed unit.
- On session open, if an active unfinished session exists for the user, show the resume prompt before a new session can start (verified at session start). Resume restores the conversation, re-renders any mid-generation diagram from its last complete state, and continues.
- Collaborative recovery: session state lives in Neon, not on any client. The first collaborator to reconnect becomes acting Owner; full state restores when all reconnect; the AI's last response is re-displayed.
- Use `db` for checkpoint reads/writes. Avoid rewriting large JSON in tight loops; checkpoint markers reference existing rows rather than copying them.

## Out of Scope

- Diagram/spec rollback UI (Feature 45 owns versioning/rollback).
- Cross-device real-time sync beyond reconnect restore.

## Future Modifications

- Feature 45: rollback reuses checkpoint history.
- Later scale feature: the Python LangGraph PostgresSaver becomes the authoritative checkpoint store.

## Acceptance Criteria

- [ ] Reopening a project with an unfinished session shows Resume / Review history / Discard before a new session can start.
- [ ] Resume restores the conversation and re-renders any mid-generation diagram from its last complete state.
- [ ] Long-running generation resumes from the last completed unit after interruption.
- [ ] Collaborative sessions restore for all participants on reconnect; the first to reconnect becomes acting Owner.
- [ ] Checkpoints reference persisted rows rather than duplicating large JSON.
- [ ] Non-members get 404.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
