# 25 - Code Standards Generation

## Goal

Generate `context/code-standards.md` for the exported package.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Context7 IDs for the selected project stack.
- Prisma `/prisma/web` only when Prisma is selected.
- Next.js `/vercel/next.js` only when Next.js is selected.

Use installed Context7 skills or:

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Implementation

- Use selected stack and architecture decisions.
- Use `callAI('code_standards_md')`.
- Treat root `ARTKINS_STYLE_GUIDE.md` as the authoritative full policy for the generated project.
- Generate `context/code-standards.md` as project-specific constraints that extend the full guide rather than summarizing or replacing it.
- Use the exported project's approved stack. Do not assume Foundrie's own stack.
- Include TypeScript, framework, API, data, testing, file organization, approval-gated planning, and no-AI-slope enforcement rules.
- Include latest-version research rules for any package or framework install.
- Persist as ContextFile type `CODE_STANDARDS`.
- The generated standards must preserve Foundrie's Neon rules when the exported project uses Neon: pooled runtime URL, direct migration URL, indexed foreign keys, cursor pagination, and no N+1 query loops.
- When the exported project has auth, generated standards must preserve the separation of authentication and authorization.
- When the exported project has user-owned data, generated standards must require owner-scoped queries, never trusting `userId` from request input, 404 on ownership failure, and focused auth/ownership tests.
- Generated standards must require a mandatory **CodeRabbit review** as a pre-push gate for every feature, with a requirement to fix findings by checking official documentation (Context7) rather than relying on AI training data.
- Generated standards must require a user-approved plan before implementation-impacting work.
- When the exported project supports collaboration, generated standards must enforce the **Owner/Collaborator** 2-role authorization model.
- Generated standards must forbid premature enterprise RBAC, custom admin portals, RLS, ABAC, audit logging, or hardware-key admin unless the requirements explicitly need them.
- Use `db` for the context-file upsert.

## Scope Limits

- Do not implement later feature specs early.
- Do not introduce undocumented architecture changes.
- Do not bypass the storage, auth, AI, or Context7 rules in the context files.

## Check When Done

- The feature works within its defined scope.
- Relevant library docs were checked with Context7.
- Types are strict and external input is validated.
- Access control is enforced where data is read or mutated.
- Generated code standards include the auth/authorization ownership rules when relevant.
- Generated code standards keep enterprise security out of scope unless required.
- Generated code standards point to root `ARTKINS_STYLE_GUIDE.md` as the full policy and do not duplicate it as a reduced summary.
- Generated code standards require planning, approval, revision support, and then execution.
- Generated code standards adapt to the selected project stack and do not assume web, React, Next.js, TypeScript, Tailwind, or GSAP.
- Generated code standards require Context7 and official version checks before package versions are committed.
- `context/progress-tracker.md` is updated.
- `npm run build` passes once application code exists.
- All CodeRabbit reviews must pass. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
