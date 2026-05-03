# 01 - Design System

## Goal

Initialize the visual and component foundation for the Foundrie app.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Next.js `/vercel/next.js`
- Tailwind `/tailwindlabs/tailwindcss.com`
- shadcn/ui `/shadcn-ui/ui`

Use installed Context7 skills or:

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Implementation

- Create the Next.js 16 TypeScript app structure if it does not exist.
- Install Tailwind CSS v4, shadcn/ui, Lucide React, and Framer Motion.
- Define Foundrie CSS variables in `globals.css` and map them to Tailwind tokens.
- Install shadcn primitives: Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea, DropdownMenu, Tooltip, Badge, Separator, Sheet, Progress, Skeleton.
- Create `lib/utils.ts` with `cn()`.
- Create base surfaces for dashboard, project shell, document review, and diagram workspace.

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
