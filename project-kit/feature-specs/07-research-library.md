# 07 - Research Library

## Type

NEW FEATURE

## What This Delivers

The project research workspace where users upload and organize screenshots, image assets, frame ZIPs, extracted frames, research documents, pasted notes, and links that influence the generated project. After this feature, a project owner can build the research corpus that later generation phases cite.

## Dependencies

- Feature 04 (Project CRUD) and Feature 03 (Database Schema) must be complete (research models and ownership exist).
- Vercel Blob token must be configured.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Vercel Storage / Blob `/vercel/storage`
- Prisma `/prisma/web`
- Next.js `/vercel/next.js`

## Files Owned

- `app/(app)/projects/[projectId]/research/page.tsx`
- `components/research/ResearchLibrary.tsx`
- `components/research/ResearchUploader.tsx`
- `components/research/VisualReferenceGrid.tsx`
- `app/api/research/[projectId]/upload/route.ts`
- `app/api/research/[projectId]/assets/route.ts`

## Files

CREATE: `app/(app)/projects/[projectId]/research/page.tsx`
CREATE: `components/research/ResearchLibrary.tsx`
CREATE: `components/research/ResearchUploader.tsx`
CREATE: `components/research/VisualReferenceGrid.tsx`
CREATE: `app/api/research/[projectId]/upload/route.ts`
CREATE: `app/api/research/[projectId]/assets/route.ts`
MODIFY: `components/project/ProjectPhaseNav.tsx` - add Research link.

## Implementation

- Allow multiple image assets, screenshots, frame ZIPs, extracted frame images, Markdown files, PDF files, Word documents, Excel workbooks, and PowerPoint decks.
- Reject raw animation file uploads. Users must upload frame ZIPs or extracted frame images instead.
- Allow pasted research notes to be saved as research documents.
- Validate mime type, size, and project ownership before Blob upload.
- Store files in Vercel Blob and metadata in `ResearchAsset`.
- Group assets by type: uploads, screenshots, inspirations, documents, frame-zips, frames.
- Allow user notes/tags per asset.
- Use `db` for metadata writes and `db` for asset lists when stale reads are acceptable.

## Out of Scope

- Tavily web search.
- Obscura browser scraping.
- AI visual analysis.
- ZIP export changes.
- Editing generated feature specs.

## Future Modifications

- Feature 08: Add AI visual/motion analysis for uploaded assets.
- Feature 09: Add Tavily, Obscura, and Context7 source capture.
- Feature 30 modification: Include research assets in the ZIP.

## Acceptance Criteria

- [ ] A signed-in project owner can upload multiple research assets.
- [ ] Non-owners receive 404 for project research routes.
- [ ] Invalid mime types and oversized files are rejected before Blob upload.
- [ ] Research assets render grouped by type.
- [ ] Frame ZIP uploads are accepted and stored as Blob-backed research assets.
- [ ] Raw animation file uploads are rejected with a clear message telling users to upload a frame ZIP instead.
- [ ] Markdown/PDF/Word/Excel/PowerPoint research files are accepted and stored as Blob-backed research assets.
- [ ] Pasted notes are persisted as research documents.
- [ ] Asset metadata stores Blob URL/path, type, original filename, size, tags, and timestamps.
- [ ] No web scraping or AI analysis is built in this feature.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes once application code exists.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
