# Feature 22 - Project Overview Generation

## Type

NEW FEATURE

## What This Delivers

Generation of `context/project-overview.md` for the exported project package: problem, users, goals, core flow, features, scope, success criteria, and the research basis for major decisions, persisted as a `ContextFile` of type `PROJECT_OVERVIEW` with preview/edit before ZIP export. This is the first of the six context-file generators (Features 22–25, 28–29).

## Dependencies

- Feature 13 (Architecture Proposal) and Feature 06 (Layout Shell) must be complete.
- The diagram-first gate (Features 18–21) governs when full generation runs; the overview can draft from approved requirements/architecture.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Context7 IDs for technologies being considered in the project overview.

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `lib/generation/project-overview.ts`
- `app/api/context-files/[projectId]/generate/route.ts` (PROJECT_OVERVIEW branch)
- `lib/ai/prompts/project-overview.ts`

## Files

CREATE: `lib/generation/project-overview.ts` and `lib/ai/prompts/project-overview.ts`.
CREATE: `app/api/context-files/[projectId]/generate/route.ts` - generation route (shared across context-file generators).
MODIFY: `context/progress-tracker.md` - mark feature progress.

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.


- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens, executable `npm run security:all` gates) is also baked into the generated projects, ensuring they are premium products.


- Use the current AI rotation contract: `callAI('project_overview_md', { systemPrompt, userPrompt, plan, maxTokens })`; success is `status: "ok"` with `text`, and exhaustion is `status: "queued"`. Include problem, users, goals, core flow (the 8-phase shape where relevant), features, scope, success criteria, and the research basis for major decisions.
- Use the current Prisma schema: `Project.executionPlans` is a list relation; approved architecture is the latest `ExecutionPlan` with `status: "APPROVED"` and Markdown `content`; `ResearchDocument` has `title`, `sourceType`, and `content` (no `summary` or `category` fields).
- Include the user's technology preferences and state that the final stack is selected through research and approval. Summarize which research files/assets influenced the overview (cite `research/` paths).
- Persist as `ContextFile` type `PROJECT_OVERVIEW`. Allow preview and edits before ZIP export. Use `db` for upserts via the `[projectId, fileType]` lookup. Do not rewrite unrelated context files when only the overview regenerates.
- Do not assume Foundrie's own stack for the generated project.

## Out of Scope

- The other context files (Features 23–25, 28–29), feature specs (Feature 26), and ZIP packaging (Feature 30).

## Future Modifications

- Feature 30: The overview is included in the ZIP `context/` folder.
- Feature 23+: Sibling generators reuse the shared generation route.

## Quality Gates

- Run `npm run test` and ensure it passes.
- Run `npm run build` and ensure it passes.
- Run `npm run security:all` and ensure it passes before push.

## Acceptance Criteria

- [ ] `context/project-overview.md` is generated and persisted as `PROJECT_OVERVIEW`.
- [ ] The generated overview does not assume Foundrie's own stack.
- [ ] The overview cites the research files/assets that influenced it.
- [ ] Preview and edit work before export; unrelated context files are not rewritten.
- [ ] Non-owner access returns 404.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
