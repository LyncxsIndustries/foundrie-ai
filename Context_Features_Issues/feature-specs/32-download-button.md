# 32 - Download Button

## Goal

Create the export page and client ZIP download flow.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Next.js `/vercel/next.js`
- Trigger.dev `/triggerdotdev/trigger.dev`

Use installed Context7 skills or:

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Implementation

- Create `POST /api/projects/[projectId]/download` to return cached ZIP or trigger generation.
- Create `GET /api/projects/[projectId]/download?runId=` to poll status.
- Build `DownloadZipButton` with generating, ready, error, and retry states.
- Trigger browser download when ready.
- Show packaging progress messages.
- The POST route uses `dbWrite` for ownership checks that must reflect recent project creation.
- Polling can use cached task state and must not hammer project tables.
- Do not expose raw Blob URLs until project ownership is verified.
- Reuse fresh ZIP metadata when `lastZipGeneratedAt` is within the cache window.

## Scope Limits

- Do not implement later feature specs early.
- Do not introduce undocumented architecture changes.
- Do not bypass the storage, auth, AI, or Context7 rules in the context files.

## Check When Done

- The feature works within its defined scope.
- Relevant library docs were checked with Context7.
- Types are strict and external input is validated.
- Access control is enforced where data is read or mutated.
- `context/progress-tracker.md` is updated.
- `npm run build` passes once application code exists.
