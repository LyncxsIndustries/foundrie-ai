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

## Planning Gate

- Never jump from a vague goal directly to implementation.
- Present a concrete plan before implementation-impacting work.
- Wait for explicit user approval before executing the plan.
- If the user requests revisions, update the plan and present the revised version before executing.
- Apply this gate to architecture proposals, diagram generation, context/spec generation, project-specific skill generation, ZIP packaging, and coding-agent implementation.
- Passive discovery chat, source collection, upload intake, and research summarization can continue before approval.

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
6. Tests or focused verification were run.
7. `npm run build` passes when application code exists.
8. The work was pushed to GitHub.
9. CodeRabbit reviewed the GitHub changes.
10. Every CodeRabbit finding was fixed or explicitly resolved.
11. The feature is marked done only after there are no unresolved CodeRabbit issues.
