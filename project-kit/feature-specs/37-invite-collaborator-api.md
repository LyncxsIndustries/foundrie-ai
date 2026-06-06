# Feature 37 - Invite Collaborator API

## Type

NEW FEATURE

## What This Delivers

Adds the API endpoint for project owners to invite collaborators by email. The invited user must already have a Clerk account and a synced local `User` record.

## Dependencies

- Feature 04 (Project CRUD) must be complete before starting.
- Feature 35 (Project Member Schema) must be complete before starting.
- Feature 36 (Authorization Helpers) must be complete before starting.

## Files Owned

- `app/api/projects/[projectId]/members/route.ts`

## Files

CREATE: `app/api/projects/[projectId]/members/route.ts` - POST handler for inviting.
MODIFY: `project-kit/context/progress-tracker.md` - Mark feature progress.

## Implementation Notes

- `POST /api/projects/[projectId]/members` accepts `{ email: string }`.
- Gate with `requireProjectOwner()` — only owners can invite.
- Validate with Zod: email must be a valid email string.
- Look up the target user by email in the local `User` table.
- If user not found, return 404 with `message: "User not found. They must sign up first."`.
- If user is the project owner, return 400 with `message: "Cannot invite yourself."`.
- If membership already exists, return 409 with `message: "User is already a member."`.
- Create `ProjectMember` with `role: COLLABORATOR`, `invitedByUserId: authUser.id`, `joinedAt: now()`.
- Return 201 with the created membership.

## Out of Scope

- Email notifications or invite links.
- Pending/accepted invite states.
- Inviting users who don't have Clerk accounts.
- Batch invites.
- UI for inviting (Feature 42).

## Future Modifications

- Feature 42: Builds the sharing UI modal that calls this API.

## Acceptance Criteria

- [ ] Owner can invite a user by email and a `ProjectMember` row is created.
- [ ] Non-owners get 404 when attempting to invite.
- [ ] Self-invite returns 400.
- [ ] Duplicate invite returns 409.
- [ ] Unknown email returns 404.
- [ ] Input is validated with Zod.
- [ ] `npm run build` passes.
- All CodeRabbit reviews must pass. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
