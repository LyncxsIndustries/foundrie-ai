# 28 - AGENTS.md Generation

## Goal

Generate the root agent entry point for exported packages.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Context7 skills docs
- Prisma `/prisma/web`

Use installed Context7 skills or:

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Implementation

- Use project summary, context files, feature list, and diagrams.
- Use `callAI('agents_md_generation')`.
- Include reading order, feature spec order, hard rules, diagrams, current status, and root `ARTKINS_STYLE_GUIDE.md`.
- Put `ARTKINS_STYLE_GUIDE.md` before context files and feature specs in the generated reading order.
- Tell downstream agents to use the approved project-specific stack from `context/architecture-context.md`, not Foundrie's own stack.
- Tell downstream agents to use Context7 and official sources before installing or pinning package versions.
- Include `research/PROJECT_RESEARCH.md` and the `research/` folder in the reading order before feature implementation starts.
- List the provisioned `.agents/skills/` (Universal, Stack-Dependent, and Custom) in the reading order and instruct the downstream agent to actively use them for tasks like code review, document parsing, and tech stack implementation.
- Explain that research assets are implementation inputs, not decorative extras.
- Include the planning gate: present a plan, wait for explicit user approval, revise when requested, then execute.
- Include the incremental feature implementation rule: one spec at a time, implement, write unit tests, ensure all tests and build pass, push, CodeRabbit review, fix until clean, then mark done.
- Include the mandatory unit testing rule: before pushing any feature branch, write unit tests for core logic, API routes, and critical paths. All tests must pass (`npm run test`) and the build must pass (`npm run build`) before pushing.
- Include the Branch-First Git Workflow: each feature spec gets its own branch (`feature/<number>-<slug>`), created before any code is written, merged to `master` only after the CodeRabbit review loop is clean.
- Include Context7-Driven Planning: during the planning phase, use Context7 to read the latest docs for every tool the feature touches, identify all prerequisites and required user inputs, and present them in the plan before asking for approval.
- Include the User-Input-First Philosophy: never assume credentials, config values, or environment setup. Always ask the user. Surface skill and tool setup steps (install, auth) explicitly in the plan.
- Include generated project hard rules for auth and authorization:
  - authentication and authorization are separate.
  - user-owned data must be scoped by authenticated local user ID.
  - ownership failures return 404.
  - no team RBAC, custom admin portal, RLS, ABAC, audit logs, or hardware-key admin unless explicitly required.
- Include generated spec rules: exact dependencies, exact files, Out of Scope, Future Modifications, binary acceptance criteria, and `MODIFICATION` labels for later edits.
- Persist as ContextFile type `AGENTS_MD`.
- Use `dbRead` for assembling existing context/spec/diagram metadata when replica lag is acceptable.
- Use `dbWrite` for persisting the generated `AGENTS_MD` context file.
- Fetch feature specs ordered by `[projectId, order]`.

## Scope Limits

- Do not implement later feature specs early.
- Do not introduce undocumented architecture changes.
- Do not bypass the storage, auth, AI, or Context7 rules in the context files.

## Check When Done

- The feature works within its defined scope.
- Relevant library docs were checked with Context7.
- Types are strict and external input is validated.
- Access control is enforced where data is read or mutated.
- Generated AGENTS.md tells future agents to handle one feature spec at a time, not roadmap batches.
- Generated AGENTS.md tells future agents to read root `ARTKINS_STYLE_GUIDE.md` before coding.
- Generated AGENTS.md requires plan approval before implementation-impacting work.
- Generated AGENTS.md requires latest-version research before dependency installation or version pinning.
- Generated AGENTS.md makes clear that the project stack is dynamic and project-specific.
- Generated AGENTS.md preserves the auth/authorization ownership rules when the exported project has user-owned data.
- Generated AGENTS.md warns against premature RBAC or enterprise security systems.
- Generated AGENTS.md explains the generated feature spec structure.
- Generated AGENTS.md tells agents to read relevant `research/` files/assets referenced by a feature spec before writing code.
- Generated AGENTS.md tells agents to use project-specific `.agents/skills/` when a feature spec or research file references one.
- Generated AGENTS.md includes the Branch-First Git Workflow (one branch per feature, create before coding, merge after clean review).
- Generated AGENTS.md includes Context7-Driven Planning (read latest docs during planning, surface prerequisites and required user inputs).
- Generated AGENTS.md includes the User-Input-First Philosophy (never assume credentials or config, always ask the user).
- Generated AGENTS.md requires unit tests for every feature before pushing (core logic, API routes, critical paths must be tested and passing).
- `context/progress-tracker.md` is updated.
- `npm run build` passes once application code exists.
