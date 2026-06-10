import { db } from "../db";
import { callAI } from "../ai";
import { getDiagramPlanningPrompt } from "../ai/prompts/diagram-plan";
import { DiagramPlanSchema } from "./schemas/plan";
import type { Plan } from "../ai/tier";

export async function planDiagramJobs(projectId: string, plan: Plan) {
  // 1. Fetch project with requirements and architecture
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      requirements: true,
      executionPlans: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!project) {
    throw new Error(`Project ${projectId} not found.`);
  }

  if (!project.requirements) {
    throw new Error(`Project ${projectId} has no requirements. Generate requirements first.`);
  }

  // Architecture content is stored as a string, use it directly in the prompt
  const architectureContent = project.executionPlans[0]?.content || "No architecture context available yet.";

  // 2. Build AI prompt
  const userPrompt = `
Project: ${project.name}

Requirements:
${JSON.stringify(project.requirements.content, null, 2)}

Architecture Context:
${architectureContent}

Plan the exact diagram suite needed for this project. Follow the trigger conditions strictly.
`;

  // 3. Call AI rotation engine
  const response = await callAI("diagram_planning", {
    systemPrompt: getDiagramPlanningPrompt(),
    userPrompt,
    plan,
    maxTokens: 4000,
  });

  if (response.status === "queued") {
    throw new Error("AI rotation engine exhausted providers for diagram_planning.");
  }

  // 4. Parse and validate response
  const jsonText = response.text.replace(/```json\n?|\n?```/g, "").trim();
  let parsedPlan;
  try {
    parsedPlan = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`Failed to parse diagram plan JSON: ${e}`);
  }

  const validatedPlan = DiagramPlanSchema.parse(parsedPlan);

  // 5. Ensure System Context is first
  const systemContextJob = validatedPlan.jobs.find(
    (j) => j.diagramTypeId === "system-context"
  );
  if (!systemContextJob || systemContextJob.orderInCategory !== 0) {
    throw new Error("System Context diagram must be first with orderInCategory: 0");
  }

  // 6. Create all diagram records in a single transaction
  const createdDiagrams = await db.$transaction(async (tx) => {
    const diagrams = await Promise.all(
      validatedPlan.jobs.map((job) =>
        tx.diagram.create({
          data: {
            projectId,
            diagramTypeId: job.diagramTypeId,
            category: job.category,
            name: job.name,
            folderPath: job.folderPath,
            fileName: job.fileName,
            orderInCategory: job.orderInCategory,
            status: "QUEUED",
            version: 1,
          },
        })
      )
    );

    // Update project diagram count
    await tx.project.update({
      where: { id: projectId },
      data: { diagramCount: diagrams.length },
    });

    return diagrams;
  });

  return {
    diagrams: createdDiagrams,
    rationale: validatedPlan.rationale,
  };
}
