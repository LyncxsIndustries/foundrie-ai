# Feature 14 - React Flow Canvas

## Type

NEW FEATURE

## What This Delivers

The Liveblocks-backed base diagram canvas: a configured Liveblocks client and auth route, a `DiagramCanvas` built on React Flow with collaborative nodes/edges stored in a project-scoped room, viewport controls, and a full-viewport dotted background. This canvas is where the Phase 6 diagram-first gate plays out.

## Dependencies

- Feature 13 (Architecture Proposal) must be complete (initial architecture nodes/edges exist).
- Feature 06 (Layout Shell) provides the architecture/diagrams phase pages.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Liveblocks `/liveblocks/liveblocks`
- React Flow `/xyflow/web`

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `components/canvas/DiagramCanvas.tsx`
- `app/api/liveblocks-auth/route.ts`
- `lib/liveblocks/**`

## Files

CREATE: `app/api/liveblocks-auth/route.ts` - project-scoped, authenticated Liveblocks room auth.
CREATE: `components/canvas/DiagramCanvas.tsx` - React Flow canvas with collaborative state.
CREATE: `lib/liveblocks/**` - client config and room helpers.
MODIFY: `app/(app)/projects/[projectId]/architecture/page.tsx` and `.../diagrams/page.tsx` - mount the canvas.

## Implementation Notes

- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens) is also baked into the generated projects, ensuring they are premium products.


- Configure the Liveblocks client and an auth route using project-scoped room IDs; verify project membership before granting room access.
- Store collaborative nodes and edges in the room; persistent diagram data still lives in the database (presence is for cursors/selections only) and degrades gracefully when realtime auth/connection fails.
- Use React Flow state helpers rather than ad hoc mutation. Keep the canvas full-viewport and flush with the app background; floating panels overlay, never shrink it. Viewport changes are intentional (no surprise zoom).
- `nodeTypes`/`edgeTypes` are defined outside render scope or memoized (added in Features 16–17).

## Out of Scope

- Custom node/edge types (Features 16–17), the type selector (Feature 15), generation (Features 18–19), and storage/export (Features 20–21).

## Future Modifications

- Features 16–17: Real custom node and edge types render on this canvas.
- Feature 19: Sequential generation renders generated diagrams here.
- Feature 33: Liveblocks presence adds live cursors and the input queue.

## Acceptance Criteria

- [ ] The Liveblocks auth route is authenticated and project-scoped (membership checked).
- [ ] `DiagramCanvas` renders with collaborative nodes/edges and viewport controls.
- [ ] The canvas is full-viewport with a dotted background flush to the app background.
- [ ] Realtime connection/auth failure degrades gracefully without losing persisted data.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
