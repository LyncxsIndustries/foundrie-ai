# 23 - Architecture Context Generation

## Goal

Generate `context/architecture-context.md` for the exported package.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Context7 IDs for every candidate framework/library in the selected project stack.
- Prisma `/prisma/web` only when Prisma is a candidate or selected dependency.

Use installed Context7 skills or:

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Implementation

- Use requirements, architecture proposal, diagrams, and ADRs as input.
- Use the research corpus as input: project research docs, technical comparisons, scraped source summaries, visual/motion analyses, and Context7 findings.
- Use `callAI('architecture_context_md')`.
- Include stack, boundaries, data/storage, API map, invariants, and risks.
- Generate a researched stack decision section:
  - user preferences.
  - candidate technologies considered.
  - Context7 and official version/install evidence.
  - selected stack and version strategy.
  - why the stack fits this project.
  - why rejected alternatives were not selected.
- Do not copy Foundrie's own Next.js/TypeScript/Tailwind stack unless the user chose it or the research justifies it.
- When the exported project has authentication, explicitly separate authentication from authorization.
- When the exported project has user-owned data, include the ownership invariant: every user-owned read/update/delete is scoped by authenticated local user ID and ownership failures return 404.
- Do not generate team/workspace RBAC, RLS, ABAC, audit logs, or custom admin architecture unless project requirements explicitly need them.
- Reference relevant `research/` paths where architecture decisions depend on external research or visual/motion constraints.
- Persist as ContextFile type `ARCHITECTURE_CONTEXT`.
- Use `dbRead` for large diagram/spec context reads when immediate read-after-write consistency is not required.
- Select only diagram metadata unless architecture generation explicitly needs React Flow JSON.
- Use `dbWrite` for the final context-file upsert.

## Scope Limits

- Do not implement later feature specs early.
- Do not introduce undocumented architecture changes.
- Do not bypass the storage, auth, AI, or Context7 rules in the context files.

## Check When Done

- The feature works within its defined scope.
- Relevant library docs were checked with Context7.
- Types are strict and external input is validated.
- Access control is enforced where data is read or mutated.
- Generated architecture context includes auth/authorization rules only when relevant to the exported project.
- Generated architecture context records the approved project-specific stack and version research.
- Generated architecture context does not assume the project is web, React, Next.js, TypeScript, Tailwind, or GSAP.
- Generated architecture context does not over-engineer RBAC or enterprise security without explicit requirements.
- `context/progress-tracker.md` is updated.
- `npm run build` passes once application code exists.
