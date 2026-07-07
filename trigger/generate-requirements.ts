import { task } from "@trigger.dev/sdk";
import { db } from "../lib/db";
import { callAI } from "../lib/ai";
import {
  getRequirementsSurfacingPrompt,
  getHiddenRequirementDetectPrompt,
} from "../lib/ai/prompts/requirements";
import type { Plan } from "../lib/ai/tier";

export const generateRequirementsTask = task({
  id: "generate-requirements",
  run: async (payload: { projectId: string }, { ctx }) => {
    const { projectId } = payload;

    // 1. Fetch project and related context
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        user: true,
        conversation: true,
        researchDocuments: true,
        requirements: true, // Fetch existing requirements for incremental update
      },
    });

    if (!project) {
      throw new Error(`Project ${projectId} not found.`);
    }

    const plan = project.user.plan as Plan;
    const conversationMessages = project.conversation?.messages
      ? JSON.stringify(project.conversation.messages, null, 2)
      : "[]";

    const researchContext = project.researchDocuments
      .map((doc) => `--- Research: ${doc.title} ---\n${doc.content}`)
      .join("\n\n");

    const existingRequirements = project.requirements?.content
      ? JSON.stringify(project.requirements.content, null, 2)
      : null;

    // 2. Requirements Surfacing
    const surfacingPrompt = `
Conversation History:
${conversationMessages}

Research Context:
${researchContext}

${existingRequirements ? `Existing Requirements:
${existingRequirements}

Please analyze the above data and intelligently UPDATE the existing requirements based on the latest conversation and research. Add new requirements that surfaced, modify existing ones if they changed, and remove them if they were explicitly discarded. Ensure the final JSON structure includes functional requirements, non-functional requirements, scale estimates, and technology preferences/constraints.` : `Please analyze the above data and provide a comprehensive JSON requirements specification. Include functional requirements, non-functional requirements, scale estimates, and technology preferences/constraints.`}
`;

    const requirementsResponse = await callAI("requirements_surfacing", {
      systemPrompt: getRequirementsSurfacingPrompt(),
      userPrompt: surfacingPrompt,
      plan,
      maxTokens: 8000,
    });

    if (requirementsResponse.status === "queued") {
      throw new Error("AI rotation engine exhausted providers for requirements_surfacing.");
    }

    const requirementsText = requirementsResponse.text.replace(/```json\n?|\n?```/g, "").trim();
    
    // 3. Hidden Requirements Detection
    const hiddenPrompt = `
Based on the following preliminary requirements specification, identify at minimum one hidden requirement per major area (Authentication, Database, Payments, Email, APIs, Performance, Security).

Preliminary Requirements:
${requirementsText}
`;

    const hiddenResponse = await callAI("hidden_requirement_detect", {
      systemPrompt: getHiddenRequirementDetectPrompt(),
      userPrompt: hiddenPrompt,
      plan,
      maxTokens: 4000,
    });

    if (hiddenResponse.status === "queued") {
      throw new Error("AI rotation engine exhausted providers for hidden_requirement_detect.");
    }

    const hiddenText = hiddenResponse.text.replace(/```json\n?|\n?```/g, "").trim();

    // Try to parse the responses
    let requirementsJson = {};
    let hiddenJson = {};
    try {
      requirementsJson = JSON.parse(requirementsText);
    } catch (e) {
      console.warn("Failed to parse requirements JSON, storing raw string.");
      requirementsJson = { raw: requirementsText };
    }

    try {
      hiddenJson = JSON.parse(hiddenText);
    } catch (e) {
      console.warn("Failed to parse hidden requirements JSON, storing raw string.");
      hiddenJson = { raw: hiddenText };
    }

    const finalContent = {
      ...requirementsJson,
      hiddenRequirements: hiddenJson,
    };

    // 4. Atomically backup existing and persist new to db
    const transactions: any[] = [];

    // If there were existing requirements, back them up
    if (project.requirements) {
      transactions.push(
        db.requirementsBackup.create({
          data: {
            projectId,
            requirementsId: project.requirements.id,
            content: project.requirements.content as any,
            runId: ctx?.run?.id || null,
          },
        })
      );
    }

    // Upsert the new requirements
    transactions.push(
      db.requirements.upsert({
        where: { projectId },
        create: {
          projectId,
          content: finalContent,
        },
        update: {
          content: finalContent,
        },
      })
    );

    // Update project status
    transactions.push(
      db.project.update({
        where: { id: projectId },
        data: { status: "REQUIREMENTS" },
      })
    );

    await db.$transaction(transactions);

    return {
      message: "Requirements successfully generated and persisted.",
      projectId,
    };
  },
});
