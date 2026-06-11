/**
 * Progress Tracker Generation
 * Generates context/progress-tracker.md for exported projects
 */

import { db } from "@/lib/db";
import { callAI } from "@/lib/ai";
import { getProgressTrackerPrompt } from "@/lib/ai/prompts/progress-tracker";

export async function generateProgressTracker(projectId: string): Promise<string> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      name: true,
      status: true,
      featureSpecs: {
        orderBy: { order: "asc" },
        select: {
          order: true,
          title: true,
          slug: true,
        },
      },
      diagrams: {
        where: { status: "DONE" },
        orderBy: [{ category: "asc" }, { orderInCategory: "asc" }],
        select: {
          diagramTypeId: true,
          name: true,
          version: true,
        },
      },
      executionPlans: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          content: true,
          revisionNotes: true,
        },
      },
      researchDocuments: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  if (project.featureSpecs.length === 0) {
    throw new Error(
      `Project ${projectId} has no feature specs - run feature spec generation first`
    );
  }

  // Map project status to phase name
  const phaseMap: Record<string, string> = {
    DISCOVERY: "Discovery",
    REQUIREMENTS: "Requirements",
    ARCHITECTURE: "Architecture",
    DIAGRAM_GENERATION: "Diagram Generation",
    CONTEXT_GENERATION: "Context Generation",
    READY: "Ready for Implementation",
    COMPLETE: "Complete",
  };

  const currentPhase = phaseMap[project.status] || project.status;

  // Extract architecture decisions from execution plan
  const archPlan = project.executionPlans[0];
  let architectureDecisions = "";
  
  if (archPlan) {
    // Extract key decisions from architecture content
    const content = archPlan.content;
    const stackMatch = content.match(/## Stack Decision[\s\S]*?(?=##|$)/);
    
    if (stackMatch) {
      architectureDecisions = stackMatch[0]
        .replace(/## Stack Decision\s*/i, "")
        .trim()
        .split("\n")
        .slice(0, 15)
        .map(line => line.startsWith("-") ? line : `- ${line}`)
        .join("\n");
    } else {
      architectureDecisions = "- Architecture approved based on requirements analysis\n- Stack decisions documented in architecture context file";
    }

    if (archPlan.revisionNotes) {
      architectureDecisions += `\n- Revision notes: ${archPlan.revisionNotes}`;
    }
  } else {
    architectureDecisions = "- Architecture pending approval";
  }

  const context = {
    projectName: project.name,
    currentPhase,
    featureSpecs: project.featureSpecs,
    diagrams: project.diagrams.map(d => ({
      diagramTypeId: d.diagramTypeId,
      name: d.name,
      version: d.version,
    })),
    architectureDecisions,
    researchCount: project.researchDocuments.length,
  };

  const systemPrompt = getProgressTrackerPrompt(context);
  const userPrompt = `Generate the complete progress tracker markdown file for ${project.name} with all required sections.`;

  const response = await callAI("progress_tracker_md", {
    systemPrompt,
    userPrompt,
    plan: "FREE",
    maxTokens: 4000,
  });

  if (response.status === "queued") {
    throw new Error(
      "AI rotation engine is temporarily unavailable - all providers rate limited or unavailable"
    );
  }

  return response.text;
}
