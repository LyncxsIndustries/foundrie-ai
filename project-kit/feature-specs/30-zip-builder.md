# Feature 30 - ZIP Builder

## Type

NEW FEATURE

## What This Delivers

Server-side ZIP assembly that produces the full product-contract package: root `AGENTS.md` and `ARTKINS_STYLE_GUIDE.md`, the six context files, ordered feature specs, the `diagrams/` suite (with versioned folders), the `research/` folder, `project-management/` documents, `requirements/` docs, `docs/` (production checklist, quality gate, logging, security, privacy), and conditional `.agents/skills/`, `tools/`, and `evals/`. Error placeholders are used for missing diagram PNGs and unavailable research assets.

## Dependencies

- Features 22–29 (context files, specs, skills, AGENTS.md, progress tracker) and Features 20–21 (diagram storage/export) must be complete.
- Feature 07–09 provide the research corpus to include.
- Features 47–50 (requirements docs, project-management docs, the docs package, and CI/security scaffolding) produce additional ZIP artifacts. The builder packages whatever exists and uses placeholders for not-yet-generated artifacts; once 47–50 land, their content flows into the package without changing this builder.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- JSZip `/stuk/jszip` (legacy/reference; Foundrie's deployed builder is the Rust streaming pipeline)
- Vercel Storage `/vercel/storage`

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `lib/zip/build-project-zip.ts`
- `lib/zip/zip-structure.ts`

## Files

CREATE: `lib/zip/build-project-zip.ts` - assembles the ZIP per the product contract.
CREATE: `lib/zip/zip-structure.ts` - the canonical folder/file layout.
MODIFY: `context/progress-tracker.md` - mark feature progress.

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.


- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens) is also baked into the generated projects, ensuring they are premium products.


- Root folder named `{project-slug}_{YYYY-MM-DD_HH-mm-ss}`. The ZIP structure is a product contract; do not rename folders or omit required files. Optional directories appear only when populated.
- Include: root `AGENTS.md`; root `ARTKINS_STYLE_GUIDE.md` (verbatim, never summarized); `.env.example`; `.npmrc`; `.github/` (CODEOWNERS, dependabot.yml, workflows); `context/` (six files); `diagrams/` (mandatory — the suite plus versioned `vN/` folders; a ZIP without `diagrams/` is invalid); `feature-specs/` in numeric order; `research/` (`PROJECT_RESEARCH.md` + populated subfolders only); `project-management/` (SCOPE, TIMELINE, PRICING, CHANGE_LOG); `requirements/` (discovery-notes, requirements-analysis, architecture-decisions); `docs/` (PRODUCTION-CHECKLIST, QUALITY-GATE, LOGGING, SECURITY, PRIVACY, TOOLING, CONTRIBUTING, adr/); conditional `.agents/skills/`, `tools/permissions.yaml`, `evals/`, `docs/security/RED-TEAM.md` for agentic projects.
- Use error placeholders for missing diagram PNGs. Download Blob-backed research assets into the matching `research/` subfolder; use text placeholders preserving source URL and error reason when an asset cannot be included (never fail the whole ZIP for one non-critical asset).
- Use a consistent snapshot for multi-table ZIP reads (`RepeatableRead` where supported). Select only fields needed for assembly; do not fetch large React Flow JSON unless source diagram JSON is required. Use ordered indexed reads: context by file type, specs by order, diagrams by category/order. Fetch research documents ordered by creation/title and assets grouped by type.
- In Foundrie's deployed system the streaming build runs in the Rust execution layer (no whole-ZIP RAM buffering). This spec implements the assembly contract; document the Rust boundary.
- Run the three-category quality gate before finalizing: ensure no empty placeholders in generated docs, structured logging/dependency scaffolding present, and research sources cited.

## Out of Scope

- Triggering the build as a durable job (Feature 31) and the download UI (Feature 32).

## Future Modifications

- Feature 31: The build runs inside a durable Trigger.dev task.
- Feature 32: The download button consumes the produced ZIP.

## Acceptance Criteria

- [ ] The ZIP contains root `AGENTS.md`, root `ARTKINS_STYLE_GUIDE.md`, the six context files, ordered feature specs, the `diagrams/` suite, `research/PROJECT_RESEARCH.md`, `project-management/`, `requirements/`, and `docs/`.
- [ ] `diagrams/` is present (a ZIP without it is invalid) and includes versioned `vN/` folders where diagrams changed.
- [ ] Conditional `.agents/skills/`, `tools/`, `evals/` appear only when populated.
- [ ] Missing diagram PNGs and unavailable research assets use placeholders without failing the build.
- [ ] Multi-table reads use a consistent snapshot; list reads avoid large JSON columns.
- [ ] Feature specs and AGENTS.md can reference research paths that exist in the ZIP.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
