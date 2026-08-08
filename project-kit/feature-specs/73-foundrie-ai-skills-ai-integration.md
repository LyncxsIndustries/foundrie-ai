# Feature 73 - Foundrie AI Skills AI Integration

## Type

ENHANCEMENT

## What This Delivers

Integration of Foundrie AI Skills into the AI generation pipeline. Ensures agents are aware of and utilize UI skills (image-to-code, imagegen-frontend, UI design) when building features and generating code. Applies high-end visual design patterns automatically during UI generation.

## Dependencies

- Feature 05 (AI Rotation Engine) - provides the AI orchestration layer
- Feature 10 (Discovery Chat) - uses AI for conversation
- Feature 11 (Requirements Generation) - uses AI for synthesis
- `.agents/skills/` directory with installed Foundrie AI Skills

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ai-workflow-rules.md`
- `context/code-standards.md`
- `context/ui-rules.md`
- `context/ui-registry.md`
- `.agents/skills/` - all installed Foundrie AI Skills

## Context7 Docs To Check

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `lib/ai/skills/loader.ts`
- `lib/ai/skills/types.ts`

## Files

CREATE: `lib/ai/skills/loader.ts` - Skills loader and context injector
CREATE: `lib/ai/skills/types.ts` - TypeScript types for skills
MODIFY: `lib/ai/rotation-engine.ts` - Inject skills context into AI calls
MODIFY: `lib/ai/prompts/discovery.ts` - Reference available skills
MODIFY: `lib/ai/prompts/requirements.ts` - Reference available skills for UI generation

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch.

- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens, executable `npm run security:all` gates) is also baked into the generated projects, ensuring they are premium products.

- Read all `.agents/skills/*/SKILL.md` files at application startup or on-demand
- Inject skills context into AI prompts as a system-level capability reference
- Skills should inform:
  - Image-to-code conversion when screenshots are uploaded
  - UI component generation based on design patterns
  - Frontend code generation with premium aesthetics
  - Layout and styling recommendations
- Skills are reference material, not executable code
- Document which skills are available in the AI prompt context
- Ensure skills context is included in both `callAI` and `callAIStream` flows

## Out of Scope

- Automatic skill execution or sandboxing
- User-facing skill management UI
- Custom skill creation by users
- Skills for backend/infrastructure generation (focus is UI/frontend)

## Future Modifications

- Feature 72 (Foundrie AI Skills Context Sync) - ensures skills docs stay synchronized with implementation
- Future features may add skill management UI
- Skills may be extended to cover backend/API generation patterns

## Quality Gates

- Run `npm run test` and ensure it passes
- Run `npm run build` and ensure it passes
- Run `npm run security:all` and ensure it passes before push

## Acceptance Criteria

- [ ] Skills loader reads all `.agents/skills/*/SKILL.md` files
- [ ] Skills context is injected into AI rotation engine prompts
- [ ] Discovery chat references available skills when discussing UI
- [ ] Requirements generation uses skills for UI recommendations
- [ ] Skills context is included in both streaming and non-streaming AI calls
- [ ] `.agents/` directory is added to `.gitignore` (not committed to repo)
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch
- [ ] `npm run build` passes
- [ ] CodeRabbit review completed and all findings resolved (recommended quality gate)
