import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeVisualAsset } from "./visual-analysis";
import { db } from "@/lib/db";
import { callAI } from "@/lib/ai";

vi.mock("@/lib/db", () => ({
  db: {
    researchAsset: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    researchDocument: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/ai", () => ({
  callAI: vi.fn(),
}));

describe("analyzeVisualAsset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    });
  });

  it("throws error if asset not found", async () => {
    vi.mocked(db.researchAsset.findUnique).mockResolvedValue(null as never);
    await expect(analyzeVisualAsset("proj_1", "asset_1")).rejects.toThrow("Asset not found");
  });

  it("throws error if asset is not an image", async () => {
    vi.mocked(db.researchAsset.findUnique).mockResolvedValue({
      id: "asset_1",
      mimeType: "application/pdf",
    } as never);
    await expect(analyzeVisualAsset("proj_1", "asset_1")).rejects.toThrow("Asset is not an image");
  });

  it("calls AI and creates research document on success", async () => {
    vi.mocked(db.researchAsset.findUnique).mockResolvedValue({
      id: "asset_1",
      projectId: "proj_1",
      mimeType: "image/png",
      fileName: "test.png",
      fileSize: 1024,
      storageUrl: "https://blob/test.png",
      metadata: {},
    } as never);

    vi.mocked(callAI).mockResolvedValue({
      status: "ok",
      text: "Visual analysis result",
      model: "model",
      provider: "anthropic",
      tokensUsed: 10,
      attempts: 1,
    } as never);

    vi.mocked(db.researchDocument.create).mockResolvedValue({
      id: "doc_1",
      projectId: "proj_1",
      sourceType: "AI_ANALYSIS",
    } as never);

    const doc = await analyzeVisualAsset("proj_1", "asset_1");

    expect(callAI).toHaveBeenCalledWith("visual_asset_analysis", expect.any(Object));
    expect(db.researchDocument.create).toHaveBeenCalled();
    expect(db.researchAsset.update).toHaveBeenCalledWith({
      where: { id: "asset_1" },
      data: {
        metadata: {
          aiSummaryId: "doc_1",
          aiSummaryPreview: expect.any(String),
        },
      },
    });
    expect(doc.id).toBe("doc_1");
  });
});
