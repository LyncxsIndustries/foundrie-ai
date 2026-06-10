import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveDiagramData, getDiagramWithData } from "./storage";
import { DiagramStatus } from "@/lib/generated/prisma/client";

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: vi.fn(),
    diagram: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/storage/diagram-blob", () => ({
  uploadDiagramPNG: vi.fn().mockResolvedValue({
    url: "https://blob.vercel-storage.com/test.png",
  }),
}));

describe("diagram storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("saveDiagramData", () => {
    it("updates diagram with React Flow data", async () => {
      const { db } = await import("@/lib/db");
      const mockTx = {
        diagram: {
          findUnique: vi.fn().mockResolvedValue({
            id: "test-id",
            status: DiagramStatus.GENERATING,
            version: 1,
            projectId: "proj-1",
          }),
          update: vi.fn(),
        },
        project: {
          update: vi.fn(),
        },
      };
      vi.mocked(db.$transaction).mockImplementation(
        async (cb) => await cb(mockTx as never),
      );

      const flowData = { nodes: [{ id: "1" }], edges: [] };
      await saveDiagramData({
        diagramId: "test-id",
        reactFlowData: flowData,
        status: DiagramStatus.RENDERING,
      });

      expect(mockTx.diagram.update).toHaveBeenCalledWith({
        where: { id: "test-id" },
        data: expect.objectContaining({
          reactFlowData: flowData,
          status: DiagramStatus.RENDERING,
        }),
      });
    });

    it("increments completedDiagramCount on first DONE transition", async () => {
      const { db } = await import("@/lib/db");
      const mockTx = {
        diagram: {
          findUnique: vi.fn().mockResolvedValue({
            id: "test-id",
            status: DiagramStatus.RENDERING,
            version: 1,
            projectId: "proj-1",
          }),
          update: vi.fn(),
        },
        project: {
          update: vi.fn(),
        },
      };
      vi.mocked(db.$transaction).mockImplementation(
        async (cb) => await cb(mockTx as never),
      );

      await saveDiagramData({
        diagramId: "test-id",
        status: DiagramStatus.DONE,
      });

      expect(mockTx.project.update).toHaveBeenCalledWith({
        where: { id: "proj-1" },
        data: { completedDiagramCount: { increment: 1 } },
      });
    });

    it("does not increment counter if already DONE", async () => {
      const { db } = await import("@/lib/db");
      const mockTx = {
        diagram: {
          findUnique: vi.fn().mockResolvedValue({
            id: "test-id",
            status: DiagramStatus.DONE,
            version: 1,
            projectId: "proj-1",
          }),
          update: vi.fn(),
        },
        project: {
          update: vi.fn(),
        },
      };
      vi.mocked(db.$transaction).mockImplementation(
        async (cb) => await cb(mockTx as never),
      );

      await saveDiagramData({
        diagramId: "test-id",
        status: DiagramStatus.DONE,
      });

      expect(mockTx.project.update).not.toHaveBeenCalled();
    });

    it("records error message when status is ERROR", async () => {
      const { db } = await import("@/lib/db");
      const mockTx = {
        diagram: {
          findUnique: vi.fn().mockResolvedValue({
            id: "test-id",
            status: DiagramStatus.GENERATING,
            version: 1,
            projectId: "proj-1",
          }),
          update: vi.fn(),
        },
        project: {
          update: vi.fn(),
        },
      };
      vi.mocked(db.$transaction).mockImplementation(
        async (cb) => await cb(mockTx as never),
      );

      await saveDiagramData({
        diagramId: "test-id",
        status: DiagramStatus.ERROR,
        errorMessage: "Generation failed",
      });

      expect(mockTx.diagram.update).toHaveBeenCalledWith({
        where: { id: "test-id" },
        data: expect.objectContaining({
          status: DiagramStatus.ERROR,
          errorMessage: "Generation failed",
        }),
      });
    });

    it("uploads PNG and stores URL when buffer provided", async () => {
      const { db } = await import("@/lib/db");
      const { uploadDiagramPNG } = await import("@/lib/storage/diagram-blob");
      const mockTx = {
        diagram: {
          findUnique: vi.fn().mockResolvedValue({
            id: "test-id",
            status: DiagramStatus.RENDERING,
            version: 1,
            projectId: "proj-1",
          }),
          update: vi.fn(),
        },
        project: {
          update: vi.fn(),
        },
      };
      vi.mocked(db.$transaction).mockImplementation(
        async (cb) => await cb(mockTx as never),
      );

      const buffer = Buffer.from("fake-png");
      await saveDiagramData({
        diagramId: "test-id",
        pngBuffer: buffer,
        status: DiagramStatus.DONE,
      });

      expect(uploadDiagramPNG).toHaveBeenCalledWith(buffer, "test-id", 1);
      expect(mockTx.diagram.update).toHaveBeenCalledWith({
        where: { id: "test-id" },
        data: expect.objectContaining({
          pngStorageUrl: "https://blob.vercel-storage.com/test.png",
        }),
      });
    });
  });

  describe("getDiagramWithData", () => {
    it("retrieves diagram with full data", async () => {
      const { db } = await import("@/lib/db");
      vi.mocked(db.diagram.findUnique).mockResolvedValue({
        id: "test-id",
        projectId: "proj-1",
        diagramTypeId: "system-context",
        category: "structural",
        name: "System Context",
        status: DiagramStatus.DONE,
        version: 1,
        reactFlowData: { nodes: [], edges: [] },
        pngStorageUrl: "https://blob.vercel-storage.com/test.png",
        errorMessage: null,
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const result = await getDiagramWithData("test-id");

      expect(db.diagram.findUnique).toHaveBeenCalledWith({
        where: { id: "test-id" },
        select: expect.objectContaining({
          id: true,
          reactFlowData: true,
          pngStorageUrl: true,
        }),
      });
      expect(result?.id).toBe("test-id");
    });
  });
});
