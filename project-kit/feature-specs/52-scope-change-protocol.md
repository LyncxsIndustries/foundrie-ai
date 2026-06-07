# Feature 52 - Scope Change Protocol & Impact Analysis

## Type

NEW FEATURE

## What This Delivers

The mid-project scope-change workflow: any addition, removal, or redesign triggers an Impact Analysis (affected features, new features needed, diagram updates, timeline delta, cost delta) that the user must approve before any spec is regenerated. On approval, Foundrie updates affected diagrams (new versions), regenerates affected specs, appends to `CHANGE_LOG.md`, generates an ADR, and flags revised specs for re-review. Removing a completed feature generates a dedicated removal spec. Satisfies invariants 63, 64, 67, 68.

## Dependencies

- Feature 26 (Feature Specs Generation), Feature 45 (Architecture Approval Gate & Versioning), and Feature 48 (Project Management Docs) must be complete.
- Feature 44 (Execution Plan & Approval Gate) provides the approval primitive.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Prisma `/prisma/web`
- Next.js `/vercel/next.js`

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `app/api/projects/[projectId]/scope-changes/route.ts`
- `lib/scope/impact-analysis.ts`
- `components/project/ScopeChangePanel.tsx`

## Files

CREATE: `lib/scope/impact-analysis.ts` - compute the impact report and apply approved changes.
CREATE: `app/api/projects/[projectId]/scope-changes/route.ts` - submit a change, return the impact report, apply on approval.
CREATE: `components/project/ScopeChangePanel.tsx` - request a change, review impact, approve/reject.
MODIFY: `context/progress-tracker.md` - mark feature progress.

## Implementation Notes

- A scope change is one of: addition, removal, or redesign. Impact Analysis produces: completed features affected, in-progress features affected, pending features affected, new features needed, diagrams needing updates, timeline delta, and cost delta — shown to the user before anything is regenerated.
- On approval (via a Feature 44 `ExecutionPlan` with `taskType: SCOPE_CHANGE`, with the impact report as its context): update affected diagrams as new versions (Feature 45), regenerate affected feature specs, generate any new specs, append a `CHANGE_LOG.md` entry (date, requester, impact summary, feature delta, timeline delta, cost delta), generate an ADR recording the decision, and flag revised specs as "re-review required" in `progress-tracker.md`.
- Feature removal: a NOT STARTED feature is marked CANCELLED; an IN PROGRESS feature pauses for the user's choice; a COMPLETE (merged) feature generates a new `REMOVAL` feature spec (delete files, remove references, clean migrations, grep for residual references) so dead code is never left behind.
- Use `requireProjectOwner()` for submitting and approving scope changes. Use transactions when applying multi-record regeneration. Buttons disable on click. Rejected change requests are recorded, not silently dropped.

## Out of Scope

- Automatic re-implementation by a coding agent (the downstream agent re-implements revised specs).
- Cost recomputation beyond the PRICING.md model.

## Future Modifications

- None planned; this completes the scope-management loop for v1.

## Acceptance Criteria

- [ ] Submitting a scope change returns an Impact Analysis (affected/new features, diagram updates, timeline and cost deltas) before any regeneration.
- [ ] Approval is recorded via an `ExecutionPlan` with the impact report as context.
- [ ] On approval, affected diagrams get new versions, affected specs regenerate, new specs are created, `CHANGE_LOG.md` gets an entry, and an ADR is generated.
- [ ] Revised specs are flagged "re-review required" in `progress-tracker.md`.
- [ ] Removing a COMPLETE feature generates a `REMOVAL` spec; NOT STARTED is CANCELLED; IN PROGRESS pauses for user choice.
- [ ] Owner-only; non-owners get 404; rejected requests are recorded.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- All CodeRabbit reviews must pass. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
