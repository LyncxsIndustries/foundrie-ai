# Feature 39 - Shared Projects in Dashboard

## Type

MODIFICATION (modifies Feature 04: Project CRUD)

## What This Delivers

Extends the project list API and dashboard UI to show both "My Projects" (owned) and "Shared With Me" (collaborator) sections. Collaborators see shared projects in their dashboard but cannot access project settings or delete.

## Dependencies

- Feature 04 (Project CRUD) must be complete before starting.
- Feature 06 (Layout Shell) must be complete before starting.
- Feature 36 (Authorization Helpers) must be complete before starting.
- Feature 38 (List & Remove Collaborators API) must be complete before starting.

## Files

MODIFY: `app/api/projects/route.ts` - Extend GET to return owned and shared projects.
MODIFY: `app/(app)/dashboard/page.tsx` - Show "My Projects" and "Shared With Me" sections.
MODIFY: `project-kit/context/progress-tracker.md` - Mark feature progress.

## Implementation Notes

- Extend `GET /api/projects` to return `{ owned: Project[], shared: Project[] }`.
- Owned projects: `WHERE userId = authUser.id` (existing behavior).
- Shared projects: Join through `ProjectMember WHERE userId = authUser.id AND role = COLLABORATOR`, include project owner name.
- Both lists use cursor pagination independently.
- Dashboard UI renders two sections with clear visual distinction.
- Shared project cards show the owner's name and a "Shared" badge.
- Shared project cards do not show delete or settings actions.
- Clicking a shared project navigates to the project workspace (canvas).

## Out of Scope

- Filtering or sorting shared projects.
- Notification when invited to a project.
- Unread indicators on shared projects.

## Future Modifications

- Feature 42: Adds "Share" button visible only to Owners.

## Acceptance Criteria

- [ ] `GET /api/projects` returns both `owned` and `shared` arrays.
- [ ] Shared projects include the owner's name.
- [ ] Dashboard shows both sections.
- [ ] Shared project cards show "Shared" badge and owner name.
- [ ] Shared project cards hide delete and settings actions.
- [ ] `npm run build` passes.
- All CodeRabbit reviews must pass. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
