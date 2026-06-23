import { describe, expect, it, vi, beforeEach } from "vitest";
import { PATCH } from "./route";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectMember } from "@/lib/auth/project-access";
import { ExecutionPlanStatus } from "@/lib/generated/prisma/client";

vi.mock("@/lib/db", () => ({
  db: {
    executionPlan: {
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/require-auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/auth/project-access", () => ({
  requireProjectMember: vi.fn(),
}));

describe("PATCH /api/projects/[projectId]/plans/[planId]", () => {
  const projectId = "test-project-id";
  const planId = "test-plan-id";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue({ id: "user-id" } as any);
    vi.mocked(requireProjectMember).mockResolvedValue({ id: projectId } as any);
  });

  function createRequest(body: any) {
    return new NextRequest(`http://localhost/api/projects/${projectId}/plans/${planId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  it("updates plan status to APPROVED", async () => {
    vi.mocked(db.executionPlan.updateMany).mockResolvedValue({ count: 1 });

    const req = createRequest({ action: "approve" });
    const res = await PATCH(req, { params: Promise.resolve({ projectId, planId }) });

    expect(res.status).toBe(200);
    expect(db.executionPlan.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: planId, projectId },
        data: expect.objectContaining({ status: ExecutionPlanStatus.APPROVED }),
      })
    );
  });

  it("requires revisionNotes for revise action", async () => {
    const req = createRequest({ action: "revise" });
    const res = await PATCH(req, { params: Promise.resolve({ projectId, planId }) });

    expect(res.status).toBe(400);
  });

  it("returns 404 if plan not found (count === 0)", async () => {
    vi.mocked(db.executionPlan.updateMany).mockResolvedValue({ count: 0 });

    const req = createRequest({ action: "approve" });
    const res = await PATCH(req, { params: Promise.resolve({ projectId, planId }) });

    expect(res.status).toBe(404);
  });
});
