# 27 - Project-Specific Agent Skills

## Type

NEW FEATURE

## What This Delivers

Generation and provisioning of `.agents/skills/` for exported projects. This feature acts as an installer that copies Universal skills, smartly selects Stack-Dependent skills based on the approved architecture, and generates custom skills for project-specific repeatable workflows.

## Dependencies

- Feature 26 (Feature Specs Generation) must be complete (specs and architecture context exist to inform skills).
- Feature 30 (ZIP Builder) consumes the generated skills (this spec modifies the ZIP builder spec accordingly).

## Files Owned

- `lib/skills/generate-project-skills.ts`
- `app/api/skills/[projectId]/generate/route.ts`
- `components/project/ProjectSkillsList.tsx`

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Context7 skills docs
- Local `skill-creator` guidance if available in the agent environment

## Files

CREATE: `lib/skills/generate-project-skills.ts`
CREATE: `app/api/skills/[projectId]/generate/route.ts`
CREATE: `components/project/ProjectSkillsList.tsx`
MODIFY: `app/(app)/projects/[projectId]/export/page.tsx` - show generated skill status before ZIP export.
MODIFY: `project-kit/feature-specs/30-zip-builder.md` - ensure generated skills are included in the ZIP.

## Implementation

- Read the project's research corpus, context files, diagrams, and feature specs.
- Read root `ARTKINS_STYLE_GUIDE.md` and ensure every generated skill enforces it.
- **Dynamic Skill Discovery**: 
  - Read `skills-lock.json` in the root of the Foundrie project.
  - Read the `SKILL.md` for each installed skill.
- **Universal Skills**: Identify skills marked as universal (or matching baseline utility tags like code review, docs) and provision them for every project.
- **Stack-Dependent Skills**: Parse `context/architecture-context.md` of the generated project to identify the selected stack. Filter the dynamically discovered skills and provision those that match the project's framework/tech stack.
- **Custom Skills**: Detect repeatable workflows that deserve a custom skill.
  - Generate `.agents/skills/<skill-name>/SKILL.md` files.
  - Always include a baseline `project-research` skill that tells agents how to use `research/`, uploaded assets, documents, frame ZIPs, and Context7 findings.
  - Every generated skill must require a plan, user approval, revision support, and then execution before implementation-impacting work.
  - Generate additional skills only when justified by the project, such as:
    - frame-sequence animation implementation.
    - domain-specific API usage.
    - data import workflow.
    - design system implementation workflow.
    - compliance review workflow.
- Persist provisioned and generated skill files as Blob-backed artifacts or generated document records so ZIP export can include them.

## Out of Scope

- Installing arbitrary global user skills that are not discovered in `skills-lock.json`.
- Running external plugin marketplaces.
- Generating skills that duplicate `AGENTS.md` or context files without adding workflow value.
- Creating skills for unsupported binary processing.

## Future Modifications

- Later collaboration features can allow users to edit generated skills before export.
- Later plugin features can publish or install reusable skills across projects.

## Acceptance Criteria

- [ ] Generated project ZIP includes `.agents/skills/project-research/SKILL.md`.
- [ ] Generated project ZIP includes all Universal skills.
- [ ] Generated project ZIP includes dynamically selected Stack-Dependent skills matching the architecture context.
- [ ] Additional custom skills are generated only when research/context/specs justify them.
- [ ] Skills require root `ARTKINS_STYLE_GUIDE.md`.
- [ ] Skills require plan approval before implementation-impacting work.
- [ ] Skills reference relevant `research/` paths and feature specs.
- [ ] Skills do not include raw secrets or private credentials.
- [ ] Skills are editable before ZIP export.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes once application code exists.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.

## Implementation Notes

- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens) is also baked into the generated projects, ensuring they are premium products.
