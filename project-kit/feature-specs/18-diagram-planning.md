# Feature 18 - Diagram Planning

## Type

NEW FEATURE

## What This Delivers

AI planning of exactly which diagrams a project needs, producing the ordered job list for the diagram-first gate. `planDiagramJobs(projectContext)` uses architecture context and requirements to return ordered jobs grouped by category, with folder paths and file names, persisted as queued `Diagram` records in a single transaction.

## Dependencies

- Feature 13 (Architecture Proposal) and Feature 03 (Database Schema) must be complete.
- Features 16–17 provide the node/edge vocabulary the planner targets.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Trigger.dev `/triggerdotdev/trigger.dev`
- Prisma `/prisma/web`

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `lib/diagrams/plan-diagram-jobs.ts`
- `app/api/diagrams/[projectId]/plan/route.ts`
- `lib/ai/prompts/diagram-plan.ts`
- `lib/diagrams/schemas/plan.ts`

## Files

CREATE: `lib/diagrams/plan-diagram-jobs.ts` - `planDiagramJobs(projectContext)`.
CREATE: `app/api/diagrams/[projectId]/plan/route.ts` - ownership-checked planning route.
CREATE: `lib/ai/prompts/diagram-plan.ts` and `lib/diagrams/schemas/plan.ts`.

## Implementation Notes

- Use architecture context and requirements as input. Plan the applicable subset of the 12 diagram types with their triggers: System Context (always, first), Container (always), Component (per container > 3 components), ERD (if database), Sequence (min 3), DFD (if user data/payments/AI signals), State Machine (conditional), Deployment (if > 1 target), API Map (if > 3 endpoints), Feature DAG (always), Agent Architecture (agentic), Security Architecture (always).
- Return ordered jobs grouped by category with `folderPath` and `fileName`. Validate planner output with Zod.
- Persist planned `Diagram` records as queued jobs in a single transaction (all-or-nothing). Update `Project.diagramCount` in the same mutation path. Preserve `orderInCategory` so display uses the `[projectId, category, orderInCategory]` index. Use `db` for job creation.
- The System Context Diagram is ordered first and must be approved before the rest (diagram-first gate, enforced by Feature 19's runner and the approval UI).

## Out of Scope

- Running the jobs (Feature 19), storage/PNG (Features 20–21), and the approval-gate UI polish.

## Future Modifications

- Feature 19: The sequential runner executes these jobs one at a time and respects the System-Context-first gate.
- Feature 26: The Feature DAG produced here drives feature-spec ordering.

## Acceptance Criteria

- [ ] `planDiagramJobs` returns ordered, Zod-validated jobs grouped by category with folder paths and file names.
- [ ] The applicable diagram subset follows the documented triggers; System Context is ordered first.
- [ ] Planned `Diagram` records are created in one transaction and `Project.diagramCount` is updated in the same path.
- [ ] `orderInCategory` is preserved for indexed display.
- [ ] Non-owner access returns 404.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- All CodeRabbit reviews must pass. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
