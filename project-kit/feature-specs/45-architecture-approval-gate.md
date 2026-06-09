# Feature 45 - Architecture Approval Gate, Diagram Versioning & Rollback

## Type

NEW FEATURE

## What This Delivers

The diagram-first gate as an explicit, enforced product feature: the human reviews every applicable diagram on the canvas and explicitly approves the complete architecture before any feature spec is written; diagrams are versioned (prior approved versions preserved) with a recorded version log; and the user can roll a diagram back to a prior version, flagging dependent specs for re-review. This is Foundrie's core differentiator made concrete.

## Dependencies

- Feature 19 (Sequential Generation) and Feature 20 (Diagram Storage) must be complete.
- Feature 44 (Execution Plan & Approval Gate) provides the approval primitive reused here.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- React Flow `/xyflow/web`
- Prisma `/prisma/web`

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `app/api/diagrams/[projectId]/approve/route.ts`
- `app/api/diagrams/[projectId]/[diagramId]/versions/route.ts`
- `lib/diagrams/versioning.ts`
- `components/diagram-generation/ArchitectureApprovalPanel.tsx`
- `components/diagram-generation/DiagramVersionHistory.tsx`

## Files

CREATE: `lib/diagrams/versioning.ts` - snapshot a diagram version, list versions, restore a version, mark dependents stale.
CREATE: `app/api/diagrams/[projectId]/approve/route.ts` - record architecture approval (gates spec generation).
CREATE: `app/api/diagrams/[projectId]/[diagramId]/versions/route.ts` - list and restore versions.
CREATE: `components/diagram-generation/ArchitectureApprovalPanel.tsx` and `DiagramVersionHistory.tsx`.
MODIFY: `context/progress-tracker.md` - mark feature progress, including the diagram version log.

## Implementation Notes

- The gate is a hard stop: feature-spec generation (Feature 26) must check that the architecture is `APPROVED` for the current diagram version set before running. The System Context Diagram is approved first; the remaining diagrams are reviewed together, then the complete architecture is approved.
- Versioning: when an approved diagram changes, snapshot the prior version (export-side `diagrams/vN/`) and record the current version. Maintain a diagram version log in `progress-tracker.md` (which diagram version each spec was written from). Use `db` for version writes; do not select large React Flow JSON in version-list views.
- Rollback: restoring a prior diagram version marks feature specs derived from the changed diagram as "needs re-review" and records the change. Conversation-branch exploration ("what if monolith instead of microservices") preserves both branches; the rejected branch is never deleted.
- Reuse the Feature 44 approval primitive (`taskType: ARCHITECTURE_APPROVAL`) so approval is auditable. All routes use `requireProjectMember()`; approval is recorded against the approving user. Buttons disable on click.

## Out of Scope

- Generating the diagrams (Features 18–21) and generating specs (Feature 26).
- Real-time multi-user approval voting (single-owner approval is sufficient for v1; collaboration presence is Feature 33).

## Future Modifications

- Feature 26: feature-spec generation checks the approval gate and records the diagram version per spec.
- Feature 52: scope changes create new diagram versions and re-trigger the gate.

## Acceptance Criteria

- [ ] Feature-spec generation is blocked until the architecture is approved for the current diagram version set.
- [ ] The System Context Diagram is approved before the rest; the complete architecture has an explicit approval record.
- [ ] Changing an approved diagram snapshots the prior version and records the current version.
- [ ] The diagram version log records which version each spec was written from.
- [ ] Restoring a prior version flags dependent specs for re-review.
- [ ] Conversation-branch exploration preserves both branches.
- [ ] Non-members get 404; approval is attributed to the user; buttons disable on click.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
