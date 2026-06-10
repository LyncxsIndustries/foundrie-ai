import { db } from "@/lib/db";
import { DiagramStatus } from "@/lib/generated/prisma/client";
import { uploadDiagramPNG } from "@/lib/storage/diagram-blob";

interface SaveDiagramDataParams {
  diagramId: string;
  reactFlowData?: { nodes: unknown[]; edges: unknown[] };
  pngBuffer?: Buffer;
  status: DiagramStatus;
  errorMessage?: string;
}

export async function saveDiagramData({
  diagramId,
  reactFlowData,
  pngBuffer,
  status,
  errorMessage,
}: SaveDiagramDataParams): Promise<void> {
  await db.$transaction(async (tx) => {
    // Fetch current diagram to check prior status
    const diagram = await tx.diagram.findUnique({
      where: { id: diagramId },
      select: { status: true, version: true, projectId: true },
    });

    if (!diagram) {
      throw new Error(`Diagram ${diagramId} not found`);
    }

    // Upload PNG if provided
    let pngUrl: string | undefined;
    if (pngBuffer) {
      const result = await uploadDiagramPNG(pngBuffer, diagramId, diagram.version);
      pngUrl = result.url;
    }

    // Update diagram with explicit type casting for JSON fields
    const updateData: Record<string, unknown> = {
      status,
    };

    if (reactFlowData) {
      updateData.reactFlowData = reactFlowData;
    }
    if (pngUrl) {
      updateData.pngStorageUrl = pngUrl;
    }
    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    } else if (status === DiagramStatus.ERROR) {
      updateData.errorMessage = null;
    }
    if (status === DiagramStatus.DONE) {
      updateData.completedAt = new Date();
    }

    await tx.diagram.update({
      where: { id: diagramId },
      data: updateData,
    });

    // Increment completedDiagramCount only on first completion
    if (status === DiagramStatus.DONE && diagram.status !== DiagramStatus.DONE) {
      await tx.project.update({
        where: { id: diagram.projectId },
        data: { completedDiagramCount: { increment: 1 } },
      });
    }
  });
}

export async function getDiagramWithData(diagramId: string) {
  return db.diagram.findUnique({
    where: { id: diagramId },
    select: {
      id: true,
      projectId: true,
      diagramTypeId: true,
      category: true,
      name: true,
      status: true,
      version: true,
      reactFlowData: true,
      pngStorageUrl: true,
      errorMessage: true,
      completedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
