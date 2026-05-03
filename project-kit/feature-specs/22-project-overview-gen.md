# 22 - Project Overview Generation

## Goal

Generate `context/project-overview.md` for the exported project package.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Context7 IDs for technologies being considered in the project overview.

Use installed Context7 skills or:

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Implementation

- Create prompt for project overview generation.
- Use `callAI('project_overview_md')`.
- Include problem, users, goals, core flow, features, scope, success criteria, and the research basis for major decisions.
- Include the user's technology preferences and the fact that the final stack is selected through research and approval.
- Summarize which research files/assets influenced the project overview.
- Persist as ContextFile type `PROJECT_OVERVIEW`.
- Allow preview and edits before ZIP export.
- Use `db` for generated context-file upserts.
- Use the `[projectId, fileType]` context-file lookup path from Feature 03.
- Do not rewrite unrelated context files when only project overview regenerates.

## Scope Limits

- Do not implement later feature specs early.
- Do not introduce undocumented architecture changes.
- Do not bypass the storage, auth, AI, or Context7 rules in the context files.

## Check When Done

- The feature works within its defined scope.
- Relevant library docs were checked with Context7.
- Generated overview does not assume Foundrie's own stack.
- Types are strict and external input is validated.
- Access control is enforced where data is read or mutated.
- `context/progress-tracker.md` is updated.
- `npm run build` passes once application code exists.
- All CodeRabbit reviews must pass. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
