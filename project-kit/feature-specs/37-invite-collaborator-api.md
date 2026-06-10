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

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.


- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens) is also baked into the generated projects, ensuring they are premium products.


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
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
