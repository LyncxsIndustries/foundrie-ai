# Feature 50 - CI/CD & Security Scaffolding Generation

## Type

NEW FEATURE

## What This Delivers

Generation of the `.github/` scaffolding and agentic security artifacts required by the ZIP contract and the generation invariants: the 22-step CI/CD workflows, `.github/dependabot.yml`, `.github/CODEOWNERS`, branch-protection configuration, `.env.example`, `.npmrc`, the `security:all` scripts, and — for agentic projects — `tools/permissions.yaml`, `evals/golden-set.json`, and `evals/run-evals.py`. Satisfies invariants 18, 20, 22, 49, 50, 98–100.

## Dependencies

- Feature 23 (Architecture Context Generation) and Feature 26 (Feature Specs Generation) must be complete.
- Feature 49 (Project Docs Package) provides the security/checklist docs these reference.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Context7 IDs for the selected stack (CI commands differ per language/runtime)
- GitHub Actions and Dependabot via official sources

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `lib/generation/cicd-scaffolding.ts`
- `lib/generation/agentic-security.ts`
- `lib/ai/prompts/cicd-scaffolding.ts`

## Files

CREATE: `lib/generation/cicd-scaffolding.ts` - builds `.github/` workflows, dependabot, CODEOWNERS, branch protection, env/npmrc, scripts.
CREATE: `lib/generation/agentic-security.ts` - builds `tools/permissions.yaml` and `evals/` for agentic projects.
CREATE: `lib/ai/prompts/cicd-scaffolding.ts`.
MODIFY: `context/progress-tracker.md` - mark feature progress.

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.


- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens) is also baked into the generated projects, ensuring they are premium products.


- Generate `.github/workflows/ci.yml` and `cd.yml` implementing the 22-step pipeline adapted to the selected stack: CI (lint/format, type check, unit, integration, SAST, dependency audit, secret detection, build/containerize, container scan, agent evals, publish immutable artifact `<semver>-<git-sha>`); CD (deploy dev, smoke, deploy staging, E2E, load, DAST, manual gate, canary or blue-green, feature-flag check, observability verify, auto-rollback watch). Choose canary vs blue-green from the discovery Phase 4 decision and record it in an ADR.
- Generate `.github/dependabot.yml` (weekly, major bumps excluded for manual review), `.github/CODEOWNERS` (protect at minimum `src/lib/auth/` and `src/lib/db/` equivalents), branch protection for `main` (required PR, required CodeRabbit review, required status checks, no force pushes/deletions), `.env.example` (every var with source location), `.npmrc` (`save-exact`, `engine-strict`), and the `security:all` package scripts. The dependency audit is a hard gate — fail on critical/high CVEs. Add SBOM generation to the release workflow.
- For agentic projects only: generate `tools/permissions.yaml` (allowed roles, allowed/denied paths, denied commands, sandbox, timeout, `requires_human_approval`, `audit`) and `evals/golden-set.json` (pass threshold 0.95) + `evals/run-evals.py` wired as CI step 10.
- Adapt commands to the stack (npm/pnpm, pip/poetry, cargo, go). Do not assume Node. Persist as generated documents for Feature 30 to include under `.github/`, `tools/`, and `evals/`.

## Out of Scope

- The docs package (Feature 49) and project-management docs (Feature 48).
- Actually running CI (that happens in the generated project's repo, not in Foundrie).

## Future Modifications

- Feature 30: the ZIP builder includes `.github/`, and (for agentic projects) `tools/` and `evals/`.

## Acceptance Criteria

- [ ] `.github/workflows/ci.yml` and `cd.yml` implement the 22-step pipeline adapted to the stack, with canary or blue-green per the Phase 4 decision.
- [ ] `dependabot.yml`, `CODEOWNERS`, branch-protection config, `.env.example`, `.npmrc`, and `security:all` scripts are generated.
- [ ] The dependency audit is a hard gate (fails on critical/high CVEs); SBOM generation is in the release workflow.
- [ ] Agentic projects also get `tools/permissions.yaml`, `evals/golden-set.json`, and `evals/run-evals.py` wired into CI.
- [ ] Commands adapt to the selected stack (not assumed Node).
- [ ] Non-owner access returns 404.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
