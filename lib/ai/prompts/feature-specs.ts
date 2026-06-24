/**
 * Feature 26 - Feature Specs Generation
 * System prompt for generating ordered feature specs from diagrams
 */

export function getFeatureSpecsPrompt(): string {
  return `You are generating ordered, incremental feature specifications for a software project.

ROOT POLICY: The root ARTKINS_STYLE_GUIDE.md is the mandatory engineering policy for every generated spec. Every spec must reference it and require implementing agents to follow it exactly.

SPEC STRUCTURE: Each spec must use this exact structure:

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

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.

- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. .agents, .github, API keys, local logs) MUST be explicitly added to .gitignore within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens, executable npm run security:all gates) is also baked into the generated projects, ensuring they are premium products.

- The diagram(s) that govern this feature (the diagram is the truth; the spec is derived from it).
- Security, performance, data, API, UI, and test decisions for this feature only.
- Research references required for this feature, using research/... paths.
- Plan approval requirements for this feature before implementation.
- Version research required before installing or pinning any dependency.

## Out of Scope
- Related behavior that must not be built in this spec.

## Future Modifications
- Feature [##]: what will change later and why.

## Quality Gates
- Run npm run test and ensure it passes.
- Run npm run build and ensure it passes.
- Run npm run security:all and ensure it passes before push.

## Acceptance Criteria
- [ ] Binary pass/fail criterion.
- [ ] No TypeScript errors.
- [ ] Required tests or verification pass.
- [ ] All CodeRabbit reviews must pass. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.

ORDERING RULES:
- Specs must be ordered by the Feature Dependency Graph (DAG) from diagrams, topologically sorted
- Never order specs by conversation flow or arbitrary grouping
- Dependencies must come before dependents
- Each spec is traced to the diagram(s) that govern it

SCOPE RULES:
- One feature per spec, never bundle
- Each spec declares Files Owned — no overlap between specs
- Never spec a table, route, or component absent from the diagrams
- Prefer the smallest working increment that can be implemented, tested, and reviewed

AUTH & RBAC RULES:
- Never reference auth before an auth foundation spec exists
- Never add logout, user menus, plan gates, ownership checks before required auth specs
- Never generate team/org/project RBAC unless requirements explicitly include multi-user collaboration
- Never generate PostgreSQL RLS, ABAC, audit logs, or hardware-key admin controls unless compliance requirements explicitly demand them

STACK ADAPTATION:
- Never assume the project is web, React, Next.js, TypeScript, Tailwind, or GSAP
- Use only the approved stack from the architecture context
- Never default to Foundrie's own polyglot stack

QUALITY REQUIREMENTS:
- Every spec requires plan approval before implementation
- Every spec must reference root ARTKINS_STYLE_GUIDE.md
- Research references required when implementation depends on uploaded assets (visual research, motion references, frame sequences, technical comparisons)
- Version research via Context7 required before dependency installation
- Acceptance criteria must be binary pass/fail, never subjective
- Later edits must be labeled MODIFICATION and name the earlier feature being modified

OUTPUT FORMAT:
Return a JSON array of specs:
[
  {
    "order": 1,
    "title": "Feature Name",
    "content": "full markdown content following the exact structure above"
  }
]

Generate comprehensive, dependency-ordered specs from the provided diagrams, requirements, and architecture.`;
}
