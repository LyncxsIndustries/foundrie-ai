# 27 - Project-Specific Agent Skills

## Type

NEW FEATURE

## Goal

Generate and provision `.agents/skills/` for exported projects. This feature acts as an installer that copies Universal skills, smartly selects Stack-Dependent skills based on the approved architecture, and generates custom skills for project-specific repeatable workflows.

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
MODIFY: `Context_Features_Issues/feature-specs/30-zip-builder.md` - ensure generated skills are included in the ZIP.

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
- [ ] `context/progress-tracker.md` is updated.
- [ ] `npm run build` passes once application code exists.
