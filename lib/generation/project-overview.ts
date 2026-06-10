/**
 * Project Overview Generation
 * Generates context/project-overview.md for exported projects
 */

import { db } from "@/lib/db";
import { callAI } from "@/lib/ai";
import { getProjectOverviewPrompt } from "@/lib/ai/prompts/project-overview";

export async function generateProjectOverview(
  projectId: string
): Promise<string> {
  // Fetch project with all required context
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      requirements: {
        select: {
          content: true,
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
          title: true,
          sourceType: true,
          content: true,
        },
      },
      diagrams: {
        select: {
          diagramTypeId: true,
          status: true,
        },
      },
    },
  });

  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  if (!project.requirements) {
    throw new Error(
      `Project ${projectId} has no requirements - run requirements generation first`
    );
  }

  // Parse requirements content JSON
  const reqContent = project.requirements.content as Record<string, any>;
  const executionPlan = project.executionPlans[0];
  
  // Build context for AI
  const context = {
    projectName: project.name,
    requirements: {
      functional: JSON.stringify(reqContent.functional || [], null, 2),
      nonFunctional: JSON.stringify(reqContent.nonFunctional || [], null, 2),
      hidden: JSON.stringify(reqContent.hidden || reqContent.hiddenRequirements || [], null, 2),
      scale: JSON.stringify(reqContent.scale || {}, null, 2),
      security: JSON.stringify(reqContent.security || [], null, 2),
    },
    architecture: executionPlan
      ? {
          proposal: executionPlan.content,
          critique: executionPlan.revisionNotes || "",
          decisions: "",
        }
      : undefined,
    researchFiles: project.researchDocuments.map((doc) => ({
      name: doc.title,
      path: `research/${doc.sourceType}/${doc.title.toLowerCase().replace(/\s+/g, "-")}`,
      summary: doc.content.length > 500 ? `${doc.content.slice(0, 500)}...` : doc.content,
    })),
    diagramCount: project.diagrams.length,
    hasSystemContext: project.diagrams.some(
      (d) => d.diagramTypeId === "system-context" && d.status === "DONE"
    ),
    hasERD: project.diagrams.some(
      (d) => d.diagramTypeId === "erd" && d.status === "DONE"
    ),
    hasFeatureDAG: project.diagrams.some(
      (d) => d.diagramTypeId === "feature-dag" && d.status === "DONE"
    ),
  };

  // Generate overview via AI
  const prompt = getProjectOverviewPrompt(context);
  const response = await callAI("project_overview_md", {
    systemPrompt: "You are generating the project-overview.md file for an implementation-ready project package.",
    userPrompt: prompt,
    plan: "FREE",
    maxTokens: 4000,
  });

  if (response.status !== "ok") {
    throw new Error(
      `AI generation failed: ${response.status === "queued" ? response.lastError || "provider chain exhausted" : "unknown error"}`
    );
  }

  return response.text;
}
