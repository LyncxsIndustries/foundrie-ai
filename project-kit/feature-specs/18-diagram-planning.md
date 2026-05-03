# 18 - Diagram Planning

## Goal

Use AI to plan exactly which diagrams a project needs.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Trigger.dev `/triggerdotdev/trigger.dev`
- Prisma `/prisma/web`

Use installed Context7 skills or:

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Implementation

- Create `planDiagramJobs(projectContext)`.
- Use architecture context and requirements as input.
- Return ordered jobs grouped by category.
- Generate folder paths and file names.
- Validate planner output with Zod.
- Persist planned Diagram records as queued jobs.
- Use a transaction when creating multiple Diagram records so the planned job set is all-or-nothing.
- Update Project `diagramCount` in the same mutation path that creates diagram records.
- Use `db` for job creation and status initialization.
- Preserve `orderInCategory` so category display uses the `[projectId, category, orderInCategory]` index.

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
