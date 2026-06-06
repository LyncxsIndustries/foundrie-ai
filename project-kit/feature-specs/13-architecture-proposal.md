# Feature 13 - Architecture Proposal

## Type

NEW FEATURE

## What This Delivers

The first architecture proposal generated from requirements: a stack recommendation conversation (candidate stacks, trade-offs, current-version research, deployment fit, maintenance cost), recorded ADRs, the approved stack decision, and initial React Flow architecture nodes/edges for the canvas. Advances the project to `ARCHITECTURE`. This precedes the diagram-first gate in Phase 6.

## Dependencies

- Feature 12 (Requirements Review UI) must be complete (confirmed requirements exist).
- Feature 05 (AI Rotation Engine) provides planning and critique tasks.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- React Flow `/xyflow/web`
- Trigger.dev `/triggerdotdev/trigger.dev`

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `app/api/architecture/[projectId]/generate/route.ts`
- `trigger/generate-architecture.ts`
- `lib/ai/prompts/architecture.ts`

## Files

CREATE: `app/api/architecture/[projectId]/generate/route.ts` - thin route triggering the durable task.
CREATE: `trigger/generate-architecture.ts` - architecture proposal task.
CREATE: `lib/ai/prompts/architecture.ts`.
MODIFY: `context/progress-tracker.md` - mark feature progress.

## Implementation Notes

- The architecture prompt uses requirements and scale estimates. It runs a stack recommendation conversation: candidate stacks from the language decision matrix, trade-offs, current-version research needs, user preferences, deployment fit, maintenance cost, and why each option is or is not appropriate. Every recommendation cites a source (benchmark, case study, documented failure mode).
- Use Context7 and official sources before committing package/framework versions. Do not default to Foundrie's own stack unless the user prefers it or the research justifies it.
- Use Gemini planning and DeepSeek critique through the rotation engine.
- Persist architecture decisions in the requirements ADR doc. Store the selected stack decision only after user approval (planning gate via `ExecutionPlan`).
- Create initial React Flow architecture nodes/edges for the canvas (the seed for the Phase 6 System Context Diagram).
- Surface proactive architecture warnings (N+1 risk, missing index, circular dependency, missing error handling) where the proposed design reveals them.
- Advance project status to `ARCHITECTURE`.

## Out of Scope

- The full diagram suite generation (Features 14–21) and the diagram-first approval gate UI.
- Feature spec generation (Feature 26).

## Future Modifications

- Feature 14+: The canvas renders and the full diagram suite is generated and approved (diagram-first gate).
- Feature 23: Architecture context generation records the approved stack with version evidence and alternatives.

## Acceptance Criteria

- [ ] The architecture proposal includes researched stack options with cited sources and records the approved stack decision via an `ExecutionPlan`.
- [ ] Package/framework versions are checked with Context7/official sources before being committed.
- [ ] Foundrie's own stack is not defaulted unless chosen or justified.
- [ ] Initial React Flow architecture nodes/edges are created.
- [ ] Proactive architecture warnings are surfaced where applicable.
- [ ] Project status advances to `ARCHITECTURE`.
- [ ] Non-owner access returns 404.
- [ ] `context/progress-tracker.md` is updated.
- [ ] `npm run build` passes.
- All CodeRabbit reviews must pass. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
