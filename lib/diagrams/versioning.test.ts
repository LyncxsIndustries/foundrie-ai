import { describe, expect, it, vi, beforeEach } from "vitest";
import { snapshotDiagramVersion, listDiagramVersions, restoreDiagramVersion, VersioningError } from "./versioning";
import { db } from "@/lib/db";

vi.mock("@/lib/db", () => {
  const mockTx = {
    diagram: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    diagramVersion: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    featureSpec: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  };
  return {
    db: {
      $transaction: vi.fn((fn: any) => fn(mockTx)),
      diagram: {
        findUnique: vi.fn(),
      },
      diagramVersion: {
        findMany: vi.fn(),
      },
      _tx: mockTx,
    },
  };
});

// Access the transaction mock helpers
const mockDb = db as any;
const mockTx = mockDb._tx;

describe("versioning", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("snapshotDiagramVersion", () => {
    it("creates a version record from the current diagram state", async () => {
      const diagram = {
        id: "d1",
        projectId: "p1",
        version: 2,
        reactFlowData: { nodes: [] },
        pngStorageUrl: "https://blob/v2.png",
        errorMessage: null,
      };
      mockTx.diagram.findUnique.mockResolvedValue(diagram);
      const created = { id: "ver1", diagramId: "d1", version: 2 };
      mockTx.diagramVersion.create.mockResolvedValue(created);

      const result = await snapshotDiagramVersion("p1", "d1");

      expect(result).toEqual(created);
      expect(mockTx.diagramVersion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          diagramId: "d1",
          version: 2,
        }),
      });
    });

    it("throws when diagram is not found", async () => {
      mockTx.diagram.findUnique.mockResolvedValue(null);
      await expect(snapshotDiagramVersion("p1", "missing")).rejects.toThrow(VersioningError);
    });

    it("throws when diagram belongs to another project", async () => {
      mockTx.diagram.findUnique.mockResolvedValue({ id: "d1", projectId: "other" });
      await expect(snapshotDiagramVersion("p1", "d1")).rejects.toThrow(VersioningError);
    });
  });

  describe("listDiagramVersions", () => {
    it("returns versions without reactFlowData", async () => {
      mockDb.diagram.findUnique.mockResolvedValue({ id: "d1", projectId: "p1" });
      
      const versions = [
        { id: "v1", diagramId: "d1", version: 1, pngStorageUrl: null, errorMessage: null, createdAt: new Date() },
      ];
      vi.mocked(db.diagramVersion.findMany).mockResolvedValue(versions as any);

      const result = await listDiagramVersions("p1", "d1");

      expect(result).toEqual(versions);
      const findManyCall = vi.mocked(db.diagramVersion.findMany).mock.calls[0][0];
      expect(findManyCall?.where).toEqual({ diagramId: "d1" });
      // Ensure reactFlowData is not selected
      expect(findManyCall?.select).toBeDefined();
      expect(findManyCall?.select).not.toHaveProperty("reactFlowData");
    });
    
    it("throws when diagram belongs to another project", async () => {
      mockDb.diagram.findUnique.mockResolvedValue({ id: "d1", projectId: "other" });
      await expect(listDiagramVersions("p1", "d1")).rejects.toThrow(VersioningError);
    });
  });

  describe("restoreDiagramVersion", () => {
    it("restores a version and marks specs for re-review", async () => {
      const diagram = {
        id: "d1",
        projectId: "p1",
        name: "System Context",
        version: 3,
        reactFlowData: { nodes: [{ id: "current" }] },
        pngStorageUrl: "https://blob/v3.png",
        errorMessage: null,
      };
      const versionToRestore = {
        id: "ver1",
        diagramId: "d1",
        version: 1,
        reactFlowData: { nodes: [{ id: "old" }] },
        pngStorageUrl: "https://blob/v1.png",
        errorMessage: null,
      };
      const specs = [
        { id: "s1", content: "Feature 1 spec content" },
      ];

      mockTx.diagram.findUnique.mockResolvedValue(diagram);
      mockTx.diagramVersion.findUnique.mockResolvedValue(versionToRestore);
      mockTx.diagramVersion.create.mockResolvedValue({});
      mockTx.diagram.update.mockResolvedValue({ ...diagram, version: 4 });
      mockTx.featureSpec.findMany.mockResolvedValue(specs);
      mockTx.featureSpec.update.mockResolvedValue({});

      const result = await restoreDiagramVersion("p1", "d1", "ver1");

      expect(result.version).toBe(4);
      expect(mockTx.featureSpec.update).toHaveBeenCalledWith({
        where: { id: "s1" },
        data: { content: expect.stringContaining("requires re-review") },
      });
    });

    it("throws when diagram is not found", async () => {
      mockTx.diagram.findUnique.mockResolvedValue(null);
      await expect(restoreDiagramVersion("p1", "missing", "v1")).rejects.toThrow(VersioningError);
    });

    it("throws when version is not found", async () => {
      mockTx.diagram.findUnique.mockResolvedValue({ id: "d1", projectId: "p1" });
      mockTx.diagramVersion.findUnique.mockResolvedValue(null);
      await expect(restoreDiagramVersion("p1", "d1", "missing")).rejects.toThrow(VersioningError);
    });
    
    it("throws when diagram belongs to another project", async () => {
      mockTx.diagram.findUnique.mockResolvedValue({ id: "d1", projectId: "other" });
      await expect(restoreDiagramVersion("p1", "d1", "v1")).rejects.toThrow(VersioningError);
    });
  });
});
