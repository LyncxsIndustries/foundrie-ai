import { db } from "../db";
import { getAuthUser } from "../auth/get-auth-user";
import { requireProjectOwner } from "../auth/project-access";
import { callAI } from "../ai";
import { getCicdScaffoldingPrompt } from "../ai/prompts/cicd-scaffolding";
import type { Plan } from "../ai/tier";

/**
 * Generates the CI/CD scaffolding and security configuration files.
 * Persists them as ResearchDocuments with sourceType 'CICD_SCAFFOLDING_EXPORT'.
 */
export async function generateCicdScaffolding(projectId: string, userId: string) {
  // 1. Verify ownership (owner-only per AC "Non-owner access returns 404")
  await requireProjectOwner(projectId, userId);

  // 2. Fetch project data
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      contextFiles: {
        select: { fileType: true, content: true },
      },
      executionPlans: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "asc" },
        select: { content: true },
      },
    },
  });

  if (!project) {
    throw new Error(`Project ${projectId} not found.`);
  }

  const user = await getAuthUser();
  if (!user) {
    throw new Error("Unauthenticated user.");
  }
  const plan = user.plan as Plan;

  // 3. Prepare inputs
  const archContext =
    project.contextFiles.find((f) => f.fileType === "ARCHITECTURE_CONTEXT")
      ?.content || "";

  const architecturePlans = project.executionPlans
    .map((ep) => ep.content)
    .join("\n\n---\n\n");

  const userPrompt = `
Project Name: ${project.name}

Architecture Context:
${archContext}

Architecture Decisions:
${architecturePlans}
  `.trim();

  // 4. Run AI call
  const res = await callAI("cicd_scaffolding_generation", {
    systemPrompt: getCicdScaffoldingPrompt(),
    userPrompt,
    plan,
    maxTokens: 8000,
  });

  if (res.status !== "success" && res.status !== "ok") {
    throw new Error("AI rotation engine exhausted providers during generation.");
  }

  // Handle both possible status values from different callAI implementations
  const responseText = 'text' in res ? res.text : (res as any).content || "";

  const cleanMd = (text: string) =>
    text.replace(/^```json\n?|\n?```$/g, "").trim();

  let files: Record<string, any> = {};
  try {
    files = JSON.parse(cleanMd(responseText));
  } catch (e) {
    console.error("Failed to parse CI/CD scaffolding JSON", e);
    throw new Error("Failed to parse generated CI/CD scaffolding JSON.");
  }

  // 5. Build database creation array
  const documentsToCreate = Object.entries(files).map(([filename, content]) => ({
    projectId,
    sourceType: "CICD_SCAFFOLDING_EXPORT",
    title: filename,
    content: typeof content === "string" ? content : JSON.stringify(content, null, 2),
  }));

  // 6. Persist to DB
  await db.$transaction([
    db.researchDocument.deleteMany({
      where: {
        projectId,
        sourceType: "CICD_SCAFFOLDING_EXPORT",
      },
    }),
    db.researchDocument.createMany({
      data: documentsToCreate,
    }),
  ]);

  return {
    success: true,
    documentCount: documentsToCreate.length,
  };
}
