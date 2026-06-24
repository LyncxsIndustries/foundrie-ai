# Feature 20 - Diagram Storage

## Type

NEW FEATURE

## What This Delivers

Persistence for diagram data and generated PNGs: React Flow node/edge JSON on `Diagram` records, PNG upload to Vercel Blob with access-checked retrieval, generated timestamps, error-placeholder behavior for failed captures, and diagram versioning (prior approved versions preserved). Updates `Project.completedDiagramCount` on completion.

## Dependencies

- Feature 19 (Sequential Generation) must be complete.
- Feature 03 (Database Schema) provides the `Diagram` model and partial indexes.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Vercel Storage `/vercel/storage`
- Prisma `/prisma/web`

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `lib/diagrams/storage.ts`
- `app/api/diagrams/[projectId]/[diagramId]/route.ts`
- `lib/storage/diagram-blob.ts`

## Files

CREATE: `lib/diagrams/storage.ts` - persist JSON, PNG URL, status, version.
CREATE: `app/api/diagrams/[projectId]/[diagramId]/route.ts` - access-checked retrieval/update.
CREATE: `lib/storage/diagram-blob.ts` - Blob upload helpers.

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.


- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens, executable `npm run security:all` gates) is also baked into the generated projects, ensuring they are premium products.


- Store React Flow node/edge JSON on `Diagram` records. Upload PNGs to Vercel Blob; store the PNG URL/path and generated timestamp. Provide access-checked retrieval (project membership required; never expose Blob URLs without an ownership check).
- Error-placeholder behavior for failed captures (record `errorMessage`, mark status `error`).
- Diagram versioning: when a diagram changes, preserve the prior approved version (export-side `diagrams/vN/`) and record which version is current. `progress-tracker.md` records which version each spec was written from.
- Use `db` for status, PNG URL, and timestamp mutations. Update `Project.completedDiagramCount` when a diagram transitions to `DONE`.
- Do not fetch `reactFlowNodes`/`reactFlowEdges` in list views; select those large JSON columns only when editing or generating a specific diagram. Status-list queries benefit from the partial `idx_diagrams_generating` index from Feature 03.

## Out of Scope

- PNG capture rendering (Feature 21) and ZIP packaging (Feature 30).

## Future Modifications

- Feature 21: Provides the PNG buffers this feature stores.
- Feature 30: The ZIP builder reads stored JSON/PNGs and versioned folders.

## Quality Gates

- Run `npm run test` and ensure it passes.
- Run `npm run build` and ensure it passes.
- Run `npm run security:all` and ensure it passes before push.

## Acceptance Criteria

- [ ] Diagram JSON and PNGs persist with generated timestamps; PNG retrieval is access-checked.
- [ ] Failed captures record an error placeholder.
- [ ] Diagram versions are preserved and the current version is recorded.
- [ ] `Project.completedDiagramCount` updates on `DONE`.
- [ ] List views do not select large React Flow JSON columns.
- [ ] Non-owner access returns 404.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
