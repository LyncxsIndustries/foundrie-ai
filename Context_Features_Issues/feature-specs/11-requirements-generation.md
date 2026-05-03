# 11 - Requirements Generation

## Goal

Generate structured requirements analysis from discovery history.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Trigger.dev `/triggerdotdev/trigger.dev`
- Prisma `/prisma/web`
- Tavily `/tavily-ai/tavily-js` if web research is used as requirements input

Use installed Context7 skills or:

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Implementation

- Create `POST /api/requirements/[projectId]/generate`.
- Trigger a durable requirements task when generation may exceed route limits.
- Use `callAI('requirements_surfacing')` or critique tasks as needed.
- Read the project's research corpus before generation: research documents, source summaries, selected visual references, uploaded asset summaries, and unresolved research questions.
- Include research evidence in requirements synthesis without copying full scraped/source documents into the requirements record.
- Extract user technology preferences, target platform constraints, team skill constraints, deployment constraints, and open stack questions.
- Do not turn preferences into final package versions yet; final stack/version decisions require architecture research and user approval.
- Link requirements back to relevant `research/` paths when a requirement comes from visual, motion, source, or technical research.
- Persist discovery notes, analysis document, functional JSON, NFR JSON, hidden requirements, and scale estimates.
- Use `dbWrite` for generation writes.
- Keep requirements generation atomic: either all generated requirement fields are saved together or the task records a recoverable error.
- Do not repeatedly rewrite large `Conversation.messages` JSON in tight loops. Append/persist messages through the conversation API first, then read a stable snapshot for generation.
- For read-heavy generation preparation, use `dbRead` only when stale reads are acceptable; use `dbWrite` when the generation immediately follows a new user answer.
- Advance project status to `REQUIREMENTS`.

## Scope Limits

- Do not implement later feature specs early.
- Do not introduce undocumented architecture changes.
- Do not bypass the storage, auth, AI, or Context7 rules in the context files.

## Check When Done

- The feature works within its defined scope.
- Relevant library docs were checked with Context7.
- Types are strict and external input is validated.
- Access control is enforced where data is read or mutated.
- Requirements output separates product requirements from technology preferences and unresolved stack decisions.
- `context/progress-tracker.md` is updated.
- `npm run build` passes once application code exists.
