# 34 - Project Settings

## Goal

Add project-level controls for rename, delete, regenerate, and export cache management.

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

Use installed Context7 skills or:

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Implementation

- Create settings page.
- Support rename and description updates.
- Support project deletion with confirmation.
- Support regenerating selected sections: requirements, diagrams, context files, feature specs, ZIP.
- Support regenerating research synthesis without deleting raw uploaded/captured research assets.
- Support clearing stale ZIP metadata.
- Protect every action by owner access.
- Use `dbWrite` for all settings mutations.
- Delete projects through cascading relations defined in Feature 03.
- Use transactions for destructive operations that also clean generated metadata.
- Do not directly delete Blob artifacts inside the request path if it risks timeout; queue cleanup in a background task.
- Research assets must be deleted through owner-scoped project deletion or explicit later research cleanup work, not accidentally during context/spec regeneration.
- After rename or regeneration, update `updatedAt` and any denormalized counters affected by the change.

## Scope Limits

- Do not implement later feature specs early.
- Do not introduce undocumented architecture changes.
- Do not bypass the storage, auth, AI, or Context7 rules in the context files.

## Check When Done

- The feature works within its defined scope.
- Relevant library docs were checked with Context7.
- Types are strict and external input is validated.
- Access control is enforced where data is read or mutated.
- `context/progress-tracker.md` is updated.
- `npm run build` passes once application code exists.
