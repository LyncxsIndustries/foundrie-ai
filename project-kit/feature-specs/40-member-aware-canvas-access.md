# Feature 40 - Member-Aware Canvas Access

## Type

MODIFICATION (modifies Feature 14: React Flow Canvas, Feature 33: Liveblocks Presence)

## What This Delivers

Extends Liveblocks room authorization and diagram CRUD routes to authorize both Owner and Collaborator roles. Both roles can view, create, edit, and delete diagrams on the canvas.

## Dependencies

- Feature 14 (React Flow Canvas) must be complete before starting.
- Feature 33 (Liveblocks Presence) must be complete before starting.
- Feature 36 (Authorization Helpers) must be complete before starting.

## Files

MODIFY: `app/api/liveblocks-auth/route.ts` (or equivalent Liveblocks auth endpoint) - Use `requireProjectMember()`.
MODIFY: `app/api/projects/[projectId]/diagrams/route.ts` - Use `requireProjectMember()` for list and create.
MODIFY: `app/api/projects/[projectId]/diagrams/[diagramId]/route.ts` - Use `requireProjectMember()` for read, update, delete.
MODIFY: `project-kit/context/progress-tracker.md` - Mark feature progress.

## Implementation Notes

- Replace existing owner-only checks in diagram routes with `requireProjectMember()`.
- Liveblocks room auth endpoint must check `requireProjectMember()` before granting room access.
- The Liveblocks user info payload should include the user's role (`OWNER` or `COLLABORATOR`) so the canvas UI can conditionally show controls.
- Both Owner and Collaborator can create, edit, and delete diagrams.
- Both roles see live cursors and presence from other members.

## Out of Scope

- Restricting specific diagram operations by role (all canvas operations are equal for both roles).
- Canvas-level permissions (e.g., locking specific nodes).
- Notification when a collaborator makes a change.

## Acceptance Criteria

- [ ] Owner can access canvas and CRUD diagrams (existing behavior preserved).
- [ ] Collaborator can access canvas and CRUD diagrams.
- [ ] Non-members get 404 on canvas and diagram routes.
- [ ] Liveblocks room auth grants access to both Owner and Collaborator.
- [ ] Live presence shows both Owner and Collaborator cursors.
- [ ] `npm run build` passes.
- All CodeRabbit reviews must pass. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
