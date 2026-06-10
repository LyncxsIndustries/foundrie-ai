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

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.


- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens) is also baked into the generated projects, ensuring they are premium products.


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
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
