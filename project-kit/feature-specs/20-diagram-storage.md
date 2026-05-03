# 20 - Diagram Storage

## Goal

Persist diagram data and generated PNGs.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Vercel Storage `/vercel/storage`
- Prisma `/prisma/web`

Use installed Context7 skills or:

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Implementation

- Store React Flow node/edge JSON on Diagram records.
- Upload PNGs to Vercel Blob.
- Store PNG URL/path and generated timestamp.
- Add signed or access-checked retrieval where needed.
- Add error placeholder behavior for failed captures.
- Use `db` for diagram status, PNG URL, and generated timestamp mutations.
- Update Project `completedDiagramCount` when a diagram transitions to `DONE`.
- Do not fetch `reactFlowNodes` or `reactFlowEdges` in list views. Select those large JSON columns only when editing or generating a specific diagram.
- Ensure status-list queries benefit from the partial `idx_diagrams_generating` index created in Feature 03.

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
