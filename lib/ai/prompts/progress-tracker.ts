/**
 * Progress Tracker Generation Prompt
 * Generates context/progress-tracker.md for exported projects
 */

interface ProgressTrackerContext {
  projectName: string;
  currentPhase: string;
  featureSpecs: Array<{
    order: number;
    title: string;
    slug: string;
  }>;
  diagrams: Array<{
    diagramTypeId: string;
    name: string;
    version: number;
  }>;
  architectureDecisions: string;
  researchCount: number;
}

export function getProgressTrackerPrompt(context: ProgressTrackerContext): string {
  return `You are generating the progress tracker (context/progress-tracker.md) for an implementation-ready project package.

This tracker seeds the implementation status so a coding agent can resume work from Feature 01.

PROJECT NAME: ${context.projectName}
CURRENT PHASE: ${context.currentPhase}
TOTAL FEATURES: ${context.featureSpecs.length}
RESEARCH DOCUMENTS: ${context.researchCount}

FEATURE LIST:
${context.featureSpecs.map(f => `${f.order}. ${f.title}`).join("\n")}

DIAGRAMS (version log):
${context.diagrams.map(d => `- ${d.name} (${d.diagramTypeId}) v${d.version}`).join("\n")}

ARCHITECTURE DECISIONS SUMMARY:
${context.architectureDecisions}

Generate a complete progress tracker markdown file with these exact sections:

## Contract Synchronization Gate

Any implementation change that corrects or changes a contract must be reflected in the same branch across the affected feature spec, dependent future specs, relevant context files, root AGENTS.md, and progress-tracker.md. Contracts include Prisma fields and relations, route signatures, authorization helper signatures, AI task names and callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, and file ownership. A feature is not ready for review while later specs or context still describe stale fields, old API shapes, or invalid contracts.

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- ${context.currentPhase}

## Current Goal

- **Feature 01 - ${context.featureSpecs[0]?.title || "First Feature"}**: Begin implementation from the first feature spec.

## In Progress

- \`[ ]\` Nothing in progress.

## Completed

- **Initial Scaffold**: The project structure has been generated based on approved requirements, architecture, and diagrams.

## Architecture Decisions

${context.architectureDecisions}

## Open Questions

- None recorded. Record any missing product decision here before inventing behavior.

## Diagram Version Log

${context.diagrams.map(d => `- **${d.name}** (${d.diagramTypeId}): v${d.version}`).join("\n")}

## Session Notes

- **Session ${new Date().toISOString().split("T")[0]}**: Project initialized with ${context.featureSpecs.length} feature specs, ${context.diagrams.length} diagrams, and ${context.researchCount} research documents. Ready for implementation starting with Feature 01.

## Process Reminders

- End-of-feature tracker update (AGENTS.md step 6) is a hard gate: before committing the feature branch, the current spec must be moved to Completed/DONE, In Progress cleared, and Current Goal + Next Up set to the next numbered spec. Do not commit the tracker in an intermediate "pending review" state — the merged branch must land a tracker already pointing at the next feature.

## Last Updated

${new Date().toISOString()}

CRITICAL RULES:
1. All features start as NOT STARTED with Feature 01 as Current Goal
2. In Progress is empty initially
3. Completed shows only the initial scaffold
4. Diagram version log lists ALL diagrams with their version numbers
5. Architecture decisions extracted from the approved execution plan
6. Include the exact ISO timestamp at the end
7. Use markdown formatting with proper headers and lists
8. Keep the contract synchronization gate warning at the top
9. Session notes reference the initialization date and counts

Generate the complete markdown file following this structure exactly.`;
}
