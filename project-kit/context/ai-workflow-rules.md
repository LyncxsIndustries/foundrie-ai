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
5. Read all 9+ specialized context files in order (project-overview, architecture-context, build-plan, code-standards, library-docs, ui-tokens, ui-rules, ui-registry, ai-workflow-rules, progress-tracker).
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

## Semantic Phase Detection Rules (V15.0.0)

Foundrie V15 introduces dynamic phase completion detection. The discovery protocol is no longer fixed at 8 phases. Instead, the AI classifies projects as SIMPLE, STANDARD, or COMPLEX and adapts the phase flow accordingly.

### Project Complexity Classification

**SIMPLE** (3-4 phases, 5-10 messages)
- Landing pages, portfolios, marketing sites, single-feature tools
- Limited backend, mostly static content with forms
- Examples: "Build a portfolio site with dark theme", "Landing page for SaaS product"

**STANDARD** (6-7 phases, 15-25 messages)
- SaaS applications, CRUD apps, content platforms
- Full-stack with database, auth, API, moderate complexity
- Examples: "Task management app with teams", "Blog platform with CMS"

**COMPLEX** (8+ phases, 30+ messages)
- Enterprise platforms, multi-tenant systems, real-time collaboration
- Advanced architecture, microservices, scaling concerns, integrations
- Examples: "Real-time collaboration platform", "Multi-tenant analytics dashboard"

### Classification Signals

Analyze the initial project description for these signals:

**SIMPLE indicators:**
- Keywords: "landing page", "portfolio", "marketing site", "single page", "static"
- No mention of user accounts, database, or API
- Focus on design/branding over functionality
- Timeline: "quick", "simple", "minimal"

**STANDARD indicators:**
- Keywords: "app", "platform", "dashboard", "CRUD", "users"
- Mentions authentication, database, forms, basic API
- Multiple user roles but simple hierarchy (user/admin)
- Standard tech stack (Next.js + Prisma + Clerk)

**COMPLEX indicators:**
- Keywords: "enterprise", "multi-tenant", "microservices", "real-time", "collaboration"
- Mentions scaling, integrations, webhooks, background jobs
- Complex user hierarchies (organizations, teams, roles, permissions)
- Advanced tech requirements (event streaming, graph databases, ML inference)

### Phase Completion Confidence Scoring

For each phase, assign a confidence score (0-100) based on semantic analysis of the conversation:

**Phase 1: Problem & Users**
- ✅ High confidence (85-100): Clear problem statement, specific user personas, measurable success criteria, timeline mentioned
- ⚠️ Medium confidence (60-84): Problem stated but vague, user types mentioned but not detailed, success implied but not explicit
- ❌ Low confidence (<60): Problem unclear, users not identified, no success criteria

**Phase 2: Core Flows**
- ✅ High confidence: Happy path described step-by-step, edge cases mentioned, data flow clear
- ⚠️ Medium confidence: Main flow described but incomplete, edge cases not discussed
- ❌ Low confidence: Vague workflow description, missing key steps

**Phase 3: Scope & Constraints** (STANDARD/COMPLEX only)
- ✅ High confidence: Explicit out-of-scope items, constraints mentioned (time/team/budget), design references provided
- ⚠️ Medium confidence: Some constraints mentioned but incomplete
- ❌ Low confidence: No scope boundaries, no constraints discussed

**Phase 4: Technical Direction** (STANDARD/COMPLEX only)
- ✅ High confidence: Stack preferences stated, deployment target mentioned, non-functional requirements clear
- ⚠️ Medium confidence: Some tech preferences but not comprehensive
- ❌ Low confidence: No technical preferences, unknown deployment target

### Phase Transition Rules

**Auto-advance (confidence ≥ 85%):**
```
System: We've covered [phase name] thoroughly. Moving to [next phase name]...
```

No explicit user confirmation needed. Log transition with confidence score.

**Explicit prompt (confidence 60-84%):**
```
System: We have the core [phase topic] mapped out. Would you like to:
1. Continue to [next phase] (recommended)
2. Dive deeper into [current phase aspect]
3. Review what we've covered so far
```

Wait for user selection before proceeding.

**Hold for clarification (confidence <60%):**
```
System: To move forward, I need more details about [missing information]. Specifically:
- [Required detail 1]
- [Required detail 2]
- [Required detail 3]

Could you elaborate on these points?
```

Do not advance until confidence reaches at least 60%.

### Conversation Tone Adaptation

Adjust conversation formality based on complexity:

**SIMPLE projects:**
- Casual, encouraging tone
- Short questions (1-2 sentences)
- Fewer technical terms
- Example: "Great! What's the main action you want visitors to take on this page?"

**STANDARD projects:**
- Professional, balanced tone
- Medium-length questions (2-4 sentences)
- Standard technical vocabulary
- Example: "Now let's talk about user authentication. Will users sign up with email/password, or do you prefer social logins (Google, GitHub)?"

**COMPLEX projects:**
- Formal, precise tone
- Detailed questions (3-6 sentences)
- Advanced technical terminology
- Example: "Given the multi-tenant architecture requirements, we need to decide on a tenant isolation strategy. Will you use row-level security with a shared schema, separate databases per tenant, or separate schemas within a shared database? Each approach has different trade-offs for scalability, cost, and data isolation."

### Phase Transition Logging

Every phase transition must log:
```typescript
{
  projectId: string;
  fromPhase: string | null;
  toPhase: string;
  confidence: number;
  transitionType: 'auto' | 'explicit' | 'hold';
  messageCount: number;
  timestamp: Date;
  complexity: 'SIMPLE' | 'STANDARD' | 'COMPLEX';
}
```

### Special Cases

**User explicitly requests to skip ahead:**
```
User: "Let's skip to the tech stack discussion."
System: [Acknowledge, then ask missing critical info from skipped phases]
```

**User provides comprehensive initial description:**
- May auto-advance through multiple phases if confidence high for all
- Always confirm before skipping to diagrams: "Based on your detailed description, I have clarity on [phase 1], [phase 2], and [phase 3]. Should we proceed to architecture diagramming, or would you like to review any of these areas first?"

**User contradicts earlier statements:**
- Lower confidence for affected phases
- Re-confirm: "Earlier you mentioned [X], but now it sounds like [Y]. Which direction should we go?"

### Implementation Requirements

1. **Phase detector module:** `lib/ai/phase-detector.ts`
   - `classifyProject(description: string): Promise<ProjectComplexity>`
   - `analyzePhaseCompletion(phase: Phase, messages: Message[]): Promise<ConfidenceScore>`
   - `determineTransitionType(confidence: number): TransitionType`

2. **System prompt updates:**
   - Include phase detection logic
   - Include confidence thresholds
   - Include transition templates

3. **Database schema:**
   - `Project.complexity: Enum('SIMPLE', 'STANDARD', 'COMPLEX')`
   - `ProjectPhaseTransition` model with all logged fields

4. **UI indicators:**
   - Show current phase and progress (e.g., "Phase 2/4" for SIMPLE, "Phase 3/8" for COMPLEX)
   - Show confidence score when in 60-84% range
   - Visual timeline adapts to project complexity

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
