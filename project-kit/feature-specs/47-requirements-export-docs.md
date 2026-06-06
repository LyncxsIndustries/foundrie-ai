# Feature 47 - Requirements & ADR Export Documents

## Type

NEW FEATURE

## What This Delivers

Generation of the `requirements/` folder for the exported package: `discovery-notes.md`, `requirements-analysis.md`, and `architecture-decisions.md` (the ADR log). These are derived from the discovery conversation, the generated requirements record, and the architecture decisions, and are required files in the ZIP product contract.

## Dependencies

- Feature 11 (Requirements Generation) and Feature 13 (Architecture Proposal) must be complete.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Prisma `/prisma/web`

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `lib/generation/requirements-docs.ts`
- `lib/ai/prompts/requirements-docs.ts`

## Files

CREATE: `lib/generation/requirements-docs.ts` - builds the three requirements documents.
CREATE: `lib/ai/prompts/requirements-docs.ts`.
MODIFY: `context/progress-tracker.md` - mark feature progress.

## Implementation Notes

- `discovery-notes.md`: a readable transcript-derived summary of the discovery conversation and the surfaced hidden requirements (not the raw message JSON).
- `requirements-analysis.md`: functional requirements, NFRs, hidden requirements, scale estimates, and the separation of product requirements from technology preferences and unresolved stack decisions, citing relevant `research/` paths.
- `architecture-decisions.md`: the ADR log in the ADR template (Date, Status, Context, Decision, Rationale with cited sources, Consequences, Alternatives Considered). Each significant decision (stack per layer, database, auth, deployment strategy, and any user override) is one ADR; individual ADR files also go under `docs/adr/` (Feature 48).
- Persist these as research/context records or generated documents so the ZIP builder (Feature 30) can include them under `requirements/`. Use `db` for reads; do not load full conversation JSON when a derived summary suffices.

## Out of Scope

- The `project-management/` documents (Feature 48) and the `docs/` package (Feature 49).
- ZIP packaging itself (Feature 30 includes these files).

## Future Modifications

- Feature 48: ADRs also appear under `docs/adr/`; scope-change decisions append new ADRs.
- Feature 30: the ZIP builder reads these into the `requirements/` folder.

## Acceptance Criteria

- [ ] `requirements/discovery-notes.md`, `requirements/requirements-analysis.md`, and `requirements/architecture-decisions.md` are generated.
- [ ] The ADR log uses the ADR template and cites sources in rationale.
- [ ] The analysis separates product requirements from technology preferences and cites `research/` paths.
- [ ] Generation does not load full conversation JSON when a derived summary suffices.
- [ ] Non-owner access returns 404.
- [ ] `context/progress-tracker.md` is updated.
- [ ] `npm run build` passes.
- All CodeRabbit reviews must pass. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
