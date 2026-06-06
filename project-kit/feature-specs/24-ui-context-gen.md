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

- Use project type and target audience as input, plus any visual analysis and motion plans from research (cite `research/` paths). Use `callAI('ui_component_specs')` or a dedicated UI task.
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
- [ ] `context/progress-tracker.md` is updated.
- [ ] `npm run build` passes.
- All CodeRabbit reviews must pass. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
