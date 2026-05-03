# Development Workflow

## Approach

Build Foundrie AI incrementally from the feature specs. Context files define what to build, why it exists, how the system is structured, and what the current state is. Feature specs define the implementation order. Agents must not jump directly from a vague goal to code.

Implementation is strictly one feature spec at a time. Roadmap phase labels are organizational only; they are not permission to batch work. A feature is not complete until it has been implemented, tested, pushed to GitHub, reviewed by CodeRabbit, fixed, re-reviewed as needed, and left with no unresolved review findings.

## Mandatory Startup Routine

1. Read `AGENTS.md`.
2. Read `ARTKINS_STYLE_GUIDE.md`.
3. Read `research/PROJECT_RESEARCH.md` and any research files/assets referenced by the current feature.
4. Read `research/FOUNDRIE_RESEARCH.md`.
5. Read all six context files in order.
6. Read the current feature spec.
7. Read `progress-tracker.md`.
8. Use Context7 for current docs for every framework, SDK, CLI, or cloud service touched by the feature.
9. If modifying the database schema, run `npm run db:generate` or `npm run db:migrate` before testing.

## Planning Gate

- Never jump from a vague goal directly to implementation.
- Present a concrete plan before implementation-impacting work.
- Wait for explicit user approval before executing the plan.
- If the user requests revisions, update the plan and present the revised version before executing.
- Apply this gate to architecture proposals, diagram generation, context/spec generation, project-specific skill generation, ZIP packaging, and coding-agent implementation.
- Passive discovery chat, source collection, upload intake, and research summarization can continue before approval.

### Context7-Driven Planning

During the planning phase, use Context7 to read the latest official documentation for **every** tool, CLI, SDK, library, and cloud service the feature touches. This is mandatory before presenting a plan to the user.

- Identify **prerequisites**: installation steps, authentication steps, CLI setup (e.g., "Install CodeRabbit CLI and authenticate before using the `code-review` skill").
- Identify **required user inputs**: API keys, config choices, account setup, environment variables.
- Present all discovered prerequisites and required inputs in the plan **before** asking for approval.
- If the agent cannot determine a prerequisite from docs, ask the user directly.
- Never present a plan that assumes the user has already completed undocumented setup steps.

## Context7 Rules

- Project-local Context7 skills are installed at `.agents/skills/`.
- Use `context7-cli`, `context7-mcp`, or `find-docs` whenever implementation depends on current library behavior.
- Preferred CLI flow:

```bash
npx ctx7 library <library-name> "<implementation question>"
npx ctx7 docs <library-id> "<implementation question>"
```

- Known library IDs are listed in `architecture-context.md`.
- If Context7 results conflict with existing context files, pause and update the context file before implementation.
- Before committing a framework, SDK, library, or package version, verify the current stable install/version guidance with Context7 and official sources.
- Generated projects must not default to Foundrie's own stack. Ask the user about preferences, explain trade-offs, and record the approved stack decision.

## Required Skills Workflow

Foundrie AI strictly enforces the use of specialized skills for tasks that go beyond generic text generation:

- **Review and Fix**: Use `code-review` and `autofix` for pre-commit checks and resolving GitHub CodeRabbit findings.
- **Document Research**: Use `docx`, `pdf`, `pptx`, and `xlsx` skills *exclusively* when parsing uploaded research assets or generating required research deliverables. Do not rely on generic text extraction if a skill is available.
- **UI and Design**: Use `frontend-design` and `theme-factory` when modifying the Foundrie UI or planning the visual styling for a generated project.
- **Architecture Validation**: Use stack-specific skills (e.g., `trigger-tasks`, `liveblocks-best-practices`, `clerk-nextjs-patterns`) when implementing foundational architecture components.

## Scoping Rules

- Work on one feature spec at a time.
- Do not combine multiple numbered feature specs in one implementation pass.
- Do not open or continue the next feature spec until the current spec is fully done.
- Do not mark a feature complete before the local tests/build pass and the GitHub CodeRabbit review loop is clean.
- Treat roadmap phase names as labels only; they do not authorize batching.
- Build exactly what the current spec requires. Do not prebuild future behavior because it seems likely.
- Keep UI, API, background task, database, and AI-provider work separated unless the spec explicitly combines them.
- Prefer small, verifiable increments over broad speculative rewrites.
- Do not introduce a new package without checking Context7 docs and recording why it is needed.

## Feature Spec Shape

Every Foundrie feature spec and every generated user-project spec must use this shape:

```markdown
# Feature [##] - [Feature Name]

## Type
NEW FEATURE | MODIFICATION (modifies Feature: ___)

## What This Delivers
[One paragraph describing the shipped behavior.]

## Dependencies
- Feature [##] ([name]) must be complete before starting.

## Files
CREATE: path/to/file
MODIFY: path/to/file - specific change
RUN: command if needed

## Implementation Notes
- Only decisions needed for this feature.

## Out of Scope
- Related work that must not be built yet.

## Future Modifications
- Feature [##]: what will change later and why.

## Acceptance Criteria
- [ ] Binary pass/fail criterion.
```

