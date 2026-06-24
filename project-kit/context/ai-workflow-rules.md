# Development Workflow

## Contract Synchronization Gate

Any implementation change that corrects or changes a contract must be reflected in the same branch across the affected feature spec, dependent future specs, relevant context files, root AGENTS.md, and progress-tracker.md. Contracts include Prisma fields and relations, route signatures, auth helper signatures, AI task names and callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, and file ownership. A feature is not ready for review while later specs or context still describe stale fields, old API shapes, or invalid contracts.


## Approach

Build Foundrie AI incrementally from the feature specs. Context files define what to build, why it exists, how the system is structured, and the current state. Feature specs define the implementation order. Agents must not jump from a vague goal to code.

Implementation is strictly one feature spec at a time. Roadmap phase labels are organizational only; they are not permission to batch work. A feature is not complete until it is implemented, tested, pushed to GitHub, and the GitHub review loop is clean (if the user chose to use CodeRabbit).

## Mandatory Startup Routine

1. Read `AGENTS.md`.
2. Read `ARTKINS_STYLE_GUIDE.md`.
3. Read `research/PROJECT_RESEARCH.md` and any research files/assets referenced by the current feature.
4. Read `research/FOUNDRIE_RESEARCH.md` (and the relevant versioned `FOUNDRIE_V*.md` when you need the changelog or exact wording).
5. Read all six context files in order.
6. Read the current feature spec.
7. Read `progress-tracker.md`.
8. Use Context7 for current docs for every framework, SDK, CLI, or cloud service the feature touches.
9. If modifying the database schema, run `npm run db:generate` or `npm run db:migrate` before testing.

The research corpus is cumulative: `FOUNDRIE_V1.0.0.md` is the foundation and each later version documents only deltas, all in force. When sources disagree, the higher-numbered version wins. Two shifts to remember: Foundrie's own stack is the four-layer polyglot architecture (v2), and Foundrie is diagram-first (v6).

## Planning Gate

- Never jump from a vague goal directly to implementation.
- Present a concrete plan before implementation-impacting work.
- Wait for explicit user approval before executing the plan.
- If the user requests revisions, update the plan and present the revised version before executing.
- Apply this gate to architecture proposals, diagram generation, context/spec generation, project-specific skill generation, ZIP packaging, and coding-agent implementation.
- Passive discovery chat, source collection, upload intake, and research summarization continue before approval.

### Context7-Driven Planning

During planning, use Context7 to read the latest official docs for **every** tool, CLI, SDK, library, and cloud service the feature touches. This is mandatory before presenting a plan.

- Identify prerequisites: installation, authentication, CLI setup (e.g., "Install CodeRabbit CLI and authenticate before using the `code-review` skill").
- Identify required user inputs: API keys, config choices, account setup, environment variables.
- Present all discovered prerequisites and required inputs in the plan before asking for approval.
- If a prerequisite cannot be determined from docs, ask the user directly.
- Never present a plan that assumes undocumented setup steps are complete.

## Context7 Rules

- Project-local Context7 skills are installed at `.agents/skills/`. Use `context7-cli`, `context7-mcp`, or `find-docs` whenever implementation depends on current library behavior.

```bash
npx ctx7 library <library-name> "<implementation question>"
npx ctx7 docs <library-id> "<implementation question>"
```

- Known library IDs are listed in `architecture-context.md`.
- If Context7 results conflict with existing context files, pause and update the context file before implementation.
- Before committing a framework, SDK, library, or package version, verify the current stable install/version guidance with Context7 and official sources. Model IDs are pinned to exact versions, never `"latest"`.
- Generated projects must not default to Foundrie's own stack. Ask about preferences, explain trade-offs, and record the approved stack decision in an ADR.

## Required Skills Workflow

**CRITICAL RULE: Always check `.agents/skills/` first.**

Foundrie enforces specialized skills for tasks beyond generic text generation. Before starting implementation or documentation, the AI agent MUST check the `.agents/skills/` directory for a relevant skill and read its `SKILL.md` file. Follow the patterns exactly.

