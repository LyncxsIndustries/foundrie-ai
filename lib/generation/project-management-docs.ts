import { db } from "../db";
import { getAuthUser } from "../auth/get-auth-user";
import { requireProjectOwner } from "../auth/project-access";
import { callAI } from "../ai";
import {
  getScopeMdPrompt,
  getTimelineMdPrompt,
  getPricingMdPrompt,
  getChangeLogMdPrompt,
} from "../ai/prompts/project-management-docs";
import type { Plan } from "../ai/tier";

/**
 * Generates the four project-management export documents:
 * - SCOPE.md
 * - TIMELINE.md
 * - PRICING.md
 * - CHANGE_LOG.md
 *
 * Persists them as ResearchDocuments with sourceType 'PROJECT_MANAGEMENT_EXPORT'.
 */
export async function generateProjectManagementDocs(
  projectId: string,
  userId: string
) {
  // 1. Verify ownership (owner-only per AC "Non-owner access returns 404")
  await requireProjectOwner(projectId, userId);

  // 2. Fetch project data using the [projectId, order] index for feature specs
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
        select: { content: true, revisionNotes: true },
      },
      featureSpecs: {
        orderBy: { order: "asc" },
        select: { order: true, title: true, content: true },
      },
      researchDocuments: {
        where: {
          NOT: {
            sourceType: {
              in: ["REQUIREMENTS_EXPORT", "PROJECT_MANAGEMENT_EXPORT"],
            },
          },
        },
        select: { title: true, content: true, sourceType: true },
      },
      contextFiles: {
        select: { fileType: true, content: true },
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
  const reqsJson = project.requirements?.content
    ? JSON.stringify(project.requirements.content, null, 2)
    : "{}";

  const researchContext = project.researchDocuments
    .map(
      (doc) =>
        `--- Research: ${doc.title} (${doc.sourceType}) ---\n${doc.content}`
    )
    .join("\n\n");

  const architecturePlans = project.executionPlans
    .map((ep) => ep.content)
    .join("\n\n---\n\n");

  // Extract architecture context for stack info
  const archContext =
    project.contextFiles.find(
      (f) => f.fileType === "ARCHITECTURE_CONTEXT"
    )?.content || "";

  // Prepare feature spec summaries with Out of Scope sections
  const featureSpecSummaries = project.featureSpecs
    .map((spec) => {
      const outOfScopeMatch = spec.content?.match(
        /## Out of Scope\s*\n([\s\S]*?)(?=\n## |$)/
      );
      const outOfScope = outOfScopeMatch
        ? outOfScopeMatch[1].trim()
        : "Not specified";
      return `Feature ${String(spec.order).padStart(2, "0")} - ${spec.title}\nOut of Scope: ${outOfScope}`;
    })
    .join("\n\n");

  const featureCount = project.featureSpecs.length;

  // 4. Build user prompts for each document
  const scopeUserPrompt = `
Project Name: ${project.name}

Feature Specs (${featureCount} total):
${featureSpecSummaries}

Requirements JSON:
${reqsJson}

Architecture Decisions:
${architecturePlans}

Architecture Context:
${archContext}

Research Context:
${researchContext}
  `.trim();

  const timelineUserPrompt = `
Project Name: ${project.name}

Feature Specs (${featureCount} total, ordered by number):
${project.featureSpecs
  .map((spec) => {
    const depsMatch = spec.content?.match(
      /## Dependencies\s*\n([\s\S]*?)(?=\n## |$)/
    );
    const deps = depsMatch ? depsMatch[1].trim() : "None specified";
    return `Feature ${String(spec.order).padStart(2, "0")} - ${spec.title}\nDependencies: ${deps}`;
  })
  .join("\n\n")}

Requirements JSON:
${reqsJson}

Architecture Context:
${archContext}
  `.trim();

  const pricingUserPrompt = `
Project Name: ${project.name}

Architecture Context (approved stack):
${archContext}

Architecture Decisions:
${architecturePlans}

Requirements JSON (scale estimates):
${reqsJson}

Research Context:
${researchContext}
  `.trim();

  const changelogUserPrompt = `
Project Name: ${project.name}
Total Feature Specs: ${featureCount}

Architecture Context (stack summary):
${archContext}
  `.trim();

  // 5. Run AI calls concurrently
  const [scopeRes, timelineRes, pricingRes, changelogRes] = await Promise.all([
    callAI("pm_scope_md", {
      systemPrompt: getScopeMdPrompt(),
      userPrompt: scopeUserPrompt,
      plan,
      maxTokens: 6000,
    }),
    callAI("pm_timeline_md", {
      systemPrompt: getTimelineMdPrompt(),
      userPrompt: timelineUserPrompt,
      plan,
      maxTokens: 6000,
    }),
    callAI("pm_pricing_md", {
      systemPrompt: getPricingMdPrompt(),
      userPrompt: pricingUserPrompt,
      plan,
      maxTokens: 4000,
    }),
    callAI("pm_changelog_md", {
      systemPrompt: getChangeLogMdPrompt(),
      userPrompt: changelogUserPrompt,
      plan,
      maxTokens: 2000,
    }),
  ]);

  // Check for exhaustion
  if (
    scopeRes.status === "queued" ||
    timelineRes.status === "queued" ||
    pricingRes.status === "queued" ||
    changelogRes.status === "queued"
  ) {
    throw new Error(
      "AI rotation engine exhausted providers during generation."
    );
  }

  const cleanMd = (text: string) =>
    text.replace(/^```markdown\n?|\n?```$/g, "").trim();

  const scopeMd = cleanMd(scopeRes.text);
  const timelineMd = cleanMd(timelineRes.text);
  const pricingMd = cleanMd(pricingRes.text);
  const changelogMd = cleanMd(changelogRes.text);

  // 6. Persist to DB — delete existing PM docs and create new ones
  await db.$transaction([
    db.researchDocument.deleteMany({
      where: {
        projectId,
        sourceType: "PROJECT_MANAGEMENT_EXPORT",
      },
    }),
    db.researchDocument.createMany({
      data: [
        {
          projectId,
          sourceType: "PROJECT_MANAGEMENT_EXPORT",
          title: "SCOPE.md",
          content: scopeMd,
        },
        {
          projectId,
          sourceType: "PROJECT_MANAGEMENT_EXPORT",
          title: "TIMELINE.md",
          content: timelineMd,
        },
        {
          projectId,
          sourceType: "PROJECT_MANAGEMENT_EXPORT",
          title: "PRICING.md",
          content: pricingMd,
        },
        {
          projectId,
          sourceType: "PROJECT_MANAGEMENT_EXPORT",
          title: "CHANGE_LOG.md",
          content: changelogMd,
        },
      ],
    }),
  ]);

  return {
    scopeMd,
    timelineMd,
    pricingMd,
    changelogMd,
  };
}
