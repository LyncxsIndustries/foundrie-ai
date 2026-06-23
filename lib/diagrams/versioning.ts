import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";

export class VersioningError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VersioningError";
  }
}

export async function snapshotDiagramVersion(projectId: string, diagramId: string) {
  return await db.$transaction(async (tx) => {
    const diagram = await tx.diagram.findUnique({
      where: { id: diagramId },
    });

    if (!diagram || diagram.projectId !== projectId) {
      throw new VersioningError("Diagram not found");
    }

    const version = await tx.diagramVersion.create({
      data: {
        diagramId: diagram.id,
        version: diagram.version,
        reactFlowData: diagram.reactFlowData ?? Prisma.DbNull,
        pngStorageUrl: diagram.pngStorageUrl,
        errorMessage: diagram.errorMessage,
      },
    });

    return version;
  });
}

export async function listDiagramVersions(projectId: string, diagramId: string) {
  const diagram = await db.diagram.findUnique({
    where: { id: diagramId },
  });

  if (!diagram || diagram.projectId !== projectId) {
    throw new VersioningError("Diagram not found");
  }

  return await db.diagramVersion.findMany({
    where: { diagramId },
    select: {
      id: true,
      diagramId: true,
      version: true,
      pngStorageUrl: true,
      errorMessage: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function restoreDiagramVersion(projectId: string, diagramId: string, versionId: string) {
  return await db.$transaction(async (tx) => {
    const diagram = await tx.diagram.findUnique({
      where: { id: diagramId },
    });

    if (!diagram || diagram.projectId !== projectId) {
      throw new VersioningError("Diagram not found");
    }

    const versionToRestore = await tx.diagramVersion.findUnique({
      where: { id: versionId },
    });

    if (!versionToRestore) throw new VersioningError("Version not found");
    if (versionToRestore.diagramId !== diagramId) {
      throw new VersioningError("Version does not belong to this diagram");
    }

    // Snapshot the current state before overwriting
    await tx.diagramVersion.create({
      data: {
        diagramId: diagram.id,
        version: diagram.version,
        reactFlowData: diagram.reactFlowData ?? Prisma.DbNull,
        pngStorageUrl: diagram.pngStorageUrl,
        errorMessage: diagram.errorMessage,
      },
    });

    // Overwrite the diagram with the restored version's data, bump version
    const updatedDiagram = await tx.diagram.update({
      where: { id: diagramId },
      data: {
        version: diagram.version + 1,
        reactFlowData: versionToRestore.reactFlowData ?? Prisma.DbNull,
        pngStorageUrl: versionToRestore.pngStorageUrl,
        errorMessage: versionToRestore.errorMessage,
      },
    });

    // Mark dependent feature specs for re-review
    const specs = await tx.featureSpec.findMany({
      where: { projectId: diagram.projectId },
    });

    for (const spec of specs) {
      const reviewNote = `\n\n> [!WARNING]\n> Architecture diagram "${diagram.name}" was rolled back to version ${versionToRestore.version}. This spec requires re-review.`;
      if (!spec.content.includes("This spec requires re-review")) {
        await tx.featureSpec.update({
          where: { id: spec.id },
          data: { content: spec.content + reviewNote },
        });
      }
    }

    return updatedDiagram;
  });
}
