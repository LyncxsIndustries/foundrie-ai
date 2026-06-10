# Feature 34 - Project Settings

## Type

NEW FEATURE

## What This Delivers

Project-level controls for rename, description updates, deletion with confirmation, section regeneration (requirements, diagrams, context files, feature specs, ZIP), research-synthesis regeneration without deleting raw assets, and stale ZIP cache clearing. Every action is owner-scoped.

## Dependencies

- Feature 04 (Project CRUD) must be complete.
- The generation features (11, 18–21, 22–31) provide the sections this page regenerates.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Clerk `/clerk/clerk-docs`
- Prisma `/prisma/web`

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `app/(app)/projects/[projectId]/settings/page.tsx`
- `components/project/ProjectSettings.tsx`

## Files

CREATE: `app/(app)/projects/[projectId]/settings/page.tsx` and `components/project/ProjectSettings.tsx`.
MODIFY: `context/progress-tracker.md` - mark feature progress.

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.


- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens) is also baked into the generated projects, ensuring they are premium products.


- Support rename and description updates, project deletion with confirmation, regenerating selected sections (requirements, diagrams, context files, feature specs, ZIP), regenerating research synthesis without deleting raw uploaded/captured assets, and clearing stale ZIP metadata.
- Protect every action by owner access (`requireProjectOwner` once Feature 36 exists; until then, owner-scoped queries). Use `db` for all settings mutations.
- Delete projects through cascading relations from Feature 03. Use transactions for destructive operations that also clean generated metadata. Do not delete Blob artifacts inside the request path if it risks timeout — queue cleanup in a background task. Research assets are deleted only through owner-scoped project deletion or explicit research cleanup, never accidentally during context/spec regeneration.
- After rename or regeneration, update `updatedAt` and any affected denormalized counters. Regeneration that re-runs the diagram-first gate must follow the scope-change protocol (Impact Analysis, diagram versioning, CHANGE_LOG, ADR) where applicable.

## Out of Scope

- Collaboration APIs and UI (Features 37–38, 42).
- Billing/subscription management UI (later billing feature).

## Future Modifications

- Feature 37: Invite collaborator API is added to settings.
- Feature 38: List/remove collaborators API is added to settings.
- Feature 42: Sharing UI adds a member-management modal.

## Acceptance Criteria

- [ ] Owner can rename, edit description, and delete (with confirmation).
- [ ] Owner can regenerate requirements, diagrams, context files, feature specs, and ZIP.
- [ ] Research synthesis regenerates without deleting raw research assets.
- [ ] Stale ZIP metadata can be cleared.
- [ ] Destructive operations use transactions; Blob cleanup is queued, not inline.
- [ ] All actions are owner-scoped; non-owners get 404.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
