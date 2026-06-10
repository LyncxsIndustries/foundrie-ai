/**
 * Architecture Context Generation
 * Generates context/architecture-context.md for exported projects
 */

import { db } from "@/lib/db";
import { callAI } from "@/lib/ai";
import { getArchitectureContextPrompt } from "@/lib/ai/prompts/architecture-context";
import { exportToOpenAPI } from "@/lib/diagrams/export-formats";
import type { ReactFlowJsonObject } from "@xyflow/react";

export async function generateArchitectureContext(
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
      diagrams: {
        select: {
          diagramTypeId: true,
          status: true,
          reactFlowData: true,
        },
      },
      researchDocuments: {
        select: {
          title: true,
          sourceType: true,
          content: true,
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

  // Get API Map export if exists
  const apiMapDiagram = project.diagrams.find(
    (d) => d.diagramTypeId === "api-map" && d.status === "DONE"
  );
  let apiMapExport: string | undefined;
  if (apiMapDiagram?.reactFlowData) {
    try {
      apiMapExport = exportToOpenAPI(
        apiMapDiagram.reactFlowData as unknown as ReactFlowJsonObject
      );
    } catch {
      // If export fails, continue without it
      apiMapExport = undefined;
    }
  }

  // Build context for AI
  const context = {
    projectName: project.name,
    requirements: {
      functional: JSON.stringify(reqContent.functional || [], null, 2),
      nonFunctional: JSON.stringify(
        reqContent.nonFunctional || [],
        null,
        2
      ),
      hidden: JSON.stringify(
        reqContent.hidden || reqContent.hiddenRequirements || [],
        null,
        2
      ),
      scale: JSON.stringify(reqContent.scale || {}, null, 2),
      security: JSON.stringify(reqContent.security || [], null, 2),
    },
    architecture: executionPlan
      ? {
          proposal: executionPlan.content,
          critique: executionPlan.revisionNotes || "",
        }
      : undefined,
    diagrams: {
      totalCount: project.diagrams.length,
      hasSystemContext: project.diagrams.some(
        (d) => d.diagramTypeId === "system-context" && d.status === "DONE"
      ),
      hasContainer: project.diagrams.some(
        (d) => d.diagramTypeId === "container" && d.status === "DONE"
      ),
      hasERD: project.diagrams.some(
        (d) => d.diagramTypeId === "erd" && d.status === "DONE"
      ),
      hasAPIMap: !!apiMapDiagram,
      apiMapExport,
      hasSecurity: project.diagrams.some(
        (d) =>
          d.diagramTypeId === "security-architecture" && d.status === "DONE"
      ),
    },
    researchFiles: project.researchDocuments.map((doc) => ({
      name: doc.title,
      path: `research/${doc.sourceType}/${doc.title.toLowerCase().replace(/\s+/g, "-")}`,
      summary:
        doc.content.length > 500
          ? `${doc.content.slice(0, 500)}...`
          : doc.content,
    })),
  };

  // Generate architecture context via AI
  const prompt = getArchitectureContextPrompt(context);
  const response = await callAI("architecture_context_md", {
    systemPrompt:
      "You are generating the architecture-context.md file for an implementation-ready project package.",
    userPrompt: prompt,
    plan: "FREE",
    maxTokens: 6000,
  });

  if (response.status !== "ok") {
    throw new Error(
      `AI generation failed: ${response.status === "queued" ? response.lastError || "provider chain exhausted" : "unknown error"}`
    );
  }

  return response.text;
}
