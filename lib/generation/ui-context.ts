/**
 * UI Context Generation
 * Generates context/ui-context.md for exported projects
 */

import { db } from "@/lib/db";
import { callAI } from "@/lib/ai";
import { getUIContextPrompt } from "@/lib/ai/prompts/ui-context";

export async function generateUIContext(projectId: string): Promise<string> {
  // Fetch project with all required relations
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      requirements: true,
      executionPlans: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "asc" },
      },
      researchDocuments: {
        select: {
          title: true,
          sourceType: true,
          content: true,
        },
      },
      researchAssets: {
        select: {
          fileName: true,
          metadata: true,
        },
      },
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  // Build context from project data
  const requirements = project.requirements?.content as Record<string, unknown> | null;
  const architecture = project.executionPlans[0]?.content || "No architecture defined yet";
  
  // Extract visual research context
  const visualResearch = project.researchDocuments
    .filter((doc) => doc.sourceType === "VISUAL" || doc.sourceType === "DESIGN_SYSTEM")
    .map((doc) => `### ${doc.title}\n${doc.content}`)
    .join("\n\n");

  const visualAssets = project.researchAssets
    .filter((asset) => {
      const metadata = asset.metadata as Record<string, unknown> | null;
      return metadata?.analysis || metadata?.colorPalette || metadata?.motionPlan;
    })
    .map((asset) => {
      const metadata = asset.metadata as Record<string, unknown>;
      return `### ${asset.fileName}\n${JSON.stringify(metadata, null, 2)}`;
    })
    .join("\n\n");

  // Build user prompt with project context
  const userPrompt = `Generate a UI Context document for this project.

## Project Overview
Name: ${project.name}
Type: ${requirements?.projectType || "Not specified"}
Target Audience: ${requirements?.targetAudience || "Not specified"}

## Requirements Summary
${JSON.stringify(requirements || {}, null, 2)}

## Architecture Context
${architecture}

${visualResearch ? `## Visual Research\n${visualResearch}` : ""}
${visualAssets ? `## Visual Asset Analysis\n${visualAssets}` : ""}

Generate comprehensive UI context following the structure and rules in the system prompt.`;

  // Call AI to generate UI context
  const response = await callAI("ui_context_md", {
    systemPrompt: getUIContextPrompt(),
    userPrompt,
    plan: "FREE", // Default plan for generation tasks
    maxTokens: 6000,
  });

  // Handle queued status
  if (response.status === "queued") {
    throw new Error("AI generation is currently queued. Please try again in a moment.");
  }

  return response.text;
}
