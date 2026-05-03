# 12 - Requirements Review UI

## Goal

Build review surfaces for generated requirements and architecture decisions.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- shadcn/ui `/shadcn-ui/ui`
- Next.js `/vercel/next.js`

Use installed Context7 skills or:

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Implementation

- Create editable requirements sections.
- Show functional requirements, NFRs, hidden requirements, and scale estimates.
- Show ADR log.
- Allow user edits before diagram planning.
- Persist edits through APIs with ownership checks.
- Use `db` for edits and strong read-after-write refresh.
- Fetch only the requirements row needed for the active project.
- Avoid repeatedly loading full conversation history on the review page.

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
