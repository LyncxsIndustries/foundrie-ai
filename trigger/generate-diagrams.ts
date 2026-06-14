import { task, metadata } from "@trigger.dev/sdk";
import { db } from "../lib/db";
import { callAI } from "../lib/ai";
import { getDiagramGenerationPrompt } from "../lib/ai/prompts/diagram-generation";
import type { Plan } from "../lib/ai/tier";

export const generateDiagramsTask = task({
  id: "generate-diagrams",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  run: async (payload: { projectId: string; triggeredByUserId: string }) => {
    const { projectId } = payload;

    // Fetch project with all context
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        user: true,
        requirements: true,
        executionPlans: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        diagrams: {
          where: { status: "QUEUED" },
          orderBy: [{ category: "asc" }, { orderInCategory: "asc" }],
        },
      },
    });

    if (!project) {
      throw new Error(`Project ${projectId} not found.`);
    }

    const plan = project.user.plan as Plan;
    const queuedDiagrams = project.diagrams;

    if (queuedDiagrams.length === 0) {
      return { message: "No queued diagrams to generate.", projectId };
    }

    // Set initial metadata
    metadata
      .set("totalDiagrams", queuedDiagrams.length)
      .set("currentIndex", 0)
      .set("status", "running");

    const requirementsText = project.requirements?.content
      ? JSON.stringify(project.requirements.content, null, 2)
      : "No requirements available.";
    const architectureText = project.executionPlans[0]?.content || "No architecture available.";

    // Process diagrams sequentially
    for (let i = 0; i < queuedDiagrams.length; i++) {
      const diagram = queuedDiagrams[i];

      // Update progress metadata
      metadata
        .set("currentIndex", i + 1)
        .set("currentDiagramId", diagram.id)
        .set("currentDiagramType", diagram.diagramTypeId);

      // Update status to GENERATING
      await db.diagram.update({
        where: { id: diagram.id },
        data: { status: "GENERATING", startedAt: new Date() },
      });

      try {
        // Generate diagram
        const userPrompt = `
Project: ${project.name}

Requirements:
${requirementsText}

Architecture:
${architectureText}

Generate a ${diagram.diagramTypeId} diagram named "${diagram.name}".
`;

        const response = await callAI("diagram_generation", {
          systemPrompt: getDiagramGenerationPrompt(diagram.diagramTypeId),
          userPrompt,
          plan,
          maxTokens: 4000,
        });

        if (response.status === "queued") {
          throw new Error("AI rotation engine exhausted for diagram_generation.");
        }

        // Parse response
        const jsonText = response.text.replace(/```json\n?|\n?```/g, "").trim();
        const reactFlowData = JSON.parse(jsonText);

        // Validate basic structure
        if (!reactFlowData.nodes || !Array.isArray(reactFlowData.nodes)) {
          throw new Error("Invalid diagram: missing nodes array");
        }
        if (!reactFlowData.edges || !Array.isArray(reactFlowData.edges)) {
          throw new Error("Invalid diagram: missing edges array");
        }

        // Update to RENDERING (placeholder status for now, actual rendering in Feature 20)
        await db.diagram.update({
          where: { id: diagram.id },
          data: { status: "RENDERING", reactFlowData },
        });

        // Update to CAPTURING (placeholder, actual capture in Feature 21)
        await db.diagram.update({
          where: { id: diagram.id },
          data: { status: "CAPTURING" },
        });

        // Update to DONE
        await db.diagram.update({
          where: { id: diagram.id },
          data: {
            status: "DONE",
            completedAt: new Date(),
          },
        });

        // If this is System Context, return for approval
        if (diagram.diagramTypeId === "system-context") {
          metadata.set("status", "awaiting_approval");

          return {
            message: "System Context diagram generated. Awaiting approval before continuing.",
            projectId,
            diagramsCompleted: 1,
            diagramsTotal: queuedDiagrams.length,
            systemContextId: diagram.id,
            needsApproval: true,
          };
        }
      } catch (error) {
        // Record error and continue
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await db.diagram.update({
          where: { id: diagram.id },
          data: {
            status: "ERROR",
            errorMessage,
            completedAt: new Date(),
          },
        });

        metadata.append("errors", `${diagram.diagramTypeId}: ${errorMessage}`);
      }
    }

    // Update project status
    await db.project.update({
      where: { id: projectId },
      data: { status: "DIAGRAM_GENERATION", completedDiagramCount: queuedDiagrams.length },
    });

    metadata.set("status", "completed");

    return {
      message: "All diagrams generated successfully.",
      projectId,
      diagramsCompleted: queuedDiagrams.length,
    };
  },
});
