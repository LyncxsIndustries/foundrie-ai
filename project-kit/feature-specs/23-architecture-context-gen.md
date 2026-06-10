# Feature 23 - Architecture Context Generation

## Type

NEW FEATURE

## What This Delivers

Generation of `context/architecture-context.md` for the exported package from requirements, the architecture proposal, the approved diagrams, ADRs, and the research corpus. It records the researched, user-approved, project-specific stack (never defaulting to Foundrie's own), with version evidence and rejected alternatives, plus boundaries, data/storage, API map, security layers, invariants, and risks.

## Dependencies

- Feature 22 (Project Overview Generation) must be complete (shared generation route exists).
- The diagram suite (Features 18–21) must be approved so diagrams feed the API map and boundaries.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Context7 IDs for every candidate framework/library in the selected project stack.
- Prisma `/prisma/web` only when Prisma is a candidate or selected dependency.

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `lib/generation/architecture-context.ts`
- `lib/ai/prompts/architecture-context.ts`

## Files

CREATE: `lib/generation/architecture-context.ts` and `lib/ai/prompts/architecture-context.ts`.
MODIFY: `app/api/context-files/[projectId]/generate/route.ts` - add the `ARCHITECTURE_CONTEXT` branch.

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.


- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens) is also baked into the generated projects, ensuring they are premium products.


- Use requirements, the architecture proposal, approved diagrams, ADRs, and the research corpus (project research docs, technical comparisons, scraped summaries, visual/motion analyses, Context7 findings). Use the current AI rotation contract: `callAI('architecture_context_md', { systemPrompt, userPrompt, plan, maxTokens })`; success is `status: "ok"` with `text`, and exhaustion is `status: "queued"`.
- Use the current Prisma schema: `Project.executionPlans` is a list relation; approved architecture is the latest `ExecutionPlan` with `status: "APPROVED"` and Markdown `content`; `ResearchDocument` has `title`, `sourceType`, and `content` (no `summary` or `category` fields).
- Include stack, boundaries, data/storage, the API map (from the API Map diagram's OpenAPI export), the seven-layer security mapping, invariants, and risks.
- Generate a researched stack decision section: user preferences; candidate technologies considered; Context7 and official version/install evidence; selected stack and version strategy; why it fits; why rejected alternatives were not selected. Cite sources.
- Do not copy Foundrie's own Next.js/TypeScript/Tailwind stack unless chosen or justified. Do not assume the project is web/React/Next.js/TypeScript/Tailwind/GSAP.
- When the project uses Prisma: enforce the Prisma 7 standard (minimalist `schema.prisma` datasource, URLs in `prisma.config.ts`).
- When the project has authentication: separate authentication (provider) from authorization (application-level scoping). When it has user-owned data: include the ownership invariant (scope by authenticated local user ID; ownership failure returns 404). When it supports collaboration: generate the 2-role Owner/Collaborator model via application-layer helpers, not RLS.
- Do not generate enterprise RBAC, RLS, ABAC, audit logs, or custom admin architecture unless requirements explicitly need them.
- Reference relevant `research/` paths. Persist as `ContextFile` type `ARCHITECTURE_CONTEXT`. Use `db` for large diagram/spec reads when read-after-write is not required; select only diagram metadata unless React Flow JSON is needed; use `db` for the final upsert.

## Out of Scope

- Other context files, feature specs (Feature 26), and ZIP packaging (Feature 30).

## Future Modifications

- Feature 25: Code standards reuse the recorded stack decision.
- Feature 28: AGENTS.md references this file's stack reference.

## Acceptance Criteria

- [ ] `context/architecture-context.md` records the approved project-specific stack with version research and rejected alternatives.
- [ ] It does not assume web/React/Next.js/TypeScript/Tailwind/GSAP.
- [ ] Auth/authorization ownership rules appear only when relevant to the exported project.
- [ ] It does not over-engineer RBAC or enterprise security without explicit requirements.
- [ ] It includes the API map (from the OpenAPI export) and the seven-layer security mapping.
- [ ] Non-owner access returns 404.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
