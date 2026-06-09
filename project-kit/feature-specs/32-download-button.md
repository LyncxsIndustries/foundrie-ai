# Feature 32 - Download Button

## Type

NEW FEATURE

## What This Delivers

The export page and client ZIP download flow: a POST route that returns cached metadata or triggers generation, a GET route that polls run status, and `DownloadZipButton` with generating/ready/error/retry states that triggers the browser download when ready. Access is checked before any Blob URL is exposed.

## Dependencies

- Feature 31 (Trigger ZIP Job) must be complete.
- Feature 06 (Layout Shell) provides the export phase page.

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

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `app/api/projects/[projectId]/download/route.ts`
- `components/project/DownloadZipButton.tsx`
- `app/(app)/projects/[projectId]/export/page.tsx`

## Files

CREATE: `app/api/projects/[projectId]/download/route.ts` - POST (return cached or trigger) and GET (poll by `runId`).
CREATE: `components/project/DownloadZipButton.tsx` - generating/ready/error/retry states.
MODIFY: `app/(app)/projects/[projectId]/export/page.tsx` - mount the export UI and package checklist.

## Implementation Notes

- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens) is also baked into the generated projects, ensuring they are premium products.


- POST returns cached ZIP metadata when `lastZipGeneratedAt` is within the 10-minute window; otherwise triggers `generate-project-zip` and returns `runId`. GET polls run status and returns the ZIP URL/file name when complete.
- Build `DownloadZipButton` with generating, ready, error, and retry states and packaging progress messages; trigger the browser download when ready. Buttons disable immediately on click (idempotency) and re-enable only on error.
- The POST route uses `db` for ownership checks reflecting recent project creation. Polling uses cached task state and must not hammer project tables. Do not expose raw Blob URLs until project ownership is verified (project membership: Owner or Collaborator).

## Out of Scope

- The ZIP build itself (Features 30–31).

## Future Modifications

- Feature 39+: Collaborators (not just owners) can download via `requireProjectMember`.

## Acceptance Criteria

- [ ] POST returns cached metadata within the cache window or triggers generation and returns `runId`.
- [ ] GET polls status and returns the ZIP URL/file name when complete.
- [ ] `DownloadZipButton` shows generating/ready/error/retry states and triggers the download.
- [ ] Buttons disable on click and re-enable only on error.
- [ ] Blob URLs are exposed only after an ownership/membership check; non-members get 404.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
