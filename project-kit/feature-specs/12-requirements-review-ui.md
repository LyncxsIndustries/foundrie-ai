# Feature 12 - Requirements Review UI

## Type

NEW FEATURE

## What This Delivers

Review surfaces for generated requirements and architecture decisions: editable sections for functional requirements, NFRs, hidden requirements, and scale estimates, plus the ADR log. Users edit and confirm requirements before diagram planning.

## Dependencies

- Feature 11 (Requirements Generation) must be complete (requirements records exist).
- Feature 06 (Layout Shell) provides the requirements phase page.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- shadcn/ui `/shadcn-ui/ui`
- Next.js `/vercel/next.js`

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `app/(app)/projects/[projectId]/requirements/page.tsx`
- `components/project/RequirementsReview.tsx`
- `app/api/requirements/[projectId]/route.ts`

## Files

CREATE: `components/project/RequirementsReview.tsx` - editable requirements sections.
CREATE: `app/api/requirements/[projectId]/route.ts` - GET/PATCH with ownership checks.
MODIFY: `app/(app)/projects/[projectId]/requirements/page.tsx` - mount the review UI.

## Implementation Notes

- Show functional requirements, NFRs, hidden requirements, scale estimates, and the ADR log. Allow user edits before diagram planning.
- Persist edits through ownership-checked APIs; use `db` and refresh with strong read-after-write.
- Fetch only the requirements row for the active project. Avoid loading full conversation history on the review page (context engineering: load only what the view needs).
- Every async surface has loading, error, and empty states.

## Out of Scope

- Architecture proposal generation (Feature 13) and diagram generation (Features 14+).
- Regenerating requirements (that is the Feature 11 route).

## Future Modifications

- Feature 13: Approved requirements feed the architecture proposal.
- Diagram-first gate: approved requirements precede diagram generation in Phase 6.

## Acceptance Criteria

- [ ] Requirements sections render and are editable.
- [ ] Edits persist through ownership-checked APIs; non-owner access returns 404.
- [ ] The ADR log is shown.
- [ ] Only the active project's requirements row is fetched; full conversation history is not loaded.
- [ ] `context/progress-tracker.md` is updated.
- [ ] `npm run build` passes.
- All CodeRabbit reviews must pass. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
