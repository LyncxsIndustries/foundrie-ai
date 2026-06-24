# Feature 31 - Trigger ZIP Job

## Type

NEW FEATURE

## What This Delivers

ZIP generation moved into a durable, idempotent Trigger.dev job (`generate-project-zip`) that fetches project content with ownership context, builds the ZIP via the Feature 30 assembler, uploads to Vercel Blob, stores ZIP metadata, and returns file name, URL, and size. Retries never corrupt metadata or duplicate artifacts.

## Dependencies

- Feature 30 (ZIP Builder) must be complete.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Trigger.dev `/triggerdotdev/trigger.dev`
- Vercel Storage `/vercel/storage`

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `trigger/generate-project-zip.ts`

## Files

CREATE: `trigger/generate-project-zip.ts` - durable ZIP generation task.
MODIFY: `context/progress-tracker.md` - mark feature progress.

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.


- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens, executable `npm run security:all` gates) is also baked into the generated projects, ensuring they are premium products.


- Fetch project and generated content with ownership context. Fetch root `ARTKINS_STYLE_GUIDE.md`, research documents/sources/asset metadata for the `research/` folder, and generated `.agents/skills/` when present.
- Build the ZIP via the Feature 30 assembler (the deployed builder is the Rust streaming pipeline; document the boundary). Upload to Vercel Blob. Store `lastZipUrl`, `lastZipGeneratedAt`, `lastZipFileName`. Return file name, URL/path, size.
- Keep the task idempotent (by `projectId` + content hash/run key) so retries do not corrupt metadata, duplicate records, or orphan artifacts. Use `db` for heavy content reads and only for the final ZIP metadata update.
- Cache fresh ZIP metadata for 10 minutes to avoid rebuilding unchanged packages. Log slow reads and build duration. Log missing research-asset downloads and use placeholders rather than failing the whole ZIP for a non-critical asset.

## Out of Scope

- The download UI (Feature 32) and the ZIP structure itself (Feature 30).

## Future Modifications

- Feature 32: The download flow triggers this job and polls its status.

## Quality Gates

- Run `npm run test` and ensure it passes.
- Run `npm run build` and ensure it passes.
- Run `npm run security:all` and ensure it passes before push.

## Acceptance Criteria

- [ ] `generate-project-zip` builds and uploads the ZIP and stores `lastZipUrl`, `lastZipGeneratedAt`, `lastZipFileName`.
- [ ] The job is idempotent; retries do not corrupt metadata or duplicate artifacts.
- [ ] The job includes root `ARTKINS_STYLE_GUIDE.md`, the research corpus, and `.agents/skills/` when present.
- [ ] Fresh ZIP metadata is cached for 10 minutes.
- [ ] Missing non-critical research assets use placeholders without failing the job.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
