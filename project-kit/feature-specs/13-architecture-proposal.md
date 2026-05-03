# 13 - Architecture Proposal

## Goal

Generate and review the first architecture proposal from requirements.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- React Flow `/xyflow/web`
- Trigger.dev `/triggerdotdev/trigger.dev`

Use installed Context7 skills or:

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Implementation

- Create architecture prompt using requirements and scale estimates.
- Include a stack recommendation conversation: candidate stacks, trade-offs, current-version research needs, user preferences, deployment fit, maintenance cost, and why each option is or is not appropriate.
- Use Context7 and official sources before committing package/framework versions in the proposal.
- Do not default to Foundrie's own stack unless the user prefers it or the research justifies it.
- Use Gemini planning and DeepSeek critique through rotation engine.
- Persist architecture decisions in requirements ADR doc.
- Store selected stack decisions only after user approval.
- Create initial React Flow architecture nodes and edges for the canvas.
- Advance project status to `ARCHITECTURE`.

## Scope Limits

- Do not implement later feature specs early.
- Do not introduce undocumented architecture changes.
- Do not bypass the storage, auth, AI, or Context7 rules in the context files.

## Check When Done

- The feature works within its defined scope.
- Relevant library docs were checked with Context7.
- Types are strict and external input is validated.
- Access control is enforced where data is read or mutated.
- Architecture proposal includes researched stack options and records the approved stack decision.
- `context/progress-tracker.md` is updated.
- `npm run build` passes once application code exists.
- All CodeRabbit reviews must pass. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
