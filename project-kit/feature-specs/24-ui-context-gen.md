# Feature 24 - UI Context Generation

## Type

NEW FEATURE

## What This Delivers

Generation of `context/ui-context.md` with design-system guidance for the exported project: tokens, typography, layout patterns, components, motion rules, accessibility, and interaction rules, derived from project type, target audience, and any Figma/visual research. Persisted as a `ContextFile` of type `UI_CONTEXT`.

## Dependencies

- Feature 23 (Architecture Context Generation) must be complete (the stack is known).
- Feature 08 (Visual/Motion Research Analysis) provides design tokens and motion plans when present.

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
- GSAP `/websites/gsap` (when the project uses GSAP)

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `lib/generation/ui-context.ts`
- `lib/ai/prompts/ui-context.ts`

## Files

CREATE: `lib/generation/ui-context.ts` and `lib/ai/prompts/ui-context.ts`.
MODIFY: `app/api/context-files/[projectId]/generate/route.ts` - add the `UI_CONTEXT` branch.

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.


- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens) is also baked into the generated projects, ensuring they are premium products.


- Use project type and target audience as input, plus any visual analysis and motion plans from research (cite `research/` paths). Use the current AI rotation contract: `callAI('ui_component_specs', { systemPrompt, userPrompt, plan, maxTokens })`; success is `status: "ok"` with `text`, and exhaustion is `status: "queued"`.
- Use the current Prisma schema for research inputs: `ResearchDocument` has `title`, `sourceType`, and `content`; `ResearchAsset` stores Blob metadata and analysis previews in `metadata`, not custom scalar summary fields.
- Include color tokens, typography, layout patterns, components, accessibility rules (44×44px touch targets, ARIA, keyboard), Core Web Vitals targets, and interaction rules. When the project uses GSAP, include the GSAP rules (module-level registration, `useLayoutEffect`, `gsap.context()`, `ctx.revert()`, transform/opacity + `force3D`). When Figma research exists, derive tokens from it and note the bidirectional sync expectation.
- Do not assume the project is web unless the architecture context says so; adapt to mobile/desktop/etc.
- Persist as `ContextFile` type `UI_CONTEXT`. Use `db` for the upsert via the `[projectId, fileType]` index.

## Out of Scope

- Other context files, feature specs, and ZIP packaging.

## Future Modifications

- Feature 26: UI feature specs reference these tokens and motion plans.
- Feature 30: The file is included in the ZIP `context/` folder.

## Acceptance Criteria

- [ ] `context/ui-context.md` is generated with tokens, typography, layout, components, accessibility, and interaction rules.
- [ ] GSAP rules are included when the project uses GSAP; visual-research tokens are cited when present.
- [ ] It adapts to the project's platform rather than assuming web.
- [ ] Non-owner access returns 404.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
