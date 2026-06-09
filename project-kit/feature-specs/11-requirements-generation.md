# Feature 11 - Requirements Generation

## Type

NEW FEATURE

## What This Delivers

Structured requirements analysis generated from discovery history and the research corpus, run as a durable task: functional and non-functional requirements, hidden requirements, scale estimates, and separation of product requirements from technology preferences and unresolved stack decisions. Advances the project to `REQUIREMENTS`.

## Dependencies

- Feature 10 (Discovery Chat) must be complete (conversation history exists).
- Feature 07 (Research Library) provides the research corpus to read.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Trigger.dev `/triggerdotdev/trigger.dev`
- Prisma `/prisma/web`
- Tavily `/tavily-ai/tavily-js` (if web research feeds requirements)

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `app/api/requirements/[projectId]/generate/route.ts`
- `trigger/generate-requirements.ts`
- `lib/ai/prompts/requirements.ts`

## Files

CREATE: `app/api/requirements/[projectId]/generate/route.ts` - thin route triggering the durable task.
CREATE: `trigger/generate-requirements.ts` - durable requirements generation task.
CREATE: `lib/ai/prompts/requirements.ts`.
MODIFY: `context/progress-tracker.md` - mark feature progress.

## Implementation Notes

- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens) is also baked into the generated projects, ensuring they are premium products.


- The route stays thin and triggers a durable Trigger.dev task; long-running generation never blocks the response.
- Use `callAI('requirements_surfacing')` and critique tasks as needed.
- Read the project's research corpus before generation (research documents, source summaries, selected visual references, asset summaries, unresolved research questions). Include research evidence without copying full scraped/source documents into the requirements record. Link requirements to relevant `research/` paths when they originate from visual, motion, source, or technical research.
- Extract user technology preferences, target platform constraints, team skill constraints, deployment constraints, and open stack questions. Do not turn preferences into final package versions — final stack/version decisions require architecture research and user approval.
- Run the hidden-requirements catalog check; surface at minimum one hidden requirement per major area (auth, data, payments, API, performance, security).
- Persist discovery notes, analysis document, functional JSON, NFR JSON, hidden requirements, and scale estimates atomically (all-or-recoverable-error). Use `db` for writes.
- Do not rewrite large `Conversation.messages` JSON in tight loops; read a stable snapshot for generation. Use `db` when generation immediately follows a new user answer.
- Advance project status to `REQUIREMENTS`. The task is idempotent by `projectId` + generation key.

## Out of Scope

- Requirements review UI (Feature 12) and architecture proposal (Feature 13).
- Final stack/version selection and diagram generation.

## Future Modifications

- Feature 12: Review UI edits the generated requirements.
- Feature 13: Architecture proposal consumes requirements and scale estimates.

## Acceptance Criteria

- [ ] The route triggers a durable requirements task that does not block the response.
- [ ] Requirements output separates product requirements from technology preferences and unresolved stack decisions.
- [ ] At least one hidden requirement is surfaced per major area.
- [ ] Requirements link back to relevant `research/` paths where applicable.
- [ ] Generation is atomic or records a recoverable error.
- [ ] Project status advances to `REQUIREMENTS`.
- [ ] Non-owner access returns 404.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
