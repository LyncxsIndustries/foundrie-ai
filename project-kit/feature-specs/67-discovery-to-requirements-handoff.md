# Feature 67 - Discovery-to-Requirements Handoff Contract

## Type

ENHANCEMENT

## What This Delivers

Defines and implements the exact data structure, validation rules, and trigger conditions for transitioning from discovery chat (Phase 1-5) to requirements generation (Phase 6+). Establishes the handoff contract that ensures all necessary information is captured before requirements generation begins, with automatic validation, missing-data detection, and user prompts for incomplete sections. After this feature, the discovery-to-requirements transition is deterministic, traceable, and validated.

## Dependencies

- Feature 65 (Discovery Phase State Machine) - provides phase completion state
- Feature 66 (AI Model Selection Per Phase) - provides compressed context
- Feature 64 (Discovery Chat State & Logic) - provides conversation state
- Feature 11 (Requirements Generation) - consumes handoff data

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `research/FOUNDRIE_RESEARCH.md` (Section 5: Discovery Protocol)
- `context/code-standards.md`

## Context7 Docs To Check

```bash
npx ctx7 library prisma "JSON fields and validation"
npx ctx7 library zod "schema validation and type inference"
```

## Files Owned

- `lib/discovery/handoff-contract.ts` (NEW)
- `lib/discovery/handoff-validator.ts` (NEW)
- `lib/discovery/context-extractor.ts` (NEW)
- `app/api/discovery/[projectId]/validate-handoff/route.ts` (NEW)
- `app/api/discovery/[projectId]/extract-context/route.ts` (NEW)

## Files

CREATE: `lib/discovery/handoff-contract.ts` - handoff data structure and Zod schema
CREATE: `lib/discovery/handoff-validator.ts` - validation logic for handoff readiness
CREATE: `lib/discovery/context-extractor.ts` - extracts structured data from conversation
CREATE: `app/api/discovery/[projectId]/validate-handoff/route.ts` - validates handoff readiness
CREATE: `app/api/discovery/[projectId]/extract-context/route.ts` - extracts handoff data
MODIFY: `prisma/schema.prisma` - add DiscoveryHandoff model
MODIFY: `lib/conversations/completion.ts` - integrate handoff validation before marking done
MODIFY: `app/api/requirements/[projectId]/generate/route.ts` - read from handoff contract
CREATE: `lib/discovery/handoff-contract.test.ts` - test schema and validation
CREATE: `lib/discovery/context-extractor.test.ts` - test extraction logic

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract, update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch.

### Handoff Contract

The handoff contract is a validated JSON structure containing all discovery outputs needed for requirements generation. It includes problem statement, target users, success criteria, core flows, features list, constraints, technical stack choices with reasoning, external integrations, and non-functional requirements.

Validation ensures Phase 5 completion, all required fields present, minimum content lengths met, and business logic satisfied (e.g., at least 1 core flow, 1 feature, out-of-scope defined).

### Integration Points

- **Feature 64**: Reads conversation messages for extraction
- **Feature 65**: Checks currentPhase === PHASE_5_FEATURE_SEQUENCE
- **Feature 66**: Uses compressed context if needed
- **Feature 11**: Receives validated handoff data as input
- **Feature 71** (formerly 65): May display validation status in UI

## Out of Scope

- Requirements generation logic (Feature 11)
- Diagram generation (Phase 6 features)
- Phase state machine (Feature 65)
- UI for handoff validation display (future feature)

## Future Modifications

- Feature 11 (Requirements Generation) - reads from DiscoveryHandoff model
- Feature 71 (Requirements Page Integration) - may show handoff validation status
- Future features may add interactive handoff editing UI

## Quality Gates

- Run `npm run sync:check` and ensure it passes
- Run `npm run security:all` and ensure it passes
- Run `npm run test` and ensure it passes
- Run `npm run build` and ensure it passes

## Acceptance Criteria

- [ ] DiscoveryHandoff model created with all structured fields
- [ ] Zod schema validates all required handoff fields
- [ ] Handoff validator checks phase completion (must be Phase 5)
- [ ] Context extractor uses AI to parse conversation into structured data
- [ ] Extracted data stored in DiscoveryHandoff model
- [ ] Validation checks all required fields present and well-formed
- [ ] Completeness percentage calculated (0-100)
- [ ] Missing required fields listed in validation result
- [ ] POST `/api/discovery/[projectId]/validate-handoff` validates readiness
- [ ] POST `/api/discovery/[projectId]/extract-context` extracts and returns handoff data
- [ ] Requirements generation blocked if handoff not valid
- [ ] Requirements generation receives handoff data as structured input
- [ ] Schema validation tested with valid and invalid data
- [ ] Context extraction tested with sample conversations
- [ ] `context/architecture-context.md` updated with handoff contract definition
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at Feature 68
- [ ] All quality gates pass
- [ ] CodeRabbit review completed and all findings resolved (recommended quality gate)

## Setup Instructions

No new external accounts or API keys required. This feature uses existing Gemini API for context extraction.

After implementing schema changes:
```bash
npm run db:generate
npm run db:migrate
```

For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
