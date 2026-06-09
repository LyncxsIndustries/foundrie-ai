# Feature 33 - Liveblocks Presence

## Type

NEW FEATURE

## What This Delivers

Collaborative presence on the canvas: live cursors, participant avatars and names, AI thinking/generation presence during background work, and the foundation for the multi-user AI input queue state machine. Presence is ephemeral and kept separate from persisted diagram artifacts.

## Dependencies

- Feature 14 (React Flow Canvas) must be complete (Liveblocks rooms exist).

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Liveblocks `/liveblocks/liveblocks`

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `components/canvas/PresenceLayer.tsx`
- `lib/liveblocks/presence.ts`

## Files

CREATE: `lib/liveblocks/presence.ts` - presence schema and helpers.
CREATE: `components/canvas/PresenceLayer.tsx` - live cursors, avatars, AI presence.

## Implementation Notes

- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens) is also baked into the generated projects, ensuring they are premium products.


- Define the Liveblocks presence schema (cursor position, selection, status). Show live cursors on the canvas and participant avatars/names. Show AI thinking/generation presence during background work.
- Keep presence separate from persisted diagram artifacts (persistent data lives in the database). Presence degrades gracefully when realtime auth/connection fails.
- Lay the groundwork for the AI input queue state machine (FREE → TYPING → SUBMITTED → RUNNING → BATCH_TAKEN): the first user to focus the input claims it, others see "X is typing" and a queue box, and queued messages are taken as a batch when the AI finishes. Buttons disable on click (idempotency).

## Out of Scope

- Member-aware authorization (Features 40–41) and the sharing UI (Feature 42).
- Full batch-mode AI processing logic if it depends on collaboration auth (extend later).

## Future Modifications

- Feature 40: Liveblocks room auth authorizes both Owner and Collaborator.
- Feature 42: Member avatars appear in the project header.

## Acceptance Criteria

- [ ] Live cursors render on the canvas with participant avatars and names.
- [ ] AI thinking/generation presence is shown during background work.
- [ ] Presence is separate from persisted diagram data and degrades gracefully on connection failure.
- [ ] The input field reflects the queue state machine states.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