## Incremental Generation Rules

- Never generate a fixed framework stack before the tech-stack conversation and research are complete.
- Never hardcode stale framework/package version baselines.
- Never generate a spec that depends on auth before an auth spec exists.
- Never generate logout, user avatar, admin access, plan gates, or collaboration permissions before their dependencies exist.
- Never group more than one feature into one spec.
- Always order specs so dependencies come first.
- Always label later edits as `MODIFICATION`.
- Always include Out of Scope and Future Modifications.
- Never generate full multi-role RBAC unless the project explicitly requires multi-user collaboration.
- Use the simplest working version first, then evolve it through later modification specs.

## When To Split Work

Split a task if it combines:

- Authentication changes and AI workflow changes.
- Canvas interaction changes and ZIP packaging changes.
- Database schema changes and UI redesign.
- Multiple unrelated API route groups.
- Behavior not defined in context files or the current feature spec.

## Handling Missing Requirements

- Do not invent product behavior that is not documented.
- Add missing decisions to `progress-tracker.md` as open questions.
- If the missing decision blocks implementation, ask the user.
- If a conservative default is obvious and low risk, document it before proceeding.

### User-Input-First Philosophy

- Never assume credentials, config values, environment setup, or account state.
- Always ask the user for required inputs rather than guessing, skipping, or using placeholder values.
- If a skill or tool has a setup/auth step (discovered via Context7 docs or the skill's own `SKILL.md`), surface it explicitly in the plan and ask the user to complete it before proceeding.
- When multiple valid approaches exist, present the options with trade-offs and let the user decide.

## Protected Foundation Components

Do not modify generated shadcn/ui foundation components unless a feature spec explicitly requires it. Project-specific styling and behavior belongs in app-level components.

## Keeping Docs In Sync

Update the relevant context file whenever implementation changes:

- Architecture or system boundaries.
- Storage model.
- Model routing or fallback chains.
- Diagram type system.
- ZIP output contract.
- Feature scope.
- Code standards.

## Before Moving To The Next Unit

1. The feature works end to end within its stated scope.
2. Context7 documentation was checked for touched libraries.
3. The approved plan was followed, or a revised plan was approved before changes continued.
4. No invariant in `architecture-context.md` was violated.
5. `progress-tracker.md` reflects the actual state.
6. Unit tests are written for the feature's core logic, API routes, and critical paths.
7. All unit tests pass: `npm run test`.
8. `npm run build` passes when application code exists.
9. Run `coderabbit review --agent` locally. Fix all critical and warning findings. Re-run until only info-level or no findings remain. This is a mandatory pre-push gate.
10. Push the branch to GitHub.
11. Let CodeRabbit review the GitHub PR for any issues the local review may have missed.
12. Fix every GitHub CodeRabbit finding and push again. Repeat until there are no unresolved findings.
13. The feature is marked done only after tests pass, build passes, and CodeRabbit has no unresolved findings locally or on GitHub.

## Branch-First Git Workflow

Every feature spec is implemented on an isolated Git branch. The branch is created **before** any code is written.

### Creating a Feature Branch
1. Ensure you are on the latest `master` branch: `git checkout master && git pull origin master`.
2. Create and switch to a new branch: `git checkout -b feature/<number>-<slug>` (e.g., `feature/03-database-schema`).
3. All implementation, testing, and review happen exclusively on this branch.

### Completing a Feature Branch
1. Write unit tests for the feature's core logic, API routes, and critical paths.
2. Run `npm run test` and ensure all tests pass.
3. Run `npm run build` and ensure it passes.
4. Run `coderabbit review --agent` locally. Fix all critical and warning findings. Re-run until only info-level or no findings remain.
5. Push the branch to GitHub: `git push origin feature/<number>-<slug>`.
6. Open a Pull Request (or let the push trigger CodeRabbit).
7. Let CodeRabbit review the GitHub PR. Fix any additional findings and push again.
8. Repeat the GitHub review/fix loop until there are no unresolved findings.
9. Merge the branch into `master`.
10. Mark the feature as done in `progress-tracker.md`.

### Transitioning to the Next Feature
1. Switch back to `master` and pull the latest merged code.
2. Create the next feature branch.
3. Read the next feature spec and create the mandatory Implementation Plan on this new branch.
4. Execute only after the user approves the plan.

### Rules
- Never commit Feature N+1 code on a Feature N branch.
- Never start coding before the branch exists.
- If architectural or housekeeping changes happen mid-feature, they are committed on the current feature branch and noted in `progress-tracker.md`.
