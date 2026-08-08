# Feature 78 - Foundrie AI Skills Context Synchronization

## Type

ENHANCEMENT

## What This Delivers

Finalization of synchronization between Foundrie AI Skills and all Foundrie context/research documentation. Ensures UI tokens, rules, registry, and agent mandates accurately reflect premium UI capabilities. Updates AGENTS.md to require skills usage for UI generation.

## Dependencies

- Feature 67 (Foundrie AI Skills AI Integration) - must be complete before sync
- All UI context files must exist:
  - `context/ui-tokens.md`
  - `context/ui-rules.md`
  - `context/ui-registry.md`
- `AGENTS.md` hard rules
- `research/FOUNDRIE_RESEARCH.md`

## Context To Read First

- `context/project-overview.md`
- `context/ui-tokens.md`
- `context/ui-rules.md`
- `context/ui-registry.md`
- `context/ai-workflow-rules.md`
- `AGENTS.md`
- `research/FOUNDRIE_RESEARCH.md`
- `.agents/skills/` - all installed Foundrie AI Skills

## Context7 Docs To Check

N/A - This is a documentation synchronization feature.

## Files Owned

None - this feature modifies existing context files but does not own them exclusively.

## Files

MODIFY: `context/ui-tokens.md` - sync with skills design system tokens
MODIFY: `context/ui-rules.md` - sync with skills UI behavior patterns
MODIFY: `context/ui-registry.md` - sync with skills component patterns
MODIFY: `AGENTS.md` - add Hard Rule 26 mandating Foundrie AI Skills usage
MODIFY: `research/FOUNDRIE_RESEARCH.md` - document skills integration
MODIFY: `context/progress-tracker.md` - record synchronization completion

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch.

- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens, executable `npm run security:all` gates) is also baked into the generated projects, ensuring they are premium products.

This is a documentation synchronization feature:

1. **Review all Foundrie AI Skills** in `.agents/skills/`:
   - Read each `SKILL.md` file
   - Extract design tokens (colors, spacing, typography, motion)
   - Extract UI rules and behavior patterns
   - Extract component usage patterns

2. **Sync `context/ui-tokens.md`**:
   - Ensure all design tokens match skills
   - Add any missing token definitions from skills
   - Document token usage examples from skills

3. **Sync `context/ui-rules.md`**:
   - Incorporate UI behavior patterns from skills
   - Add layout rules from skills
   - Document interaction standards from skills

4. **Sync `context/ui-registry.md`**:
   - Update component library with skills patterns
   - Add usage patterns from skills
   - Document when to use each component per skills

5. **Update `AGENTS.md`**:
   - Add Hard Rule 26: Foundrie AI Skills mandate
   - Reference skills in workflow rules
   - Require skills usage for all UI generation

6. **Update `research/FOUNDRIE_RESEARCH.md`**:
   - Document the skills integration
   - Reference v15.0.0+ skills-based UI generation
   - Update roadmap to reflect skills completion

7. **Add to `.gitignore`**:
   - Ensure `.agents/` is not committed
   - Ensure skills remain local development assets

## Out of Scope

- Creating new skills (only synchronizing existing ones)
- Implementing skill execution logic (that's Feature 67)
- User-facing skills management UI
- Backend/infrastructure skills (focus is UI/frontend)

## Future Modifications

- Future features may add more skills to sync
- Skills may be extended with backend patterns
- Generated projects may receive custom skill sets

## Quality Gates

- Run `npm run test` and ensure it passes
- Run `npm run build` and ensure it passes
- Run `npm run security:all` and ensure it passes before push
- Verify all context files reference skills consistently
- Verify AGENTS.md Hard Rule 26 is present and complete

## Acceptance Criteria

- [ ] `context/ui-tokens.md` is synchronized with Foundrie AI Skills design tokens
- [ ] `context/ui-rules.md` is synchronized with Foundrie AI Skills UI behavior patterns
- [ ] `context/ui-registry.md` is synchronized with Foundrie AI Skills component patterns
- [ ] `AGENTS.md` Hard Rule 26 mandates Foundrie AI Skills usage for UI generation
- [ ] `research/FOUNDRIE_RESEARCH.md` documents the skills integration
- [ ] `.gitignore` includes `.agents/` directory
- [ ] All context files reference skills consistently
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch
- [ ] `npm run build` passes
- [ ] CodeRabbit review completed and all findings resolved (recommended quality gate)
