# 06 - Layout Shell

## Goal

Build the authenticated app shell, dashboard, project phase navigation, and empty phase pages.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Next.js `/vercel/next.js`
- shadcn/ui `/shadcn-ui/ui`

Use installed Context7 skills or:

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Implementation

- Create `(app)/layout.tsx` with sidebar and top nav.
- Create dashboard page with project cards and phase statuses.
- Create project route group with pages: overview, discovery, requirements, architecture, diagrams, specs, export.
- Create `ProjectPhaseNav`.
- Add responsive behavior without turning the app into a landing page.
- Dashboard data must use the indexed project list path from Feature 03: `userId`, `updatedAt`, and denormalized counters.
- Use cursor pagination for project lists.
- Avoid loading heavy child collections on the dashboard; fetch summaries only.

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
