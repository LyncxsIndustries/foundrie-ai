import { db } from "../db";
import { getAuthUser } from "../auth/get-auth-user";
import { requireProjectOwner } from "../auth/project-access";
import { callAI } from "../ai";
import { getAgenticSecurityPrompt } from "../ai/prompts/cicd-scaffolding";
import type { Plan } from "../ai/tier";

/**
 * Generates the agentic security configuration files.
 * Persists them as ResearchDocuments with sourceType 'AGENTIC_SECURITY_EXPORT'.
 */
export async function generateAgenticSecurity(projectId: string, userId: string) {
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
      diagrams: {
        select: { diagramTypeId: true },
      },
    },
  });

  if (!project) {
    throw new Error(`Project ${projectId} not found.`);
  }

  // Check if project is agentic
  const isAgentic = project.diagrams.some((d) => d.diagramTypeId === "agent-architecture");
  if (!isAgentic) {
    return { success: true, documentCount: 0, skipped: true };
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

  const userPrompt = `
Project Name: ${project.name}

Architecture Context:
${archContext}
  `.trim();

  // 4. Run AI call
  const res = await callAI("agentic_security_generation", {
    systemPrompt: getAgenticSecurityPrompt(),
    userPrompt,
    plan,
    maxTokens: 4000,
  });

  if (res.status !== "ok") {
    throw new Error("AI rotation engine exhausted providers during generation.");
  }

  const responseText = 'text' in res ? res.text : (res as any).content || "";

  const cleanMd = (text: string) =>
    text.replace(/^```json\n?|\n?```$/g, "").trim();

  let files: Record<string, any> = {};
  try {
    files = JSON.parse(cleanMd(responseText));
  } catch (e) {
    console.error("Failed to parse agentic security JSON", e);
    throw new Error("Failed to parse generated agentic security JSON.");
  }

  // 5. Build database creation array
  const documentsToCreate = Object.entries(files).map(([filename, content]) => ({
    projectId,
    sourceType: "AGENTIC_SECURITY_EXPORT",
    title: filename,
    content: typeof content === "string" ? content : JSON.stringify(content, null, 2),
  }));

  // 6. Persist to DB
  await db.$transaction([
    db.researchDocument.deleteMany({
      where: {
        projectId,
        sourceType: "AGENTIC_SECURITY_EXPORT",
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
