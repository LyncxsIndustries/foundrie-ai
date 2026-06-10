import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadDiagramPNG, deleteDiagramPNG } from "./diagram-blob";

vi.mock("@vercel/blob", () => ({
  put: vi.fn(),
  del: vi.fn(),
}));

describe("diagram-blob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("uploadDiagramPNG", () => {
    it("uploads PNG with correct path and returns URL", async () => {
      const { put } = await import("@vercel/blob");
      vi.mocked(put).mockResolvedValue({
        url: "https://blob.vercel-storage.com/diagrams/test-id/v1.png",
      } as never);

      const buffer = Buffer.from("fake-png");
      const result = await uploadDiagramPNG(buffer, "test-id", 1);

      expect(put).toHaveBeenCalledWith("diagrams/test-id/v1.png", buffer, {
        access: "public",
        contentType: "image/png",
      });
      expect(result.url).toBe(
        "https://blob.vercel-storage.com/diagrams/test-id/v1.png",
      );
    });
  });

  describe("deleteDiagramPNG", () => {
    it("deletes PNG by URL", async () => {
      const { del } = await import("@vercel/blob");
      vi.mocked(del).mockResolvedValue(undefined as never);

      await deleteDiagramPNG("https://blob.vercel-storage.com/test.png");

      expect(del).toHaveBeenCalledWith("https://blob.vercel-storage.com/test.png");
    });
  });
});
