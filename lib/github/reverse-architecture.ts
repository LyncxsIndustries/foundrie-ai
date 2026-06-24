import { readRepoFile, readRepoTree } from "./app-client";
import { db } from "@/lib/db";
import { DiagramStatus } from "@/lib/generated/prisma/client";
import { logEvent } from "@/lib/ai/log";

export interface ReverseArchitectureParams {
  projectId: string;
  installationId: number;
  owner: string;
  repo: string;
}

/**
 * Derives initial architecture (System Context, ERD, API Map, Component diagrams)
 * from a connected repository.
 */
export async function inferArchitectureFromRepo({
  projectId,
  installationId,
  owner,
  repo,
}: ReverseArchitectureParams) {
  try {
    // 1. Gather repository context (Manifests, README, CI)
    const manifests = await gatherManifests(installationId, owner, repo);
    const readme = await tryReadFile(installationId, owner, repo, "README.md");
    const ciConfig = await tryReadFile(
      installationId,
      owner,
      repo,
      ".github/workflows/ci.yml",
    );

    const gatheredContext = {
      manifests,
      readme: readme?.content,
      ciConfig: ciConfig?.content,
    };

    // 2. Queue AI Tasks to generate the 4 base diagrams.
    // In actual implementation, these would trigger the backend Trigger.dev tasks
    // passing the gatheredContext to the AI rotation engine.

    const diagramsToInfer = [
      {
        diagramTypeId: "system_context",
        category: "System Architecture",
        name: "System Context (INFERRED — verify before proceeding)",
        folderPath: "diagrams",
        fileName: "01_system_context.json",
      },
      {
        diagramTypeId: "c4_container",
        category: "System Architecture",
        name: "Container Diagram (INFERRED — verify before proceeding)",
        folderPath: "diagrams",
        fileName: "02_c4_container.json",
      },
      {
        diagramTypeId: "erd",
        category: "Data Layer",
        name: "Entity Relationship (INFERRED — verify before proceeding)",
        folderPath: "diagrams",
        fileName: "03_erd.json",
      },
      {
        diagramTypeId: "api_map",
        category: "API & Integration",
        name: "API Map (INFERRED — verify before proceeding)",
        folderPath: "diagrams",
        fileName: "04_api_map.json",
      },
    ];

    for (let i = 0; i < diagramsToInfer.length; i++) {
      const config = diagramsToInfer[i];
      await db.diagram.create({
        data: {
          projectId,
          diagramTypeId: config.diagramTypeId,
          category: config.category,
          name: config.name,
          folderPath: config.folderPath,
          fileName: config.fileName,
          orderInCategory: i,
          status: DiagramStatus.QUEUED,
          // Storing the context that AI should use for generation
          errorMessage: JSON.stringify({
            _internalContext: "Inference requested",
            repo: `${owner}/${repo}`,
          }),
        },
      });
    }

    logEvent("info", {
      event: "ai_outcome",
      task: "reverse_architecture",
      modelKey: "github",
      status: "ok",
      attempts: 1,
      durationMs: 0,
    });

    return { success: true, diagramsQueued: diagramsToInfer.length };
  } catch (error: any) {
    logEvent("error", {
      event: "ai_outcome",
      task: "reverse_architecture",
      modelKey: "github",
      status: "queued",
      attempts: 1,
      durationMs: 0,
    });
    throw error;
  }
}

async function tryReadFile(
  installationId: number,
  owner: string,
  repo: string,
  path: string,
) {
  try {
    return await readRepoFile(installationId, owner, repo, path);
  } catch {
    return null;
  }
}

async function gatherManifests(
  installationId: number,
  owner: string,
  repo: string,
) {
  const possibleManifests = [
    "package.json",
    "requirements.txt",
    "Cargo.toml",
    "go.mod",
    "composer.json",
    "Gemfile",
  ];

  const results: Record<string, string> = {};

  for (const manifest of possibleManifests) {
    const file = await tryReadFile(installationId, owner, repo, manifest);
    if (file) {
      results[manifest] = file.content;
    }
  }

  return results;
}
