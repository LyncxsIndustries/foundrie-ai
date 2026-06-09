# Feature 29 - Progress Tracker Generation

## Type

NEW FEATURE

## What This Delivers

Generation and maintenance of `context/progress-tracker.md` for exported packages, seeded so a coding agent can resume: current phase, all features NOT STARTED with Feature 01 next, the diagram version log, open questions, architecture decisions, notable research, and a last-updated timestamp. Persisted as a `ContextFile` of type `PROGRESS_TRACKER`.

## Dependencies

- Feature 28 (AGENTS.md Generation) must be complete (feature order is known).

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

- `lib/generation/progress-tracker.ts`
- `lib/ai/prompts/progress-tracker.ts`

## Files

CREATE: `lib/generation/progress-tracker.ts` and `lib/ai/prompts/progress-tracker.ts`.
MODIFY: `app/api/context-files/[projectId]/generate/route.ts` - add the `PROGRESS_TRACKER` branch.

## Implementation Notes

- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens) is also baked into the generated projects, ensuring they are premium products.


- Seed the tracker from project phase, the feature list (all NOT STARTED, Feature 01 next), open questions, architecture decisions, research status, and the diagram version log (which diagram version each spec was written from). Include a last-updated ISO timestamp.
- Provide implementation status a coding agent can resume from. Update the tracker when features are generated or reviewed. Note notable research documents/assets required for implementation.
- Persist as `ContextFile` type `PROGRESS_TRACKER`. Use `db` for updates via the `[projectId, fileType]` index. Avoid rewriting all context files when only progress changes.

## Out of Scope

- ZIP packaging (Feature 30) and the project-management documents (generated in the ZIP build).

## Future Modifications

- Feature 30: The tracker is included in the ZIP `context/` folder.
- Scope-change protocol: the tracker records revised specs and the diagram version log on every approved scope change.

## Acceptance Criteria

- [ ] `context/progress-tracker.md` is seeded with the current phase, all features NOT STARTED (Feature 01 next), open questions, architecture decisions, the diagram version log, and a timestamp.
- [ ] The tracker provides a resumable implementation status.
- [ ] Updating progress does not rewrite all context files.
- [ ] Non-owner access returns 404.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
