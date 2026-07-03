import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { requireAuth, AuthError } from "@/lib/auth/require-auth";
import { requireProjectMember, ProjectAuthError } from "@/lib/projects/auth";
import { db } from "@/lib/db";
import { analyzeVisualAsset } from "@/lib/research/visual-analysis";
import { analyzeMotionAsset } from "@/lib/research/motion-plan";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/require-auth", () => ({
  requireAuth: vi.fn(),
  AuthError: class MockAuthError extends Error {},
}));

vi.mock("@/lib/projects/auth", () => ({
  requireProjectMember: vi.fn(),
  ProjectAuthError: class MockProjectAuthError extends Error {},
}));

vi.mock("@/lib/db", () => ({
  db: {
    researchAsset: { 
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/research/visual-analysis", () => ({
  analyzeVisualAsset: vi.fn(),
}));

vi.mock("@/lib/research/motion-plan", () => ({
  analyzeMotionAsset: vi.fn(),
}));

describe("POST /api/research/[projectId]/analyze", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 if assetId is missing", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: "user_1", plan: "FREE" } as never);
    vi.mocked(requireProjectMember).mockResolvedValue({ id: "proj_1" } as never);

    const req = new NextRequest("http://localhost/api/research/proj_1/analyze", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(req, { params: Promise.resolve({ projectId: "proj_1" }) });
    expect(res.status).toBe(400);
  });

  it("routes to motion analysis for FRAME_ZIP", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: "user_1", plan: "FREE" } as never);
    vi.mocked(requireProjectMember).mockResolvedValue({ id: "proj_1" } as never);

    vi.mocked(db.researchAsset.findMany).mockResolvedValue([{
      id: "asset_1",
      projectId: "proj_1",
      assetType: "FRAME_ZIP",
    }] as never);
    
    vi.mocked(db.researchAsset.update).mockResolvedValue({} as never);

    vi.mocked(analyzeMotionAsset).mockResolvedValue({ id: "doc_1", content: "Motion analysis result" } as never);

    const req = new NextRequest("http://localhost/api/research/proj_1/analyze", {
      method: "POST",
      body: JSON.stringify({ assetId: "asset_1" }),
    });

    const res = await POST(req, { params: Promise.resolve({ projectId: "proj_1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.doc.fileId).toBe("asset_1");
    expect(body.doc.status).toBe("success");
    expect(analyzeMotionAsset).toHaveBeenCalledWith("proj_1", "asset_1", "FREE");
  });

  it("routes to visual analysis for IMAGE_ASSET", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: "user_1", plan: "FREE" } as never);
    vi.mocked(requireProjectMember).mockResolvedValue({ id: "proj_1" } as never);

    vi.mocked(db.researchAsset.findMany).mockResolvedValue([{
      id: "asset_1",
      projectId: "proj_1",
      assetType: "IMAGE_ASSET",
    }] as never);
    
    vi.mocked(db.researchAsset.update).mockResolvedValue({} as never);

    vi.mocked(analyzeVisualAsset).mockResolvedValue({ id: "doc_1", content: "Visual analysis result" } as never);

    const req = new NextRequest("http://localhost/api/research/proj_1/analyze", {
      method: "POST",
      body: JSON.stringify({ assetId: "asset_1" }),
    });

    const res = await POST(req, { params: Promise.resolve({ projectId: "proj_1" }) });
    expect(res.status).toBe(200);
    expect(analyzeVisualAsset).toHaveBeenCalledWith("proj_1", "asset_1", "FREE");
  });
});
