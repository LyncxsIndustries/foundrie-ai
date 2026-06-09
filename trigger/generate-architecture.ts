import { task } from "@trigger.dev/sdk";
import { db } from "../lib/db";
import { callAI } from "../lib/ai";
import {
  getArchitectureProposalPrompt,
  getArchitectureCritiquePrompt,
} from "../lib/ai/prompts/architecture";
import type { Plan } from "../lib/ai/tier";

export const generateArchitectureTask = task({
  id: "generate-architecture",
  retry: {
    maxAttempts: 10,
    factor: 1.8,
    minTimeoutInMs: 500,
    maxTimeoutInMs: 30_000,
    randomize: false,
  },
  run: async (payload: { projectId: string }) => {
    const { projectId } = payload;

    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        user: true,
        requirements: true,
        researchDocuments: true,
      },
    });

    if (!project) {
      throw new Error(`Project ${projectId} not found.`);
    }

    if (!project.requirements) {
      throw new Error(`Project ${projectId} has no requirements.`);
    }

    const plan = project.user.plan as Plan;
    const requirementsContent = JSON.stringify(project.requirements.content, null, 2);
    const researchContext = project.researchDocuments
      .map((doc) => `--- Research: ${doc.title} ---\n${doc.content}`)
      .join("\n\n");

    const proposalPrompt = `
Requirements:
${requirementsContent}

Research Context:
${researchContext}

Based on the above requirements and research, propose candidate architecture stacks with current versions, trade-offs, and justification.
`;

    const proposalResponse = await callAI("architecture_proposal", {
      systemPrompt: getArchitectureProposalPrompt(),
      userPrompt: proposalPrompt,
      plan,
      maxTokens: 8000,
    });

    if (proposalResponse.status === "queued") {
      throw new Error("AI rotation engine exhausted providers for architecture_proposal.");
    }

    const proposalText = proposalResponse.text.replace(/```json\n?|\n?```/g, "").trim();
    let proposalJson: any = {};
    try {
      proposalJson = JSON.parse(proposalText);
    } catch (e) {
      console.warn("Failed to parse architecture proposal JSON, storing raw string.");
      proposalJson = { raw: proposalText };
    }

    const critiquePrompt = `
Proposed Architecture:
${proposalText}

Review this architecture proposal for scalability, security, and feasibility concerns.
`;

    const critiqueResponse = await callAI("architecture_critique", {
      systemPrompt: getArchitectureCritiquePrompt(),
      userPrompt: critiquePrompt,
      plan,
      maxTokens: 4000,
    });

    if (critiqueResponse.status === "queued") {
      throw new Error("AI rotation engine exhausted providers for architecture_critique.");
    }

    const critiqueText = critiqueResponse.text.replace(/```json\n?|\n?```/g, "").trim();
    let critiqueJson: any = {};
    try {
      critiqueJson = JSON.parse(critiqueText);
    } catch (e) {
      console.warn("Failed to parse architecture critique JSON, storing raw string.");
      critiqueJson = { raw: critiqueText };
    }

    const initialNodes = [
      {
        id: "system",
        type: "default",
        position: { x: 400, y: 50 },
        data: { label: project.name || "System" },
      },
      {
        id: "user",
        type: "default",
        position: { x: 50, y: 200 },
        data: { label: "Primary User" },
      },
    ];

    const initialEdges = [
      {
        id: "e1",
        source: "user",
        target: "system",
        label: "uses",
      },
    ];

    const planContent = `# Architecture Proposal

## Candidate Stacks
${JSON.stringify(proposalJson.candidateStacks || [], null, 2)}

## Recommended Stack
${JSON.stringify(proposalJson.recommendedStack || {}, null, 2)}

## Technical Review
${JSON.stringify(critiqueJson, null, 2)}

## Initial System Context
This proposal includes an initial React Flow architecture diagram with ${initialNodes.length} nodes and ${initialEdges.length} edges.
`;

    await db.$transaction([
      db.executionPlan.create({
        data: {
          projectId,
          taskType: "ARCHITECTURE_PROPOSAL",
          status: "PROPOSED",
          content: planContent,
        },
      }),
      db.project.update({
        where: { id: projectId },
        data: {
          status: "ARCHITECTURE",
        },
      }),
    ]);

    return {
      message: "Architecture proposal generated and awaiting approval.",
      projectId,
      proposal: proposalJson,
      critique: critiqueJson,
      initialDiagram: { nodes: initialNodes, edges: initialEdges },
    };
  },
});
