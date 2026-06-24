# Feature 40 - Member-Aware Canvas Access

## Type

MODIFICATION (modifies Feature 14: React Flow Canvas, Feature 33: Liveblocks Presence)

## What This Delivers

Extends Liveblocks room authorization and diagram CRUD routes to authorize both Owner and Collaborator roles. Both roles can view, create, edit, and delete diagrams on the canvas.

## Dependencies

- Feature 14 (React Flow Canvas) must be complete before starting.
- Feature 33 (Liveblocks Presence) must be complete before starting.
- Feature 36 (Authorization Helpers) must be complete before starting.

## Files Owned

- This is a MODIFICATION of Features 14 and 33. It edits the Liveblocks auth route and diagram CRUD routes to use `requireProjectMember()`. No new exclusive ownership is claimed; coordinate as a labeled modification.

## Files

MODIFY: `app/api/liveblocks-auth/route.ts` (or equivalent Liveblocks auth endpoint) - Use `requireProjectMember()`.
MODIFY: `app/api/projects/[projectId]/diagrams/route.ts` - Use `requireProjectMember()` for list and create.
MODIFY: `app/api/projects/[projectId]/diagrams/[diagramId]/route.ts` - Use `requireProjectMember()` for read, update, delete.
MODIFY: `project-kit/context/progress-tracker.md` - Mark feature progress.

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.


- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens, executable `npm run security:all` gates) is also baked into the generated projects, ensuring they are premium products.


- Replace existing owner-only checks in diagram routes with `requireProjectMember()`.
- Liveblocks room auth endpoint must check `requireProjectMember()` before granting room access.
- The Liveblocks user info payload should include the user's role (`OWNER` or `COLLABORATOR`) so the canvas UI can conditionally show controls.
- Both Owner and Collaborator can create, edit, and delete diagrams.
- Both roles see live cursors and presence from other members.

## Out of Scope

- Restricting specific diagram operations by role (all canvas operations are equal for both roles).
- Canvas-level permissions (e.g., locking specific nodes).
- Notification when a collaborator makes a change.

## Future Modifications

- None planned. Member-aware AI/generation access is handled separately in Feature 41.

## Quality Gates

- Run `npm run test` and ensure it passes.
- Run `npm run build` and ensure it passes.
- Run `npm run security:all` and ensure it passes before push.

## Acceptance Criteria

- [ ] Owner can access canvas and CRUD diagrams (existing behavior preserved).
- [ ] Collaborator can access canvas and CRUD diagrams.
- [ ] Non-members get 404 on canvas and diagram routes.
- [ ] Liveblocks room auth grants access to both Owner and Collaborator.
- [ ] Live presence shows both Owner and Collaborator cursors.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
