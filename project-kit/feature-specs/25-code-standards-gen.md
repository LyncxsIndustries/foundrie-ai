# Feature 25 - Code Standards Generation

## Type

NEW FEATURE

## What This Delivers

Generation of `context/code-standards.md` for the exported package as project-specific constraints that extend (never summarize or replace) the verbatim root `ARTKINS_STYLE_GUIDE.md`. Standards adapt to the approved stack and encode auth/ownership, Neon rules, logging discipline, dependency security, idempotency, the planning gate, the CodeRabbit pre-push gate, and no-AI-slope enforcement.

## Dependencies

- Feature 23 (Architecture Context Generation) must be complete (the approved stack is recorded).

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Context7 IDs for the selected project stack.
- Prisma `/prisma/web` (when Prisma is selected); Next.js `/vercel/next.js` (when Next.js is selected).

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `lib/generation/code-standards.ts`
- `lib/ai/prompts/code-standards.ts`

## Files

CREATE: `lib/generation/code-standards.ts` and `lib/ai/prompts/code-standards.ts`.
MODIFY: `app/api/context-files/[projectId]/generate/route.ts` - add the `CODE_STANDARDS` branch.

## Implementation Notes

- Use the approved stack and architecture decisions. Use `callAI('code_standards_md')`. Treat root `ARTKINS_STYLE_GUIDE.md` as the authoritative full policy; generate constraints that extend it, never a reduced summary. Do not assume Foundrie's own stack.
- Include TypeScript (or the chosen language), framework, API, data, testing, file organization, the planning gate, and no-AI-slope rules. Include version-research rules for any package/framework install (Context7 + official sources; no `"latest"` model IDs).
- When the project uses Neon: preserve pooled runtime URL, direct migration URL, indexed foreign keys, cursor pagination, no N+1 loops.
- When the project has auth: preserve the separation of authentication and authorization. When it has user-owned data: require owner-scoped queries, never trusting `userId` from request input, 404 on ownership failure, and focused auth/ownership tests. When it supports collaboration: enforce the Owner/Collaborator 2-role model.
- Require structured JSON logging (no `console.log` in production paths), request IDs, and PII scrubbing. Require dependency security (audit as a hard gate, lock-file committed, Dependabot, monthly cadence). Require idempotency rules (Stripe keys, email guards, upsert, task-ID idempotency, buttons disable on click).
- Require a mandatory CodeRabbit review pre-push gate, fixing findings via official docs (Context7) not AI training data. Require a user-approved plan before implementation-impacting work.
- Forbid premature enterprise RBAC, custom admin portals, RLS, ABAC, audit logging, or hardware-key admin unless requirements explicitly need them.
- Persist as `ContextFile` type `CODE_STANDARDS`. Use `db` for the upsert.

## Out of Scope

- Other context files, feature specs, and ZIP packaging.

## Future Modifications

- Feature 28: AGENTS.md references these standards.

## Acceptance Criteria

- [ ] `context/code-standards.md` points to root `ARTKINS_STYLE_GUIDE.md` as the full policy and extends it without summarizing.
- [ ] Standards adapt to the selected stack and do not assume web/React/Next.js/TypeScript/Tailwind/GSAP.
- [ ] Auth/ownership, Neon, logging, dependency-security, and idempotency rules appear when relevant.
- [ ] Standards require planning + approval, the CodeRabbit pre-push gate, and Context7/official version checks before committing versions.
- [ ] Standards keep enterprise security out of scope unless required.
- [ ] Non-owner access returns 404.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
