# 24 - UI Context Generation

## Goal

Generate `context/ui-context.md` with design system guidance.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Tailwind `/tailwindlabs/tailwindcss.com`
- shadcn/ui `/shadcn-ui/ui`

Use installed Context7 skills or:

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Implementation

- Use project type and target audience as input.
- Use `callAI('ui_component_specs')` or dedicated UI generation task.
- Include tokens, typography, layout patterns, components, and interaction rules.
- Persist as ContextFile type `UI_CONTEXT`.
- Use `dbWrite` for the context-file upsert.
- Read existing project/context inputs through indexed project and context-file lookups.

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
