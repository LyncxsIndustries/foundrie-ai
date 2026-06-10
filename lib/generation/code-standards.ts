/**
 * Code Standards Generation
 * Generates context/code-standards.md for exported projects
 */

import { db } from "@/lib/db";
import { callAI } from "@/lib/ai";
import { getCodeStandardsPrompt } from "@/lib/ai/prompts/code-standards";

export async function generateCodeStandards(
  projectId: string
): Promise<string> {
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

  if (!project.executionPlans[0]) {
    throw new Error(
      `Project ${projectId} has no approved architecture - run architecture proposal first`
    );
  }

  const reqContent = project.requirements.content as Record<string, any>;
  const executionPlan = project.executionPlans[0];
  const archContent = executionPlan.content.toLowerCase();

  // Detect project characteristics from requirements and architecture
  const hasAuth = 
    archContent.includes("auth") || 
    archContent.includes("clerk") ||
    archContent.includes("supabase auth") ||
    JSON.stringify(reqContent).toLowerCase().includes("authentication");

  const hasUserOwnedData = 
    archContent.includes("user-owned") ||
    archContent.includes("ownership") ||
    JSON.stringify(reqContent).toLowerCase().includes("user data");

  const hasCollaboration =
    archContent.includes("collaborat") ||
    archContent.includes("share") ||
    JSON.stringify(reqContent).toLowerCase().includes("multi-user");

  const usesNeon = 
    archContent.includes("neon") ||
    archContent.includes("postgres") && archContent.includes("serverless");

  // Extract stack summary
  const stackSummary = archContent.substring(0, 1000);

  const context = {
    projectName: project.name,
    requirements: {
      functional: JSON.stringify(reqContent.functional || [], null, 2),
      nonFunctional: JSON.stringify(reqContent.nonFunctional || [], null, 2),
      hidden: JSON.stringify(reqContent.hidden || reqContent.hiddenRequirements || [], null, 2),
      scale: JSON.stringify(reqContent.scale || {}, null, 2),
      security: JSON.stringify(reqContent.security || [], null, 2),
    },
    architecture: {
      proposal: executionPlan.content,
      decisions: executionPlan.revisionNotes || "",
    },
    researchFiles: project.researchDocuments.map((doc) => ({
      name: doc.title,
      summary: doc.content.length > 300 ? `${doc.content.slice(0, 300)}...` : doc.content,
    })),
    hasAuth,
    hasUserOwnedData,
    hasCollaboration,
    usesNeon,
    stackSummary,
  };

  const prompt = getCodeStandardsPrompt(context);
  const response = await callAI("code_standards_md", {
    systemPrompt: "You are generating the code-standards.md file for an implementation-ready project package.",
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
