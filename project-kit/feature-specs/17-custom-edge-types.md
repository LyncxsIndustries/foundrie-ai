# Feature 17 - Custom Edge Types

## Type

NEW FEATURE

## What This Delivers

UML-aware custom React Flow edges and markers, registered as memoized `edgeTypes`: association, aggregation, composition, inheritance, dependency, sequence sync/async/return messages, crow's-foot ER relationships, and C4 relationships, with labels, marker styles, click targets, and selection states.

## Dependencies

- Feature 16 (Custom Node Types) must be complete.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- React Flow `/xyflow/web`

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `components/canvas/edges/**`
- `lib/diagrams/schemas/edges.ts`

## Files

CREATE: edge components under `components/canvas/edges/` for each relationship family.
CREATE: `lib/diagrams/schemas/edges.ts` - Zod schemas for edge data.

## Implementation Notes

- Implement association, aggregation, composition, inheritance, and dependency edges; sequence sync/async/return message edges; crow's-foot ER edges; C4 relationship edges.
- Support labels, marker styles, click targets, and selection states. Validate edge data with Zod before rendering.
- Register `edgeTypes` outside render scope or memoized. Follow the diagram visual language in `ui-context.md` (markers must read correctly on the dark canvas and in PNG capture).

## Out of Scope

- Generation (Features 18–19), storage (Feature 20), and PNG capture (Feature 21).

## Future Modifications

- Feature 19: Generated diagrams instantiate these edges from AI output.

## Acceptance Criteria

- [ ] Edge components exist for UML associations/aggregation/composition/inheritance/dependency, sequence messages, crow's-foot ER, and C4 relationships.
- [ ] Labels, markers, click targets, and selection states work.
- [ ] Edge data is Zod-validated; `edgeTypes` are defined outside render scope or memoized.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
