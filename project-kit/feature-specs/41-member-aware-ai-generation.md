# Feature 41 - Member-Aware AI & Generation Access

## Type

MODIFICATION (modifies Features 10-13, 18-19, 22-29)

## What This Delivers

Extends all AI generation and content routes to authorize both Owner and Collaborator roles using `requireProjectMember()`. Both roles can trigger discovery chat, requirements generation, architecture proposals, diagram generation, context file generation, feature spec generation, and ZIP download.

## Dependencies

- Feature 36 (Authorization Helpers) must be complete before starting.
- Feature 40 (Member-Aware Canvas Access) must be complete before starting.

## Files Owned

- This is a MODIFICATION of Features 10–13, 18–19, and 22–29. It edits existing project API routes to switch shared operations to `requireProjectMember()`. No new exclusive ownership is claimed; coordinate as a labeled modification.

## Files

MODIFY: All `app/api/projects/[projectId]/...` routes that serve AI generation, chat, requirements, architecture, context files, feature specs, and ZIP download — replace owner-only auth checks with `requireProjectMember()`.
MODIFY: `project-kit/context/progress-tracker.md` - Mark feature progress.

## Implementation Notes

- Audit every route under `app/api/projects/[projectId]/` and classify as:
  - **Owner-only** (keep `requireProjectOwner()`): project rename, delete, regenerate settings, member management.
  - **Shared** (switch to `requireProjectMember()`): discovery chat, requirements, architecture, diagrams, context files, feature specs, ZIP download, research library.
- Do not modify project settings or member management routes — those stay owner-only.
- ZIP download authorization: both Owner and Collaborator can download.
- AI generation triggers (Trigger.dev tasks): the task payload should include `triggeredByUserId` for attribution but both roles can trigger.

## Out of Scope

- Per-role generation limits (e.g., Collaborators limited to N generations).
- Generation activity log visible to Owner.
- Notification when a Collaborator triggers generation.

## Future Modifications

- None planned. Per-role generation limits and activity logs are explicitly out of scope for v1.

## Acceptance Criteria

- [ ] Collaborator can trigger discovery chat.
- [ ] Collaborator can trigger requirements generation.
- [ ] Collaborator can trigger architecture proposal.
- [ ] Collaborator can trigger diagram generation.
- [ ] Collaborator can trigger context file and feature spec generation.
- [ ] Collaborator can download ZIP.
- [ ] Owner retains all existing access.
- [ ] Non-members get 404 on all generation routes.
- [ ] Owner-only routes (settings, delete, members) still reject Collaborators with 404.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
