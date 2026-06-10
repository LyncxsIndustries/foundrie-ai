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

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.


- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens) is also baked into the generated projects, ensuring they are premium products.


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
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
