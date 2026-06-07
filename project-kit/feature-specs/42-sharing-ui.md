# Feature 42 - Sharing UI

## Type

NEW FEATURE

## What This Delivers

Adds the user-facing sharing interface: a "Share" button in the project header (visible to Owner only), a sharing modal with email invite input, a list of current members with remove controls, and member avatars in the project header visible to all roles.

## Dependencies

- Feature 06 (Layout Shell) must be complete before starting.
- Feature 37 (Invite Collaborator API) must be complete before starting.
- Feature 38 (List & Remove Collaborators API) must be complete before starting.
- Feature 39 (Shared Projects Dashboard) must be complete before starting.

## Files Owned

- `components/project/share-modal.tsx`
- `components/project/member-avatars.tsx`

## Files

CREATE: `components/project/share-modal.tsx` - Sharing dialog with invite form and member list.
CREATE: `components/project/member-avatars.tsx` - Avatar stack for project header.
MODIFY: `components/project/project-header.tsx` (or equivalent) - Add Share button and member avatars.
MODIFY: `project-kit/context/progress-tracker.md` - Mark feature progress.

## Implementation Notes

- "Share" button is visible only when `getProjectRole()` returns `OWNER`.
- Share modal opens with:
  - Email input + "Invite" button → calls `POST /api/projects/[projectId]/members`.
  - Current members list with name, email, role badge, and "Remove" button.
  - Owner shows "Owner" badge (non-removable). Collaborators show "Remove" button.
  - Remove button calls `DELETE /api/projects/[projectId]/members/[memberId]`.
  - Error states: "User not found", "Already a member", "Cannot invite yourself".
- Member avatars component:
  - Shows in the project header for all roles.
  - Displays avatar stack (Clerk user images) with overflow "+N" indicator.
  - Clicking opens the share modal (for Owner) or a read-only member list (for Collaborator).
- Use shadcn/ui Dialog for the modal.
- Use Lucide icons for share/invite actions.
- Dark theme consistent with `ui-context.md`.

## Out of Scope

- Email notifications for invites.
- Invite-by-link.
- Pending invite states.
- Role change UI (promoting Collaborator to Owner).
- Ownership transfer UI.

## Future Modifications

- None planned for v1. Role changes, ownership transfer, invite-by-link, and email notifications are deferred to a later collaboration feature.

## Acceptance Criteria

- [ ] Owner sees "Share" button in project header.
- [ ] Collaborator does not see "Share" button.
- [ ] Share modal allows inviting by email.
- [ ] Share modal shows current members with roles.
- [ ] Owner can remove Collaborators from the modal.
- [ ] Collaborator sees member list in read-only mode.
- [ ] Member avatars display in project header for all roles.
- [ ] Error states display correctly (not found, already member, self-invite).
- [ ] UI follows dark theme from `ui-context.md`.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- All CodeRabbit reviews must pass. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
