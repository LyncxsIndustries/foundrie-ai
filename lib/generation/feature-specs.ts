/**
 * Feature 26 - Feature Specs Generation
 * Core logic for generating ordered feature specs from diagrams
 */

import { db } from "@/lib/db";
import { callAI } from "@/lib/ai";
import { getFeatureSpecsPrompt } from "@/lib/ai/prompts/feature-specs";
import type { FeatureSpecModel } from "@/lib/generated/prisma/models";
import { slugify } from "@/lib/projects/slug";

interface GeneratedSpec {
  order: number;
  title: string;
  content: string;
}

/**
 * Generate feature specs from approved diagrams, requirements, and architecture.
 * Persists specs in transaction with stable ordering.
 */
export async function generateFeatureSpecs(
  projectId: string,
): Promise<FeatureSpecModel[]> {
  // Fetch project with all required relations
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      requirements: {
        select: { content: true },
      },
      executionPlans: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "asc" },
        select: { content: true, revisionNotes: true },
      },
      diagrams: {
        orderBy: [{ category: "asc" }, { orderInCategory: "asc" }],
        select: {
          id: true,
          diagramTypeId: true,
          category: true,
          name: true,
          reactFlowData: true,
          status: true,
        },
      },
      contextFiles: {
        select: { fileType: true, content: true },
      },
      researchDocuments: {
        select: { title: true, sourceType: true, content: true },
      },
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  // Extract Feature DAG if available
  const featureDag = project.diagrams.find(
    (d) => d.diagramTypeId === "feature-dag",
  );

  // Build context for AI
  const requirements = project.requirements?.content || {};
  const architecture = project.executionPlans[0]?.content || "";
  const contextFiles = project.contextFiles.reduce(
    (acc, cf) => {
      acc[cf.fileType] = cf.content;
      return acc;
    },
    {} as Record<string, string>,
  );
  const researchContext = project.researchDocuments
    .map((rd) => `${rd.title} (${rd.sourceType}):\n${rd.content}`)
    .join("\n\n");

  // Build user prompt with all context
  const userPrompt = `Generate ordered feature specs for this project.

REQUIREMENTS:
${JSON.stringify(requirements, null, 2)}

APPROVED ARCHITECTURE:
${architecture}

FEATURE DEPENDENCY GRAPH:
${featureDag ? JSON.stringify(featureDag.reactFlowData, null, 2) : "No DAG available - infer dependencies from requirements and architecture"}

DIAGRAMS:
${project.diagrams.map((d) => `- ${d.name} (${d.diagramTypeId}, ${d.category})`).join("\n")}

PROJECT OVERVIEW CONTEXT:
${contextFiles.PROJECT_OVERVIEW || "Not yet generated"}

UI CONTEXT:
${contextFiles.UI_CONTEXT || "Not yet generated"}

CODE STANDARDS:
${contextFiles.CODE_STANDARDS || "Not yet generated"}

RESEARCH:
${researchContext || "No research documents"}

Generate comprehensive, dependency-ordered feature specs following the exact structure and rules provided.`;

  // Call AI
  const response = await callAI("feature_specs_generation", {
    systemPrompt: getFeatureSpecsPrompt(),
    userPrompt,
    plan: "PRO", // Use tier primary for generation quality
    maxTokens: 8000,
  });

  if (response.status === "queued") {
    throw new Error("AI generation queued, retry later");
  }

  // Parse response
  const specs: GeneratedSpec[] = JSON.parse(response.text);

  // Persist in transaction with Serializable isolation
  const savedSpecs = await db.$transaction(
    async (tx) => {
      // Delete existing specs if regenerating
      await tx.featureSpec.deleteMany({
        where: { projectId },
      });

      // Create all specs
      const created = await Promise.all(
        specs.map((spec) =>
          tx.featureSpec.create({
            data: {
              projectId,
              order: spec.order,
              title: spec.title,
              slug: slugify(spec.title),
              content: spec.content,
            },
          }),
        ),
      );

      // Update project count
      await tx.project.update({
        where: { id: projectId },
        data: { featureSpecCount: specs.length },
      });

      return created;
    },
    { isolationLevel: "Serializable" },
  );

  return savedSpecs;
}
