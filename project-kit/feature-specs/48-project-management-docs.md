# Feature 48 - Project Management Documents Generation

## Type

NEW FEATURE

## What This Delivers

Generation of the `project-management/` folder required in every ZIP: `SCOPE.md`, `TIMELINE.md`, `PRICING.md`, and `CHANGE_LOG.md`. These are derived from the feature specs, the approved stack, and the discovery answers, satisfying generation invariant 61 (every ZIP includes these four files).

## Dependencies

- Feature 26 (Feature Specs Generation) and Feature 23 (Architecture Context Generation) must be complete.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Prisma `/prisma/web`
- Context7 IDs for the selected project stack (for infrastructure cost estimation in PRICING.md)

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `lib/generation/project-management-docs.ts`
- `lib/ai/prompts/project-management-docs.ts`

## Files

CREATE: `lib/generation/project-management-docs.ts` - builds the four PM documents.
CREATE: `lib/ai/prompts/project-management-docs.ts`.
MODIFY: `context/progress-tracker.md` - mark feature progress.

## Implementation Notes

- `SCOPE.md`: In Scope (from all feature-spec names), Out of Scope (consolidated from every spec's Out of Scope), Assumptions (from architecture decisions and tech choices), Constraints (timeline, budget tier, team size, compliance), and the Change Request Process (any scope change triggers Impact Analysis — Feature 52 — before work begins).
- `TIMELINE.md`: estimated start (ZIP download date) and completion (start + summed estimates), a per-feature table (estimate, depends on, assigned to, status), and the methodology note (one feature/day average; complex features 2 days; simple features 0.5–1 day).
- `PRICING.md`: monthly infrastructure cost estimation per service tier for the selected stack, with launch (free tier) and at-scale totals, reflecting the user's stated service-tier preference. Cite sources for cost figures; never disclose internal margins.
- `CHANGE_LOG.md`: seeded with the initial scope entry (feature count, estimated range). Subsequent entries are appended by the scope-change protocol (Feature 52).
- Use the approved project-specific stack — do not assume Foundrie's own. Cite `research/` paths where estimates rely on research. Persist as generated documents so Feature 30 includes them under `project-management/`. Use the `[projectId, order]` index for feature reads.

## Out of Scope

- The `docs/` package (Feature 49) and the `requirements/` docs (Feature 47).
- Live cost monitoring or billing (later billing feature).

## Future Modifications

- Feature 52: scope changes append to `CHANGE_LOG.md` and regenerate `SCOPE.md`/`TIMELINE.md`/`PRICING.md`.
- Feature 30: the ZIP builder reads these into `project-management/`.

## Acceptance Criteria

- [ ] `SCOPE.md`, `TIMELINE.md`, `PRICING.md`, and `CHANGE_LOG.md` are generated.
- [ ] `SCOPE.md` consolidates In/Out of Scope from the feature specs and includes the change-request process.
- [ ] `TIMELINE.md` includes a per-feature estimate table and the methodology note.
- [ ] `PRICING.md` estimates costs for the selected stack with cited sources and no internal margins.
- [ ] `CHANGE_LOG.md` is seeded with the initial scope entry.
- [ ] Documents use the approved project-specific stack, not Foundrie's own.
- [ ] Non-owner access returns 404.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- All CodeRabbit reviews must pass. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
