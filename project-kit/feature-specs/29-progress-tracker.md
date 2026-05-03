# 29 - Progress Tracker Generation

## Goal

Generate and maintain `context/progress-tracker.md` for exported packages.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Prisma `/prisma/web`

Use installed Context7 skills or:

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Implementation

- Generate tracker from project phase, completed specs, open questions, decisions, and research status.
- Include notable research documents/assets that are required for implementation.
- Update tracker when features are generated or reviewed.
- Include implementation status that a coding agent can resume from.
- Persist as ContextFile type `PROGRESS_TRACKER`.
- Use `db` for tracker updates.
- Use the `[projectId, fileType]` index when reading or updating the progress tracker context file.
- Avoid rewriting all context files when only progress changes.

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
- All CodeRabbit reviews must pass. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
