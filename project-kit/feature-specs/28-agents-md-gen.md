# Feature 28 - AGENTS.md Generation

## Type

NEW FEATURE

## What This Delivers

Generation of the root `AGENTS.md` agent entry point for exported packages, following the seven-section contract: (1) Project Identity, (2) Mandatory Reading Order (diagrams before context files), (3) Init Plan Data, (4) Hard Rules, (5) Feature Order, (6) Stack Reference with Context7 IDs, (7) Research Files. It requires reading root `ARTKINS_STYLE_GUIDE.md` before coding and encodes the planning gate, branch-first workflow, and incremental methodology.

## Dependencies

- Feature 26 (Feature Specs Generation) and Feature 27 (Project-Specific Agent Skills) must be complete.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Context7 skills docs
- Prisma `/prisma/web` (when Prisma is selected)

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `lib/generation/agents-md.ts`
- `lib/ai/prompts/agents-md.ts`

## Files

CREATE: `lib/generation/agents-md.ts` and `lib/ai/prompts/agents-md.ts`.
MODIFY: `app/api/context-files/[projectId]/generate/route.ts` - add the generated-agent-instructions branch using an existing schema-backed file type, or explicitly migrate `ContextFileType` before introducing a new enum value.

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.


- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens) is also baked into the generated projects, ensuring they are premium products.


- Use project summary, context files, the feature list, the approved diagrams, and provisioned skills. Use the current AI rotation contract: `callAI('agents_md_generation', { systemPrompt, userPrompt, plan, maxTokens })`; success is `status: "ok"` with `text`, and exhaustion is `status: "queued"`.
- Generate the seven sections. The reading order places `ARTKINS_STYLE_GUIDE.md` and `research/PROJECT_RESEARCH.md` first, then the diagrams (System Context, Container, ERD, API Map) before the context files (diagram-first reading order), then the context files, then a scan of feature specs.
- Section 3 (Init Plan Data) lists every required env var with its exact source location, required CLI tools with install commands, required accounts with setup URLs, and ends with the gate sentence ("Tell me 'ready' when you have completed the above, and I will begin Feature 01.").
- Tell downstream agents to use the approved project-specific stack (from `context/architecture-context.md`), not Foundrie's own, and to use Context7 and official sources before installing or pinning versions (no `"latest"`).
- List the provisioned `.agents/skills/` (Universal, Stack-Dependent, Custom) and instruct active use for code review, document parsing, and stack implementation. Explain research assets are implementation inputs.
- Include hard rules: planning gate (plan → approval → revision → execution); one spec at a time with unit tests, passing build, CodeRabbit pre-push gate, and the GitHub review loop; the Branch-First Git Workflow (one branch per feature, created before coding, merged after the review loop is clean); Context7-Driven Planning (read latest docs, surface prerequisites and required user inputs before approval); the User-Input-First Philosophy (never assume credentials/config; always ask); auth/authorization separation; user-owned data scoped by authenticated local user ID with 404 on ownership failure; no team RBAC/custom admin/RLS/ABAC/audit logs/hardware-key admin unless explicitly required; structured logging (no `console.log`); dependency audit as a hard gate; the diagram-first rule (RUWA reads diagrams before context files and never implements anything absent from a diagram); and the spec rules (exact dependencies, exact files, `Files Owned`, Out of Scope, Future Modifications, binary acceptance criteria, `MODIFICATION` labels).
- Persist as `ContextFile` type `AI_WORKFLOW_RULES` unless the schema has been explicitly migrated to add a dedicated `AGENTS_MD` enum value. Use `db` for assembling metadata where eventual consistency is acceptable and for the final upsert. Fetch feature specs ordered by `[projectId, order]`.

## Out of Scope

- The progress tracker (Feature 29) and ZIP packaging (Feature 30).

## Future Modifications

- Feature 30: AGENTS.md is placed at the ZIP root.

## Acceptance Criteria

- [ ] Generated `AGENTS.md` contains all seven sections.
- [ ] The reading order places `ARTKINS_STYLE_GUIDE.md` and research before diagrams, and diagrams before context files.
- [ ] The Init Plan lists every env var with its source, required CLI tools, required accounts, and the gate sentence.
- [ ] It requires the approved project-specific stack, Context7/official version checks, and one-feature-at-a-time implementation with the branch-first workflow and CodeRabbit gate.
- [ ] It encodes the diagram-first rule, auth/ownership rules, and the spec structure, and warns against premature RBAC/enterprise security.
- [ ] It lists the provisioned `.agents/skills/` and instructs active use.
- [ ] Non-owner access returns 404.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
