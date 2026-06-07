# Feature 22 - Project Overview Generation

## Type

NEW FEATURE

## What This Delivers

Generation of `context/project-overview.md` for the exported project package: problem, users, goals, core flow, features, scope, success criteria, and the research basis for major decisions, persisted as a `ContextFile` of type `PROJECT_OVERVIEW` with preview/edit before ZIP export. This is the first of the six context-file generators (Features 22–25, 28–29).

## Dependencies

- Feature 13 (Architecture Proposal) and Feature 06 (Layout Shell) must be complete.
- The diagram-first gate (Features 18–21) governs when full generation runs; the overview can draft from approved requirements/architecture.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Context7 IDs for technologies being considered in the project overview.

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `lib/generation/project-overview.ts`
- `app/api/context-files/[projectId]/generate/route.ts` (PROJECT_OVERVIEW branch)
- `lib/ai/prompts/project-overview.ts`

## Files

CREATE: `lib/generation/project-overview.ts` and `lib/ai/prompts/project-overview.ts`.
CREATE: `app/api/context-files/[projectId]/generate/route.ts` - generation route (shared across context-file generators).
MODIFY: `context/progress-tracker.md` - mark feature progress.

## Implementation Notes

- Use `callAI('project_overview_md')`. Include problem, users, goals, core flow (the 8-phase shape where relevant), features, scope, success criteria, and the research basis for major decisions.
- Include the user's technology preferences and state that the final stack is selected through research and approval. Summarize which research files/assets influenced the overview (cite `research/` paths).
- Persist as `ContextFile` type `PROJECT_OVERVIEW`. Allow preview and edits before ZIP export. Use `db` for upserts via the `[projectId, fileType]` lookup. Do not rewrite unrelated context files when only the overview regenerates.
- Do not assume Foundrie's own stack for the generated project.

## Out of Scope

- The other context files (Features 23–25, 28–29), feature specs (Feature 26), and ZIP packaging (Feature 30).

## Future Modifications

- Feature 30: The overview is included in the ZIP `context/` folder.
- Feature 23+: Sibling generators reuse the shared generation route.

## Acceptance Criteria

- [ ] `context/project-overview.md` is generated and persisted as `PROJECT_OVERVIEW`.
- [ ] The generated overview does not assume Foundrie's own stack.
- [ ] The overview cites the research files/assets that influenced it.
- [ ] Preview and edit work before export; unrelated context files are not rewritten.
- [ ] Non-owner access returns 404.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- All CodeRabbit reviews must pass. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
