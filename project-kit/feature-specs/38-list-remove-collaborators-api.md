# Feature 38 - List & Remove Collaborators API

## Type

NEW FEATURE

## What This Delivers

Adds API endpoints for listing project members and removing collaborators. Owners can list and remove any collaborator. Collaborators can list members and remove themselves (leave the project).

## Dependencies

- Feature 37 (Invite Collaborator API) must be complete before starting.

## Files Owned

- `app/api/projects/[projectId]/members/[memberId]/route.ts`
- The GET handler within `app/api/projects/[projectId]/members/route.ts`

## Files

MODIFY: `app/api/projects/[projectId]/members/route.ts` - Add GET handler for listing.
CREATE: `app/api/projects/[projectId]/members/[memberId]/route.ts` - DELETE handler for removal.
MODIFY: `project-kit/context/progress-tracker.md` - Mark feature progress.

## Implementation Notes

- `GET /api/projects/[projectId]/members`: Gate with `requireProjectMember()` — both Owner and Collaborator can see the member list. Return all members with `user.name`, `user.email`, `role`, and `joinedAt`. Include the Owner (from `Project.userId`) in the response even though they may not have a `ProjectMember` row.
- `DELETE /api/projects/[projectId]/members/[memberId]`: Two cases:
  1. **Owner removing a collaborator**: Gate with `requireProjectOwner()`. Delete the `ProjectMember` row. Return 200.
  2. **Collaborator removing themselves**: Gate with `requireProjectMember()`. The authenticated user can only delete their own membership. Return 200.
- Owner cannot be removed. If `memberId` points to the owner, return 400 with `message: "Cannot remove the project owner."`.
- Ownership transfer is blocked in v1 — if the owner wants to leave, they must delete the project.
- Use `deleteMany({ where: { id: memberId, projectId } })` for safe scoped deletion.

## Out of Scope

- Role changes (promoting Collaborator to Owner).
- Ownership transfer.
- Batch removal.
- UI for managing members (Feature 42).

## Future Modifications

- Feature 42: Builds the member management UI that calls these APIs.

## Acceptance Criteria

- [ ] `GET /api/projects/[projectId]/members` returns all members for Owner or Collaborator.
- [ ] Non-members get 404 on the list endpoint.
- [ ] Owner can remove any Collaborator.
- [ ] Collaborator can remove themselves.
- [ ] Owner cannot be removed — returns 400.
- [ ] Non-owners cannot remove other Collaborators — returns 404.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- All CodeRabbit reviews must pass. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
