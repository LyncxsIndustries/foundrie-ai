# Feature 49 - Project Docs Package Generation

## Type

NEW FEATURE

## What This Delivers

Generation of the `docs/` folder required in every ZIP: `PRODUCTION-CHECKLIST.md`, `QUALITY-GATE.md`, `LOGGING.md`, `SECURITY.md`, `PRIVACY.md`, `TOOLING.md`, `CONTRIBUTING.md`, and `docs/adr/ADR-NNNN-*.md` (plus `docs/security/RED-TEAM.md` for agentic projects). These satisfy the logging discipline (invariant 87), the three-category quality gate (invariants 105–106), dependency security (`SECURITY.md`), and the production-readiness/privacy/tooling contracts.

## Dependencies

- Feature 23 (Architecture Context Generation) and Feature 26 (Feature Specs Generation) must be complete.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Context7 IDs for the selected stack (for stack-specific security/logging/tooling guidance)
- OWASP and observability references via official sources

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `lib/generation/project-docs.ts`
- `lib/ai/prompts/project-docs.ts`

## Files

CREATE: `lib/generation/project-docs.ts` - builds the docs package.
CREATE: `lib/ai/prompts/project-docs.ts`.
MODIFY: `context/progress-tracker.md` - mark feature progress.

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.


- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens) is also baked into the generated projects, ensuring they are premium products.


- `LOGGING.md`: the 7-item logging checklist, the log-level policy (DEBUG/INFO/WARN/ERROR/FATAL/AUDIT), the request-ID and `trace_id` requirement, the chosen centralized destination (from discovery Phase 4: Datadog/Logtail/CloudWatch/Grafana Loki), retention, and the alert rule (ERROR rate > 1% over 5 min). Forbids `console.log` in production paths.
- `QUALITY-GATE.md`: the three-category gate (Document / Code-Technical / Research) with each checklist, the failure protocol (identify → classify generation vs data failure → route → re-check → log), and the Quality Gate Log table.
- `SECURITY.md`: the dependency-security three-step protocol (audit today, lock versions, monthly cadence), the seven-layer model mapped to the project, the OWASP mitigations, secrets management, and the SBOM/Dependabot note.
- `PRODUCTION-CHECKLIST.md`: Security / Reliability / Observability / Delivery sections (sandboxing for agentic, circuit breakers, fallback model, load testing, structured logging, OTel, alerts, semver, canary/blue-green, rollback, behavioral evals ≥ 95%).
- `PRIVACY.md`: data collection defaults, opt-in policy, and PII scrubbing patterns. `TOOLING.md`: the AI-era tooling matrix adapted to the stack. `CONTRIBUTING.md`: Conventional Commits and the branch/PR/CodeRabbit workflow.
- `docs/adr/`: one file per architecture decision (mirrors the ADR log from Feature 47). For agentic projects, also generate `docs/security/RED-TEAM.md`.
- Adapt every document to the approved project stack; do not assume Foundrie's own. Cite sources. Persist as generated documents for Feature 30 to include under `docs/`.

## Out of Scope

- The CI/CD workflow files, Dependabot, CODEOWNERS, `tools/permissions.yaml`, and `evals/` (Feature 50 generates those).
- The `project-management/` and `requirements/` folders (Features 47–48).

## Future Modifications

- Feature 50: the CI/security scaffolding references `SECURITY.md` and `PRODUCTION-CHECKLIST.md`.
- Feature 30: the ZIP builder reads these into `docs/`.

## Acceptance Criteria

- [ ] `docs/` contains PRODUCTION-CHECKLIST, QUALITY-GATE, LOGGING, SECURITY, PRIVACY, TOOLING, and CONTRIBUTING.
- [ ] `LOGGING.md` records the chosen destination, level policy, request-ID/`trace_id` rule, and forbids `console.log`.
- [ ] `QUALITY-GATE.md` includes all three category checklists, the failure protocol, and the log table.
- [ ] `SECURITY.md` includes the dependency three-step protocol and the seven-layer mapping.
- [ ] `docs/adr/` contains one file per architecture decision; agentic projects also get `docs/security/RED-TEAM.md`.
- [ ] Documents adapt to the approved stack and cite sources.
- [ ] Non-owner access returns 404.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
