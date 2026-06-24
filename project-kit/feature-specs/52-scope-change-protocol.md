# Feature 52 - Scope Change Protocol & Impact Analysis

## Type

NEW FEATURE

## What This Delivers

The mid-project scope-change workflow: any addition, removal, or redesign triggers an Impact Analysis (affected features, new features needed, diagram updates, timeline delta, cost delta) that the user must approve before any spec is regenerated. On approval, Foundrie updates affected diagrams (new versions), regenerates affected specs, appends to `CHANGE_LOG.md`, generates an ADR, and flags revised specs for re-review. Removing a completed feature generates a dedicated removal spec. Satisfies invariants 63, 64, 67, 68.

## Dependencies

- Feature 26 (Feature Specs Generation), Feature 45 (Architecture Approval Gate & Versioning), and Feature 48 (Project Management Docs) must be complete.
- Feature 44 (Execution Plan & Approval Gate) provides the approval primitive.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Prisma `/prisma/web`
- Next.js `/vercel/next.js`
- Clerk `/clerk/clerk-docs`
- Official npm registry version metadata (`npm view`) for dependency overrides used by the security gate.

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Agent Skills To Use

- `.agents/skills/next-best-practices/SKILL.md`
- `.agents/skills/clerk-nextjs-patterns/SKILL.md`
- `.agents/skills/prisma-client-api/SKILL.md`
- `.agents/skills/context7-cli/SKILL.md`
- `.agents/skills/find-docs/SKILL.md`
- `.agents/skills/code-review/SKILL.md` when preparing review or security-quality feedback.

## Files Owned

- `app/api/projects/[projectId]/scope-changes/route.ts`
- `app/api/projects/[projectId]/scope-changes/route.test.ts`
- `lib/scope/impact-analysis.ts`
- `lib/scope/impact-analysis.test.ts`
- `lib/ai/model-routing.ts` (adds the `scope_change_impact_analysis` task only)
- `lib/ai/prompts/feature-specs.ts` (Quality Gates contract wording only)
- `lib/research/providers/context7.ts` (SAST hardening only)
- `components/project/ScopeChangePanel.tsx`
- `scripts/security/sast-scan.mjs`
- `scripts/security/secret-scan.mjs`
- `package.json`
- `package-lock.json`
- `eslint.config.mjs`
- `AGENTS.md` (security gate wording only)
- `project-kit/context/architecture-context.md`
- `project-kit/context/code-standards.md`
- `project-kit/context/ai-workflow-rules.md`
- `project-kit/context/progress-tracker.md`
- `project-kit/feature-specs/*.md` (Quality Gates wording only)

## Files

CREATE: `lib/scope/impact-analysis.ts` - compute the impact report and apply approved changes.
CREATE: `app/api/projects/[projectId]/scope-changes/route.ts` - submit a change, return the impact report, apply on approval.
CREATE: `components/project/ScopeChangePanel.tsx` - request a change, review impact, approve/reject.
CREATE: `lib/scope/impact-analysis.test.ts` - verify AI contract usage and approved-scope-change side effects.
CREATE: `app/api/projects/[projectId]/scope-changes/route.test.ts` - verify auth, validation, approval, and rejection behavior.
CREATE: `scripts/security/sast-scan.mjs` - local SAST gate used by `npm run security:all`.
CREATE: `scripts/security/secret-scan.mjs` - local secret-detection gate used by `npm run security:all`.
MODIFY: `lib/ai/model-routing.ts` - add `scope_change_impact_analysis` to the canonical task map.
MODIFY: `lib/ai/prompts/feature-specs.ts` - ensure newly generated specs include explicit Quality Gates and executable `npm run security:all` wording.
MODIFY: `lib/research/providers/context7.ts` - replace shell `exec` with `execFile` argument arrays so SAST can enforce no shell interpolation.
MODIFY: `package.json` / `package-lock.json` - add `security:sast`, `security:deps`, `security:secrets`, `security:all`; add exact npm overrides for vulnerable transitive packages.
MODIFY: `eslint.config.mjs` - ignore generated `.trigger/**` and generated Prisma client output.
MODIFY: `AGENTS.md`, `context/architecture-context.md`, `context/code-standards.md`, `context/ai-workflow-rules.md` - synchronize the executable `npm run security:all` contract.
MODIFY: `project-kit/feature-specs/*.md` - add explicit Quality Gates commands across the spec corpus.
MODIFY: `context/progress-tracker.md` - mark feature progress.

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.


- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens, executable `npm run security:all` gates) is also baked into the generated projects, ensuring they are premium products.


- A scope change is one of: addition, removal, or redesign. Impact Analysis produces: completed features affected, in-progress features affected, pending features affected, new features needed, diagrams needing updates, timeline delta, and cost delta — shown to the user before anything is regenerated.
- The impact report includes `changeType: "ADDITION" | "REMOVAL" | "REDESIGN"` so downstream handling is deterministic.
- Route handlers use `requireAuth()` to resolve the local database user and then call `requireProjectOwner(projectId, user.id)`. Never pass Clerk's external user ID into project ownership helpers.
- On approval (via a Feature 44 `ExecutionPlan` with `taskType: SCOPE_CHANGE`, with the impact report as its context): snapshot affected diagrams in `DiagramVersion`, bump current diagram versions to `QUEUED`, flag affected feature specs for re-review, generate any new specs, append a `CHANGE_LOG.md` entry (date, requester, impact summary, feature delta, timeline delta, cost delta), generate an ADR recording the decision, and update the project `PROGRESS_TRACKER` context file.
- `FeatureSpec` has no status enum in the current Prisma contract. CANCELLED, PAUSED, and re-review states are recorded as Markdown notes/spec content and tracker notes rather than inventing unsupported schema fields.
- `CHANGE_LOG.md` and ADRs are stored as `ResearchDocument` records (`sourceType: "PROJECT_MANAGEMENT_EXPORT"` and `"SCOPE_CHANGE_ADR"` respectively) because `ResearchDocument.sourceType` is a string contract.
- Feature removal: a NOT STARTED feature is marked CANCELLED in content/tracker; an IN PROGRESS feature pauses for the user's choice; a COMPLETE (merged) feature generates a new `REMOVAL` feature spec (delete files, remove references, clean migrations, grep for residual references) so dead code is never left behind.
- Use transactions when applying multi-record regeneration. Buttons disable on click. Rejected change requests are recorded with a rejected ADR, not silently dropped.
- The security gate is executable through `npm run security:all`: local SAST, `npm audit --audit-level=high`, and local secret detection. Exact npm overrides are used for transitive `@hono/node-server@1.19.14`, `postcss@8.5.15`, `systeminformation@5.31.9`, and `ws@8.21.0`; current `@trigger.dev/sdk@4.4.6`, `@trigger.dev/build@4.4.6`, `prisma@7.8.0`, and `@prisma/client@7.8.0` were checked with official npm metadata on 2026-06-24.

## Out of Scope

- Automatic re-implementation by a coding agent (the downstream agent re-implements revised specs).
- Cost recomputation beyond the PRICING.md model.

## Future Modifications

- None planned; this completes the scope-management loop for v1.

## Quality Gates

- Run `npm run test` and ensure it passes.
- Run `npm run build` and ensure it passes.
- Run `npm run security:all` and ensure it passes before push.

## Acceptance Criteria

- [ ] Submitting a scope change returns an Impact Analysis (affected/new features, diagram updates, timeline and cost deltas) before any regeneration.
- [ ] Approval is recorded via an `ExecutionPlan` with the impact report as context.
- [ ] On approval, affected diagrams get new versions, affected specs regenerate, new specs are created, `CHANGE_LOG.md` gets an entry, and an ADR is generated.
- [ ] Revised specs are flagged "re-review required" in `progress-tracker.md`.
- [ ] Removing a COMPLETE feature generates a `REMOVAL` spec; NOT STARTED is CANCELLED; IN PROGRESS pauses for user choice.
- [ ] Owner-only; non-owners get 404; rejected requests are recorded.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
