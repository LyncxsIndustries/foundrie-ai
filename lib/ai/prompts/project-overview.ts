/**
 * Project Overview Generation Prompt
 * Generates context/project-overview.md for exported projects
 */

interface ProjectOverviewContext {
  projectName: string;
  requirements: {
    functional: string;
    nonFunctional: string;
    hidden: string;
    scale: string;
    security: string;
  };
  architecture?: {
    proposal: string;
    critique: string;
    decisions: string;
  };
  researchFiles: Array<{
    name: string;
    path: string;
    summary: string;
  }>;
  diagramCount: number;
  hasSystemContext: boolean;
  hasERD: boolean;
  hasFeatureDAG: boolean;
}

export function getProjectOverviewPrompt(context: ProjectOverviewContext): string {
  return `You are generating the context/project-overview.md file for an implementation-ready project package.

PROJECT NAME: ${context.projectName}

REQUIREMENTS ANALYSIS:
${context.requirements.functional}

NON-FUNCTIONAL REQUIREMENTS:
${context.requirements.nonFunctional}

HIDDEN REQUIREMENTS:
${context.requirements.hidden}

SCALE REQUIREMENTS:
${context.requirements.scale}

SECURITY REQUIREMENTS:
${context.requirements.security}

${
  context.architecture
    ? `ARCHITECTURE PROPOSAL:
${context.architecture.proposal}

ARCHITECTURE CRITIQUE:
${context.architecture.critique}

ARCHITECTURE DECISIONS:
${context.architecture.decisions}`
    : "ARCHITECTURE: Not yet proposed"
}

RESEARCH CONTEXT:
${
  context.researchFiles.length > 0
    ? context.researchFiles
        .map((file) => `- ${file.name} (${file.path}): ${file.summary}`)
        .join("\n")
    : "No research files referenced"
}

DIAGRAMS:
- Total diagrams: ${context.diagramCount}
- System Context Diagram: ${context.hasSystemContext ? "Generated" : "Pending"}
- Entity Relationship Diagram: ${context.hasERD ? "Generated" : "Pending"}
- Feature Dependency Graph: ${context.hasFeatureDAG ? "Generated" : "Pending"}

---

Generate a comprehensive project-overview.md file with these sections:

1. **# [Project Name]** (use actual project name)

2. **## Overview**
   - What the project is and what problem it solves
   - How it helps users
   - Core value proposition
   - Include the mental model: idea → discovery → requirements → architecture → diagrams → specs → implementation

3. **## Product Positioning**
   - What category/space this project fits into
   - What it is NOT (clarify boundaries)
   - How it differs from alternatives

4. **## Goals**
   - Primary objectives (numbered list, 4-8 items)
   - What success looks like
   - Key capabilities the system must deliver

5. **## Primary Users**
   - Who uses this system (bullet list, 3-5 personas)
   - What each persona needs to accomplish
   - How they benefit

6. **## Core User Flow**
   - Step-by-step walkthrough of the primary user journey (numbered list)
   - Cover from entry point to value delivery
   - Include authentication, key interactions, and outcomes

7. **## Core Features**
   - Group features by functional area (use ### subheadings)
   - Be specific about capabilities
   - Reference the diagrams where applicable (e.g., "see System Context Diagram", "detailed in ERD")

8. **## Technical Stack** (if architecture is proposed)
   - Language and runtime
   - Framework(s)
   - Database and storage
   - Key libraries
   - Infrastructure and deployment
   - **NEVER assume this project uses Foundrie's own stack (Rust/Python/TypeScript/Go)**
   - Base this section ONLY on the architecture proposal provided
   - If no architecture is decided yet, write: "Technical stack will be selected through research and approval based on project requirements"

9. **## Scope**
   - What IS in scope (bullet list)
   - What is explicitly OUT of scope (bullet list)
   - Version 1 boundaries

10. **## Success Criteria**
    - Measurable outcomes that define success (bullet list, 4-6 items)
    - User-facing metrics
    - Technical metrics
    - Business metrics if applicable

11. **## Research Basis**
    - List the research files/assets that informed major decisions
    - Cite specific paths: research/[category]/[filename]
    - Explain how each research artifact influenced the architecture or feature decisions
    - If no research was provided, write: "No research artifacts were referenced in this project's planning phase"

---

CRITICAL RULES:
1. Write in clear, professional technical documentation style
2. Use Markdown formatting with proper headers (# ## ###)
3. Use bullet lists (-, not *) and numbered lists (1. 2. 3.)
4. Be specific and concrete - avoid vague statements like "will be scalable" without details
5. NEVER assume Foundrie's own technology stack - analyze the architecture proposal provided
6. Cite research files by their actual paths when they influenced decisions
7. If information is missing (no architecture, no research), state that explicitly
8. Keep the overview focused on WHAT and WHY, not implementation details (those go in other context files)
9. Do not invent features not mentioned in requirements or architecture
10. Return ONLY the markdown content, no JSON wrapper, no explanations

Generate the project-overview.md content now:`;
}
