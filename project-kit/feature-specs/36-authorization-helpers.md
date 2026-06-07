# Feature 36 - Authorization Helpers

## Type

NEW FEATURE

## What This Delivers

Creates the application-layer authorization helpers that enforce the Owner/Collaborator permission model. Refactors existing project routes to use these helpers instead of raw `where: { id, userId }` clauses, without changing any observable API behavior.

## Dependencies

- Feature 04 (Project CRUD) must be complete before starting.
- Feature 35 (Project Member Schema) must be complete before starting.

## Files Owned

- `lib/auth/project-access.ts`

## Files

CREATE: `lib/auth/project-access.ts` - `requireProjectOwner()`, `requireProjectMember()`, `getProjectRole()`.
MODIFY: `app/api/projects/[projectId]/route.ts` - Use `requireProjectOwner()` for read/update/delete.
MODIFY: `project-kit/context/progress-tracker.md` - Mark feature progress.

## Implementation Notes

- `requireProjectOwner(projectId, userId)`: Looks up the project where `id = projectId AND userId = userId`. Returns the project or throws a 404 response. This is the gate for project settings, delete, and member management.
- `requireProjectMember(projectId, userId)`: Looks up the project where `id = projectId AND (userId = userId OR ProjectMember.userId = userId)`. Returns the project and the user's role (`OWNER` or `COLLABORATOR`) or throws 404. This is the gate for canvas, diagram, AI, and ZIP operations.
- `getProjectRole(projectId, userId)`: Returns `OWNER`, `COLLABORATOR`, or `null`. Used for UI conditional rendering (show/hide share button, settings).
- Refactor existing `GET/PATCH/DELETE /api/projects/[projectId]` to use `requireProjectOwner()` — no behavior change since only owners currently have access.
- All helpers use the single `db` client.
- Return 404, not 403, for access failures.

## Out of Scope

- Invite/remove member APIs (Features 37-38).
- Modifying Liveblocks room auth (Feature 40).
- UI changes (Feature 42).

## Future Modifications

- Feature 37: Uses `requireProjectOwner()` to gate invite API.
- Feature 40: Uses `requireProjectMember()` to gate canvas access.
- Feature 41: Uses `requireProjectMember()` to gate AI generation.

## Acceptance Criteria

- [ ] `requireProjectOwner()` returns project for owner, throws 404 for non-owner.
- [ ] `requireProjectMember()` returns project + role for owner or collaborator, throws 404 for non-member.
- [ ] `getProjectRole()` returns correct role or null.
- [ ] Existing project API behavior is unchanged — owners can still CRUD their projects.
- [ ] Non-owners still get 404 on project routes.
- [ ] Unit tests cover all three helpers.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- All CodeRabbit reviews must pass. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
