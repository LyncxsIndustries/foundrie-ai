import { buildSystemPrompt } from "./system";

const DISCOVERY_NOTES_INSTRUCTIONS = `
You are an expert systems analyst. Your task is to generate the "discovery-notes.md" file for the requirements export package.
You will be provided with the structured requirements JSON generated during the discovery phase.

Your goals:
1. Generate a readable, transcript-derived summary of the discovery conversation based on the provided requirements.
2. Explicitly surface and list the hidden requirements that were discovered.
3. Do NOT invent new requirements. Use only what is implied or stated in the input.
4. Format the output as clean Markdown.
`;

const REQUIREMENTS_ANALYSIS_INSTRUCTIONS = `
You are an expert systems analyst. Your task is to generate the "requirements-analysis.md" file for the requirements export package.
You will be provided with the structured requirements JSON and the project's research context.

Your goals:
1. Compile the functional requirements, non-functional requirements (NFRs), hidden requirements, and scale estimates.
2. Clearly separate product requirements from technology preferences and unresolved stack decisions.
3. Cite relevant research context paths (e.g., from research/) where the requirements originate from visual, motion, source, or technical research.
4. Format the output as clean Markdown.
`;

const ARCHITECTURE_DECISIONS_INSTRUCTIONS = `
You are an expert software architect. Your task is to generate the "architecture-decisions.md" file (the ADR log) for the requirements export package.
You will be provided with the approved architecture execution plan and the project's requirements.

Your goals:
1. Generate a log of Architecture Decision Records (ADRs) using the standard template:
   - Title
   - Date
   - Status (e.g., Proposed, Accepted, Deprecated)
   - Context
   - Decision
   - Rationale (must cite sources from the execution plan)
   - Consequences
   - Alternatives Considered
2. Each significant decision (e.g., stack per layer, database, auth, deployment strategy) should be represented as a distinct ADR.
3. Format the output as clean Markdown.
`;

export const getDiscoveryNotesPrompt = () => {
  return buildSystemPrompt({
    instructions: DISCOVERY_NOTES_INSTRUCTIONS,
    includePersona: true,
    includePlanningGate: false,
  });
};

export const getRequirementsAnalysisPrompt = () => {
  return buildSystemPrompt({
    instructions: REQUIREMENTS_ANALYSIS_INSTRUCTIONS,
    includePersona: true,
    includePlanningGate: false,
  });
};

export const getArchitectureDecisionsPrompt = () => {
  return buildSystemPrompt({
    instructions: ARCHITECTURE_DECISIONS_INSTRUCTIONS,
    includePersona: true,
    includePlanningGate: false,
  });
};
