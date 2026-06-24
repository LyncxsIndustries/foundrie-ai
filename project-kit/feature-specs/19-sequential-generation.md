# Feature 19 - Sequential Generation

## Type

NEW FEATURE

## What This Delivers

The sequential diagram runner with progress UI: jobs run one at a time through `queued` → `generating` → `rendering` → `capturing` → `done`/`error`, rendering generated React Flow data to the canvas and capturing each diagram. A failed job records an error placeholder and the batch continues. The System Context Diagram is generated and approved first, enforcing the diagram-first gate.

## Dependencies

- Feature 18 (Diagram Planning) must be complete (queued jobs exist).
- Features 16–17 (custom nodes/edges) and Feature 14 (canvas) must be complete.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Trigger.dev `/triggerdotdev/trigger.dev`
- React Flow `/xyflow/web`

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `trigger/generate-diagrams.ts`
- `app/api/diagrams/[projectId]/generate/route.ts`
- `app/api/diagrams/[projectId]/status/route.ts`
- `components/diagram-generation/GenerationProgress.tsx`
- `components/diagram-generation/GenerationControls.tsx`

## Files

CREATE: `trigger/generate-diagrams.ts` - durable sequential runner.
CREATE: `app/api/diagrams/[projectId]/generate/route.ts` - thin route triggering the runner.
CREATE: `app/api/diagrams/[projectId]/status/route.ts` - status polling.
CREATE: `components/diagram-generation/GenerationProgress.tsx` and `GenerationControls.tsx`.

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.


- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens, executable `npm run security:all` gates) is also baked into the generated projects, ensuring they are premium products.


- Run jobs one at a time. Update job status at each stage (`queued`, `generating`, `rendering`, `capturing`, `done`, `error`). Render generated React Flow data to the canvas and capture each diagram after render (Feature 21 provides the capture).
- Continue after a per-job failure: record `errorMessage`, create an error placeholder, and proceed. One failed diagram never cancels the batch.
- The System Context Diagram runs first and must be human-approved before the remaining diagrams generate (diagram-first gate). Surface the approval step in the UI.
- Each generation step is a checkpoint so power loss resumes from the last completed diagram (LangGraph PostgresSaver semantics in the deployed Python layer; the durable Trigger.dev task provides equivalent recoverability here). The runner is idempotent by job ID.
- `GenerationProgress` shows category grouping, the current job, and recoverable failure states.

## Out of Scope

- PNG capture implementation details (Feature 21) and diagram persistence specifics (Feature 20).
- Diagram versioning UI beyond recording (handled with storage).

## Future Modifications

- Feature 20: Diagram storage persists JSON and PNGs the runner produces.
- Feature 21: Canvas export provides the capture step.

## Quality Gates

- Run `npm run test` and ensure it passes.
- Run `npm run build` and ensure it passes.
- Run `npm run security:all` and ensure it passes before push.

## Acceptance Criteria

- [ ] Jobs run one at a time and transition through all statuses.
- [ ] A failed job records an error placeholder and the batch continues.
- [ ] The System Context Diagram generates first and requires approval before the rest.
- [ ] Generation is recoverable (idempotent by job ID; resumes after interruption).
- [ ] `GenerationProgress` shows current job, category grouping, and failure states.
- [ ] Non-owner access returns 404.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
