import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeBulkOperation, verifyProjectAccess } from "@/lib/media/bulk-operations";
import { db } from "@/lib/db";

// Mock db
vi.mock("@/lib/db", () => ({
  db: {
    researchAsset: {
      updateMany: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback({
      researchAsset: {
        update: vi.fn(),
      },
    })),
    project: {
      findFirst: vi.fn(),
    },
  },
}));

describe("Bulk Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("executeBulkOperation", () => {
    it("updates category for multiple files", async () => {
      vi.mocked(db.researchAsset.updateMany).mockResolvedValue({ count: 3 });

      const result = await executeBulkOperation({
        projectId: "proj1",
        fileIds: ["file1", "file2", "file3"],
        userId: "user1",
        operation: "update-category",
        data: { category: "wireframes" },
      });

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(3);
      expect(db.researchAsset.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ["file1", "file2", "file3"] },
          projectId: "proj1",
        },
        data: {
          category: "wireframes",
        },
      });
    });

    it("adds tags to multiple files", async () => {
      const mockAssets = [
        { id: "file1", tags: ["existing"] },
        { id: "file2", tags: [] },
      ];

      vi.mocked(db.researchAsset.findMany).mockResolvedValue(mockAssets as any);

      const result = await executeBulkOperation({
        projectId: "proj1",
        fileIds: ["file1", "file2"],
        userId: "user1",
        operation: "add-tags",
        data: { tags: ["new-tag", "another-tag"] },
      });

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(2);
      expect(db.$transaction).toHaveBeenCalled();
    });

    it("deletes multiple files", async () => {
      vi.mocked(db.researchAsset.deleteMany).mockResolvedValue({ count: 2 });

      const result = await executeBulkOperation({
        projectId: "proj1",
        fileIds: ["file1", "file2"],
        userId: "user1",
        operation: "delete",
      });

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(2);
      expect(db.researchAsset.deleteMany).toHaveBeenCalledWith({
        where: {
          id: { in: ["file1", "file2"] },
          projectId: "proj1",
        },
      });
    });

    it("handles invalid category", async () => {
      const result = await executeBulkOperation({
        projectId: "proj1",
        fileIds: ["file1"],
        userId: "user1",
        operation: "update-category",
        data: { category: "invalid-category" as any },
      });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors?.[0].error).toContain("Invalid category");
    });
  });

  describe("verifyProjectAccess", () => {
    it("returns true for valid access", async () => {
      vi.mocked(db.project.findFirst).mockResolvedValue({ id: "proj1" } as any);

      const hasAccess = await verifyProjectAccess("proj1", "user1");

      expect(hasAccess).toBe(true);
      expect(db.project.findFirst).toHaveBeenCalledWith({
        where: {
          id: "proj1",
          userId: "user1",
        },
        select: { id: true },
      });
    });

    it("returns false for invalid access", async () => {
      vi.mocked(db.project.findFirst).mockResolvedValue(null);

      const hasAccess = await verifyProjectAccess("proj1", "user2");

      expect(hasAccess).toBe(false);
    });
  });
});
