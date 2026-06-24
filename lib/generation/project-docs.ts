import { db } from "../db";
import { getAuthUser } from "../auth/get-auth-user";
import { requireProjectOwner } from "../auth/project-access";
import { callAI } from "../ai";
import {
  getProductionChecklistMdPrompt,
  getQualityGateMdPrompt,
  getLoggingMdPrompt,
  getSecurityMdPrompt,
  getPrivacyMdPrompt,
  getToolingMdPrompt,
  getContributingMdPrompt,
  getAdrMdPrompt,
  getRedTeamMdPrompt,
} from "../ai/prompts/project-docs";
import type { Plan } from "../ai/tier";

export async function generateProjectDocs(projectId: string, userId: string) {
  // 1. Verify ownership
  await requireProjectOwner(projectId, userId);

  // 2. Fetch project data
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      requirements: {
        select: { content: true },
      },
      executionPlans: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "asc" },
        select: { content: true },
      },
      contextFiles: {
        select: { fileType: true, content: true },
      },
      diagrams: {
        select: { diagramTypeId: true },
      },
      researchDocuments: {
        where: {
          NOT: {
            sourceType: {
              in: [
                "REQUIREMENTS_EXPORT",
                "PROJECT_MANAGEMENT_EXPORT",
                "PROJECT_DOCS_EXPORT",
              ],
            },
          },
        },
        select: { title: true, content: true, sourceType: true },
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

  const reqsJson = project.requirements?.content
    ? JSON.stringify(project.requirements.content, null, 2)
    : "{}";

  const isAgentic = project.diagrams.some(
    (d) => d.diagramTypeId === "agent-architecture"
  );

  const baseUserPrompt = `
Project Name: ${project.name}

Architecture Context (approved stack):
${archContext}

Requirements JSON:
${reqsJson}
  `.trim();

  const adrUserPrompt = `
Project Name: ${project.name}

Architecture Context:
${archContext}

Architecture Decisions (from planning):
${architecturePlans}
  `.trim();

  // 4. Run AI calls concurrently
  const tasks = [
    callAI("docs_production_checklist_md", {
      systemPrompt: getProductionChecklistMdPrompt(),
      userPrompt: baseUserPrompt,
      plan,
      maxTokens: 4000,
    }),
    callAI("docs_quality_gate_md", {
      systemPrompt: getQualityGateMdPrompt(),
      userPrompt: baseUserPrompt,
      plan,
      maxTokens: 4000,
    }),
    callAI("docs_logging_md", {
      systemPrompt: getLoggingMdPrompt(),
      userPrompt: baseUserPrompt,
      plan,
      maxTokens: 3000,
    }),
    callAI("docs_security_md", {
      systemPrompt: getSecurityMdPrompt(),
      userPrompt: baseUserPrompt,
      plan,
      maxTokens: 4000,
    }),
    callAI("docs_privacy_md", {
      systemPrompt: getPrivacyMdPrompt(),
      userPrompt: baseUserPrompt,
      plan,
      maxTokens: 3000,
    }),
    callAI("docs_tooling_md", {
      systemPrompt: getToolingMdPrompt(),
      userPrompt: baseUserPrompt,
      plan,
      maxTokens: 3000,
    }),
    callAI("docs_contributing_md", {
      systemPrompt: getContributingMdPrompt(),
      userPrompt: baseUserPrompt,
      plan,
      maxTokens: 3000,
    }),
    callAI("docs_adr_md", {
      systemPrompt: getAdrMdPrompt(),
      userPrompt: adrUserPrompt,
      plan,
      maxTokens: 6000,
    }),
  ];

  if (isAgentic) {
    tasks.push(
      callAI("docs_red_team_md", {
        systemPrompt: getRedTeamMdPrompt(),
        userPrompt: baseUserPrompt,
        plan,
        maxTokens: 4000,
      })
    );
  }

  const results = await Promise.all(tasks);

  const getSuccessText = (res: Awaited<ReturnType<typeof callAI>>) => {
    if (res.status !== "ok") {
      throw new Error(
        "AI rotation engine exhausted providers during generation."
      );
    }
    return res.text;
  };

  const cleanMd = (text: string) =>
    text.replace(/^```markdown\n?|\n?```$/g, "").trim();

  const productionChecklistMd = cleanMd(getSuccessText(results[0]));
  const qualityGateMd = cleanMd(getSuccessText(results[1]));
  const loggingMd = cleanMd(getSuccessText(results[2]));
  const securityMd = cleanMd(getSuccessText(results[3]));
  const privacyMd = cleanMd(getSuccessText(results[4]));
  const toolingMd = cleanMd(getSuccessText(results[5]));
  const contributingMd = cleanMd(getSuccessText(results[6]));

  // Parse ADRs JSON
  let adrFiles: Array<{ filename: string; content: string }> = [];
  try {
    const rawAdrText = getSuccessText(results[7]).replace(/^```json\n?|\n?```$/g, "").trim();
    adrFiles = JSON.parse(rawAdrText);
    if (!Array.isArray(adrFiles)) {
      adrFiles = [];
    }
  } catch (e) {
    console.error("Failed to parse ADR JSON", e);
    // Fallback: dump raw text to a single ADR file
    adrFiles = [
      {
        filename: "ADR-0000-Parse-Error.md",
        content: getSuccessText(results[7]),
      },
    ];
  }
  const redTeamMd = isAgentic ? cleanMd(getSuccessText(results[8])) : null;

  // 5. Build database creation array
  const documentsToCreate = [
    {
      projectId,
      sourceType: "PROJECT_DOCS_EXPORT",
      title: "PRODUCTION-CHECKLIST.md",
      content: productionChecklistMd,
    },
    {
      projectId,
      sourceType: "PROJECT_DOCS_EXPORT",
      title: "QUALITY-GATE.md",
      content: qualityGateMd,
    },
    {
      projectId,
      sourceType: "PROJECT_DOCS_EXPORT",
      title: "LOGGING.md",
      content: loggingMd,
    },
    {
      projectId,
      sourceType: "PROJECT_DOCS_EXPORT",
      title: "SECURITY.md",
      content: securityMd,
    },
    {
      projectId,
      sourceType: "PROJECT_DOCS_EXPORT",
      title: "PRIVACY.md",
      content: privacyMd,
    },
    {
      projectId,
      sourceType: "PROJECT_DOCS_EXPORT",
      title: "TOOLING.md",
      content: toolingMd,
    },
    {
      projectId,
      sourceType: "PROJECT_DOCS_EXPORT",
      title: "CONTRIBUTING.md",
      content: contributingMd,
    },
  ];

  for (const adr of adrFiles) {
    documentsToCreate.push({
      projectId,
      sourceType: "PROJECT_DOCS_EXPORT",
      title: `adr/${adr.filename}`,
      content: cleanMd(adr.content),
    });
  }

  if (isAgentic && redTeamMd) {
    documentsToCreate.push({
      projectId,
      sourceType: "PROJECT_DOCS_EXPORT",
      title: "security/RED-TEAM.md",
      content: redTeamMd,
    });
  }

  // 6. Persist to DB
  await db.$transaction([
    db.researchDocument.deleteMany({
      where: {
        projectId,
        sourceType: "PROJECT_DOCS_EXPORT",
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
