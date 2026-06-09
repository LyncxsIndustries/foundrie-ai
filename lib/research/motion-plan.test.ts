import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeMotionAsset } from "./motion-plan";
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

describe("analyzeMotionAsset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    });
  });

  it("throws error if asset not found", async () => {
    vi.mocked(db.researchAsset.findUnique).mockResolvedValue(null as never);
    await expect(analyzeMotionAsset("proj_1", "asset_1")).rejects.toThrow("Asset not found");
  });

  it("calls AI without media if asset is a ZIP", async () => {
    vi.mocked(db.researchAsset.findUnique).mockResolvedValue({
      id: "asset_1",
      projectId: "proj_1",
      mimeType: "application/zip",
      assetType: "FRAME_ZIP",
      fileName: "test.zip",
      fileSize: 1024,
      storageUrl: "https://blob/test.zip",
      metadata: {},
    } as never);

    vi.mocked(callAI).mockResolvedValue({
      status: "ok",
      text: "Motion plan result",
      model: "model",
      provider: "anthropic",
      attempts: 1,
    } as never);

    vi.mocked(db.researchDocument.create).mockResolvedValue({
      id: "doc_1",
    } as never);

    await analyzeMotionAsset("proj_1", "asset_1");

    expect(callAI).toHaveBeenCalledWith("motion_analysis", expect.objectContaining({
      media: undefined,
    }));
  });

  it("calls AI with media if asset is an image", async () => {
    vi.mocked(db.researchAsset.findUnique).mockResolvedValue({
      id: "asset_1",
      projectId: "proj_1",
      mimeType: "image/gif",
      assetType: "FRAME",
      fileName: "test.gif",
      fileSize: 1024,
      storageUrl: "https://blob/test.gif",
      metadata: {},
    } as never);

    vi.mocked(callAI).mockResolvedValue({
      status: "ok",
      text: "Motion plan result",
      model: "model",
      provider: "anthropic",
      attempts: 1,
    } as never);

    vi.mocked(db.researchDocument.create).mockResolvedValue({
      id: "doc_1",
    } as never);

    await analyzeMotionAsset("proj_1", "asset_1");

    expect(callAI).toHaveBeenCalledWith("motion_analysis", expect.objectContaining({
      media: expect.any(Array),
    }));
  });
});
