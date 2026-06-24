# Feature 44 - Execution Plan & Approval Gate

## Type

NEW FEATURE

## What This Delivers

The planning-gate workflow that makes Foundrie's "plan before implementation" rule real in the product: the API and UI for proposing, reviewing, revising, approving, and recording execution of implementation-impacting work, backed by the `ExecutionPlan` model from Feature 03. Architecture generation, diagram generation, context/spec generation, skill generation, and ZIP packaging must have an `APPROVED` plan before they run.

## Dependencies

- Feature 03 (Database Schema) provides the `ExecutionPlan` model and `ExecutionPlanStatus` enum.
- Feature 05 (AI Rotation Engine) generates the plan content.
- Feature 06 (Layout Shell) provides the surface to show plans.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Next.js `/vercel/next.js`
- Prisma `/prisma/web`

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `app/api/projects/[projectId]/plans/route.ts`
- `app/api/projects/[projectId]/plans/[planId]/route.ts`
- `lib/plans/execution-plan.ts`
- `components/project/ExecutionPlanPanel.tsx`

## Files

CREATE: `lib/plans/execution-plan.ts` - create/revise/approve/reject/mark-executed helpers and a `requireApprovedPlan(taskType)` guard.
CREATE: `app/api/projects/[projectId]/plans/route.ts` - list and create plans.
CREATE: `app/api/projects/[projectId]/plans/[planId]/route.ts` - approve, request revision, reject, mark executed.
CREATE: `components/project/ExecutionPlanPanel.tsx` - shows the plan, approve/revise/reject controls.
MODIFY: `context/progress-tracker.md` - mark feature progress.

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.


- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens, executable `npm run security:all` gates) is also baked into the generated projects, ensuring they are premium products.


- An `ExecutionPlan` carries `taskType`, plan Markdown `content`, `status` (PROPOSED/APPROVED/REVISION_REQUESTED/REJECTED/EXECUTED), `revisionNotes`, `approvedAt`, `executedAt`. The flow is: generate a concrete plan (with Context7-discovered prerequisites and required inputs) → user reviews → approve, or request revision (which produces a new revised plan) → execute only after `APPROVED` → mark `EXECUTED` on completion.
- `requireApprovedPlan(projectId, taskType)` is the gate the implementation-impacting features call before running: architecture generation (13), diagram generation (18–21), context/spec generation (22–29), project-specific skill generation (27), and ZIP packaging (30–31). Passive discovery chat, upload intake, link collection, and research summarization do not require a plan.
- All routes use `requireProjectMember()` once Feature 36 exists (until then, owner-scoped). Validate input with Zod. Use `db` for writes; the approve/execute transition uses strong read-after-write.
- Buttons disable on click (idempotency). Plans are revisable; a rejected or superseded plan is retained, not deleted.

## Out of Scope

- The downstream generation features themselves (they consume the gate).
- Scope-change impact analysis (Feature 52).

## Future Modifications

- Features 13, 18, 30, etc.: each adds a `requireApprovedPlan()` call before executing.
- Feature 52: scope-change Impact Analysis produces an `ExecutionPlan` for the change.

## Quality Gates

- Run `npm run test` and ensure it passes.
- Run `npm run build` and ensure it passes.
- Run `npm run security:all` and ensure it passes before push.

## Acceptance Criteria

- [ ] A plan can be created (PROPOSED), revised (REVISION_REQUESTED → new plan), approved (APPROVED), rejected (REJECTED), and marked EXECUTED.
- [ ] `requireApprovedPlan(taskType)` blocks implementation-impacting tasks without an APPROVED plan and allows them with one.
- [ ] Passive discovery/research actions do not require a plan.
- [ ] The plan panel shows content and approve/revise/reject controls; buttons disable on click.
- [ ] Non-members get 404; input is Zod-validated.
- [ ] Rejected/superseded plans are retained.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