Key skill groups include:
- **Framework & Libraries**: `next-best-practices`, `react-expert`, `shadcn`, `liveblocks-best-practices`, `trigger-tasks`, etc.
- **Review and Fix**: `code-review` and `autofix` for resolving CodeRabbit findings.
- **Document Research**: `docx`, `pdf`, `pptx`, `xlsx` exclusively when parsing uploaded research assets or generating research deliverables. Do not rely on generic text extraction when a skill exists.
- **UI and Design**: `frontend-design` and `theme-factory` when modifying the Foundrie UI or planning a generated project's styling.
- **Architecture Validation**: stack-specific skills (e.g., `trigger-tasks`, `liveblocks-best-practices`, `clerk-nextjs-patterns`) when implementing foundational architecture.

## Scoping Rules

- Work on one feature spec at a time. Do not combine multiple numbered specs in one pass.
- Do not open or continue the next spec until the current one is fully done (tests/build pass and the GitHub review loop is clean).
- Treat roadmap phase names as labels only; they do not authorize batching.
- Build exactly what the current spec requires. Do not prebuild future behavior.
- Keep UI, API, background task, database, and AI-provider work separated unless the spec explicitly combines them.
- Prefer small, verifiable increments over broad speculative rewrites.
- Do not introduce a new package without checking Context7 docs and recording why it is needed.

## Diagram-First Discipline

- For Foundrie's own generation features and for every generated project, no feature spec is written before all applicable diagrams are generated and approved.
- The System Context Diagram is generated and approved first; the Feature Dependency Graph drives spec ordering.
- A downstream agent (RUWA) reads diagrams before context files and never implements a database table, API route, or component absent from the corresponding diagram — it reports the discrepancy instead. The diagram is the truth; the spec is an instruction derived from it.

## Feature Spec Shape

Every Foundrie feature spec and every generated user-project spec uses this shape:

```markdown
# Feature [##] - [Feature Name]

## Type
NEW FEATURE | MODIFICATION (modifies Feature: ___) | REMOVAL (removes Feature: ___)

## What This Delivers
[One paragraph describing the shipped behavior.]

## Dependencies
- Feature [##] ([name]) must be complete before starting.

## Files Owned
[Exact paths this feature exclusively owns. No other active spec may modify these.]

## Files
CREATE: path/to/file
MODIFY: path/to/file - specific change
RUN: command if needed

## Implementation Notes
- Only decisions needed for this feature. Reference the governing diagram and any research/ paths.

## Out of Scope
- Related work that must not be built yet.

## Future Modifications
- Feature [##]: what will change later and why.

## Acceptance Criteria
- [ ] Binary pass/fail criterion.
```

## Incremental Generation Rules

- Never generate a fixed framework stack before the tech-stack conversation and research are complete.
- Never hardcode stale framework/package version baselines. Never use `"latest"` for model IDs.
- Never generate a spec that depends on auth before an auth spec exists.
- Never generate logout, user avatar, admin access, plan gates, or collaboration permissions before their dependencies exist.
- Never group more than one feature into one spec. Always order specs so dependencies come first (from the Feature DAG).
- Always label later edits as `MODIFICATION` and removals as `REMOVAL`. Removing a COMPLETE feature generates a removal spec — dead code is never left behind.
- Always include `Files Owned`, Out of Scope, and Future Modifications.
- Never generate full multi-role RBAC unless the project explicitly requires multi-user collaboration.
- Use the simplest working version first, then evolve through later modification specs.
- Every recommendation cites a source. Surface hidden requirements and proactive architecture warnings (N+1, missing index, circular dependency, missing error handling) before specs are approved.
- Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within the feature spec that introduces them.
- Every feature spec MUST explicitly include this instruction: "For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed."
- Every feature spec MUST ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens) is also baked into the generated projects, ensuring they are premium products.

## Scope Change Protocol

Any mid-development scope change (addition, removal, redesign) triggers an Impact Analysis (affected features, new features needed, diagram updates, timeline delta, cost delta) before any spec is regenerated. On approval: update affected diagrams (new versions), regenerate affected specs, update `project-management/CHANGE_LOG.md`, generate an ADR, and flag revised specs as "re-review required" in `progress-tracker.md`.

