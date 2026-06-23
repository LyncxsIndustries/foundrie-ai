import { db } from "../db";
import { getAuthUser } from "../auth/get-auth-user";
import { requireProjectMember } from "../projects/auth";
import { callAI } from "../ai";
import {
  getDiscoveryNotesPrompt,
  getRequirementsAnalysisPrompt,
  getArchitectureDecisionsPrompt,
} from "../ai/prompts/requirements-docs";
import type { Plan } from "../ai/tier";

/**
 * Generates the three requirements export documents:
 * - discovery-notes.md
 * - requirements-analysis.md
 * - architecture-decisions.md
 * 
 * Persists them as ResearchDocuments with sourceType 'REQUIREMENTS_EXPORT'.
 */
export async function generateRequirementsDocs(projectId: string, userId: string) {
  // 1. Verify membership
  await requireProjectMember(projectId, userId);

  // 2. Fetch the project and user
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      requirements: true,
      executionPlans: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "asc" },
      },
      researchDocuments: true,
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
  const reqsJson = project.requirements?.content
    ? JSON.stringify(project.requirements.content, null, 2)
    : "{}";

  const researchContext = project.researchDocuments
    .filter(doc => doc.sourceType !== "REQUIREMENTS_EXPORT") // Exclude previous generation if any
    .map((doc) => `--- Research: ${doc.title} (${doc.sourceType}) ---\n${doc.content}`)
    .join("\n\n");

  const architecturePlans = project.executionPlans
    .map((ep) => ep.content)
    .join("\n\n---\n\n");

  // 4. Generate Discovery Notes
  const discoveryPrompt = `
Requirements JSON:
${reqsJson}
  `.trim();

  // 5. Generate Requirements Analysis
  const analysisPrompt = `
Requirements JSON:
${reqsJson}

Research Context:
${researchContext}
  `.trim();

  // 6. Generate Architecture Decisions
  const adrPrompt = `
Requirements JSON:
${reqsJson}

Approved Architecture Plans:
${architecturePlans}
  `.trim();

  // Run AI calls concurrently
  const [discoveryRes, analysisRes, adrRes] = await Promise.all([
    callAI("requirements_export_discovery_md", {
      systemPrompt: getDiscoveryNotesPrompt(),
      userPrompt: discoveryPrompt,
      plan,
      maxTokens: 4000,
    }),
    callAI("requirements_export_analysis_md", {
      systemPrompt: getRequirementsAnalysisPrompt(),
      userPrompt: analysisPrompt,
      plan,
      maxTokens: 8000,
    }),
    callAI("requirements_export_adr_md", {
      systemPrompt: getArchitectureDecisionsPrompt(),
      userPrompt: adrPrompt,
      plan,
      maxTokens: 8000,
    }),
  ]);

  if (
    discoveryRes.status === "queued" ||
    analysisRes.status === "queued" ||
    adrRes.status === "queued"
  ) {
    throw new Error("AI rotation engine exhausted providers during generation.");
  }

  const cleanMd = (text: string) => text.replace(/^```markdown\n?|\n?```$/g, "").trim();

  const discoveryNotes = cleanMd(discoveryRes.text);
  const reqAnalysis = cleanMd(analysisRes.text);
  const archDecisions = cleanMd(adrRes.text);

  // 7. Persist to DB
  await db.$transaction([
    db.researchDocument.deleteMany({
      where: {
        projectId,
        sourceType: "REQUIREMENTS_EXPORT",
      },
    }),
    db.researchDocument.createMany({
      data: [
        {
          projectId,
          sourceType: "REQUIREMENTS_EXPORT",
          title: "discovery-notes.md",
          content: discoveryNotes,
        },
        {
          projectId,
          sourceType: "REQUIREMENTS_EXPORT",
          title: "requirements-analysis.md",
          content: reqAnalysis,
        },
        {
          projectId,
          sourceType: "REQUIREMENTS_EXPORT",
          title: "architecture-decisions.md",
          content: archDecisions,
        },
      ],
    }),
  ]);

  return {
    discoveryNotes,
    reqAnalysis,
    archDecisions,
  };
}
