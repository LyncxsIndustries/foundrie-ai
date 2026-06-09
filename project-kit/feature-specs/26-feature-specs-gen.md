# 26 - Feature Specs Generation

## Type

NEW FEATURE

## What This Delivers

Ordered, incremental implementation specs for the exported project, generated from the approved diagrams (the Feature Dependency Graph drives ordering) the same way Foundrie expects its own agents to work: one feature at a time, dependency-safe, no batching, no premature RBAC/auth/UI behavior, each spec testable as a standalone unit with `Files Owned`, Out of Scope, Future Modifications, and binary acceptance criteria.

## Dependencies

- Feature 23 (Architecture Context Generation) must be complete (approved stack recorded).
- The diagram suite (Features 18–21), especially the Feature DAG, must be approved — specs are written from diagrams, never from conversation order alone.

## Files Owned

- `lib/generation/feature-specs.ts`
- `app/api/feature-specs/[projectId]/generate/route.ts`
- `lib/ai/prompts/feature-specs.ts`

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Context7 IDs for every selected framework, SDK, library, and cloud service.
- Prisma `/prisma/web` only when Prisma is selected.
- Clerk `/clerk/clerk-docs` only when Clerk is selected.
- Next.js `/vercel/next.js` only when Next.js is selected.

Use installed Context7 skills or:

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Implementation

- Create a feature breakdown from requirements and architecture.
- Use root `ARTKINS_STYLE_GUIDE.md` as a mandatory policy input for generated spec style, scope, implementation behavior, and no-AI-slope rules.
- Use the generated architecture context's approved stack. Do not assume Foundrie's own stack.
- Use the research corpus as input. Feature specs must reference relevant `research/` Markdown files or asset paths when implementation depends on uploaded screenshots, motion references, frame sequences, web research, Context7 findings, or technical comparisons.
- Generate N specs with zero-padded file names.
- Each generated spec must use this exact structure:

```markdown
# Feature [##] - [Feature Name]

## Type
NEW FEATURE | MODIFICATION (modifies Feature: ___)

## What This Delivers
[One paragraph describing what is true after this feature ships.]

## Dependencies
- Feature [##] ([name]) must be complete before starting.
- [External service] must have required environment variables configured.

## Files Owned
[Exact paths this feature exclusively owns. No other active spec may modify these.]

## Files
CREATE: path/to/file
MODIFY: path/to/file - specific change
RUN: command if needed

## Implementation Notes
- The diagram(s) that govern this feature (the diagram is the truth; the spec is derived from it).
- Security, performance, data, API, UI, and test decisions for this feature only.
- Research references required for this feature, using `research/...` paths.
- Plan approval requirements for this feature before implementation.
- Version research required before installing or pinning any dependency.

## Out of Scope
- Related behavior that must not be built in this spec.

## Future Modifications
- Feature [##]: what will change later and why.

## Acceptance Criteria
- [ ] Binary pass/fail criterion.
- [ ] No TypeScript errors.
- [ ] Required tests or verification pass.
- [ ] All CodeRabbit reviews must pass. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
```

- Apply these generation rules:
  - Order specs from the approved Feature Dependency Graph (DAG), topologically sorted — never from conversation order alone.
  - Each spec is traced to the diagram(s) that govern it; never spec a table, route, or component absent from the diagrams.
  - Each spec declares `Files Owned`; no two active specs own the same file.
  - Never group more than one feature into a spec.
  - Never reference auth before an auth foundation spec exists.
  - Never add logout, user menus, plan gates, admin routes, or ownership checks before the required auth/user data specs exist.
  - Never generate team/org/project RBAC unless requirements explicitly include multi-user collaboration.
  - Never generate PostgreSQL RLS, ABAC, audit logs, or hardware-key admin controls unless compliance requirements explicitly demand them.
  - Always label later edits as `MODIFICATION` and name the earlier feature being modified.
  - Always order dependencies before dependents.
  - Always include Out of Scope and Future Modifications.
  - Always make acceptance criteria binary pass/fail.
  - Always include research references when a spec depends on visual, motion, source, or technical research.
  - Always require the implementing agent to present a plan, wait for approval, support revisions, then execute.
  - Always require the implementing agent to follow root `ARTKINS_STYLE_GUIDE.md`.
  - Never assume the generated project is web, React, Next.js, TypeScript, Tailwind, or GSAP unless selected in the approved architecture context.
  - Never write stale package baselines. Require Context7 and official source checks before package versions are committed.
  - Prefer the smallest working increment that can be implemented, tested, pushed, reviewed, and marked done.
- Persist FeatureSpec rows with stable order.
- Allow review and regeneration.
- Use `Serializable` or another safe ordering strategy when assigning sequential `order` values concurrently.
- Persist generated specs in a transaction so partial spec sets are not left behind after a failed generation.
- Update Project `featureSpecCount` after generation.
- Retrieve ordered specs with the `[projectId, order]` index.

## Scope Limits

- Do not implement later feature specs early.
- Do not introduce undocumented architecture changes.
- Do not bypass the storage, auth, AI, or Context7 rules in the context files.
- Do not generate broad page-level specs that combine many features.
- Do not generate speculative enterprise security, team, or RBAC systems unless the requirements explicitly need them.

## Check When Done

- The feature works within its defined scope.
- Relevant library docs were checked with Context7.
- Types are strict and external input is validated.
- Access control is enforced where data is read or mutated.
- Every generated spec has `Type`, `What This Delivers`, `Dependencies`, `Files`, `Implementation Notes`, `Out of Scope`, `Future Modifications`, and `Acceptance Criteria`.
- Generated specs are one feature each and are ordered by dependency.
- Generated specs mark later edits as `MODIFICATION`.
- Generated specs do not include auth-dependent behavior before auth exists.
- Generated specs do not add team RBAC, RLS, ABAC, custom admin portals, audit logging, or hardware-key admin controls unless explicitly required.
- Generated specs include `research/` references where implementation depends on research.
- Generated specs require root `ARTKINS_STYLE_GUIDE.md`.
- Generated specs require plan approval before implementation.
- Generated specs use the approved project-specific stack.
- Generated specs include version-research requirements before dependency installation or pinning.
- Acceptance criteria are binary pass/fail, not subjective.
- `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- `npm run build` passes once application code exists.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