## When To Split Work

Split a task if it combines: authentication changes and AI workflow changes; canvas interaction and ZIP packaging; database schema and UI redesign; multiple unrelated API route groups; or behavior not defined in context files or the current spec.

## Handling Missing Requirements

- Do not invent product behavior that is not documented.
- Add missing decisions to `progress-tracker.md` as open questions. If a missing decision blocks implementation, ask the user.
- If a conservative default is obvious and low risk, document it before proceeding.

### User-Input-First Philosophy

- Never assume credentials, config values, environment setup, or account state.
- Always ask for required inputs rather than guessing, skipping, or using placeholders.
- If a skill or tool has a setup/auth step (from Context7 docs or its `SKILL.md`), surface it in the plan and ask the user to complete it before proceeding.
- When multiple valid approaches exist, present options with trade-offs and let the user decide.

## Protected Foundation Components

Do not modify generated shadcn/ui foundation components unless a feature spec explicitly requires it. Project-specific styling and behavior belongs in app-level components.

## Keeping Docs In Sync

Update the relevant context file whenever implementation changes: architecture or system boundaries, storage model, model routing or fallback chains, diagram type system, ZIP output contract, feature scope, or code standards. When research changes architecture, keep `FOUNDRIE_RESEARCH.md`, the context files, and the feature specs synchronized.

## Before Moving To The Next Unit

1. The feature works end to end within its stated scope.
2. Context7 documentation was checked for touched libraries.
3. The approved plan was followed, or a revised plan was approved before changes continued.
4. No invariant in `architecture-context.md` was violated.
5. `progress-tracker.md` reflects the actual state.
6. Unit tests are written for the feature's core logic, API routes, and critical paths.
7. All unit tests pass: `npm run test`.
8. `npm run build` passes when application code exists.
9. `npm run security:all` passes (SAST, dependency audit with no critical/high CVEs, secret detection).
10. Push the branch to GitHub.
11. We wait for the user to do CodeRabbit review in GitHub. While not mandatory, it is highly recommended as a quality gate to catch issues early.
12. Fix every GitHub CodeRabbit finding and push again. Repeat until there are no unresolved findings (if the user chose to use it).
13. The feature is marked done only after tests pass, build passes, the quality gate passes, and all required gates pass.

## Branch-First Git Workflow

Every feature spec is implemented on an isolated Git branch, created before any code is written.

### Creating a Feature Branch
1. Ensure you are on the latest `master`: `git checkout master && git pull origin master`.
2. Create and switch: `git checkout -b feature/<number>-<slug>` (e.g., `feature/03-database-schema`).
3. All implementation, testing, and review happen exclusively on this branch.

### Completing a Feature Branch
1. Write unit tests for core logic, API routes, and critical paths.
2. Run `npm run test` and `npm run build`; ensure both pass.
3. Run `npm run security:all`; resolve all critical/high findings.
4. Push: `git push origin feature/<number>-<slug>`.
5. Open a PR.
6. We wait for the user to do CodeRabbit review in GitHub (recommended but optional).
7. Fix additional findings and push again.
8. Repeat the GitHub review/fix loop until clean (if used).
9. Merge into `master`.
10. Mark the feature done in `progress-tracker.md`.

### Transitioning to the Next Feature
1. Switch back to `master` and pull the latest merged code.
2. Create the next feature branch.
3. Read the next spec and create the mandatory Implementation Plan on the new branch.
4. Execute only after the user approves the plan.

### Rules
- Never commit Feature N+1 code on a Feature N branch. Never start coding before the branch exists.
- Architectural or housekeeping changes mid-feature are committed on the current branch and noted in `progress-tracker.md`.

## Context Engineering (Within Sessions)

- Read only the current feature spec and the context files. Do not re-read previous specs unless the current spec references them.
- For large files (> 100KB), use semantic search to find relevant sections rather than loading the whole file.
- Structure intermediate outputs as JSON or Markdown tables when they feed another step.
- After each feature, summarize implementation decisions into `progress-tracker.md` rather than keeping the full implementation conversation in context.
