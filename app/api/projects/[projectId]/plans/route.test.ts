import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectMember } from "@/lib/auth/project-access";
import { ExecutionPlanStatus } from "@/lib/generated/prisma/client";

vi.mock("@/lib/db", () => ({
  db: {
    executionPlan: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/require-auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/auth/project-access", () => ({
  requireProjectMember: vi.fn(),
}));

describe("/api/projects/[projectId]/plans", () => {
  const projectId = "test-project-id";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue({ id: "user-id" } as any);
    vi.mocked(requireProjectMember).mockResolvedValue({ id: projectId } as any);
  });

  describe("GET", () => {
    it("returns plans for the project", async () => {
      const mockPlans = [{ id: "plan-1", status: ExecutionPlanStatus.PROPOSED }];
      vi.mocked(db.executionPlan.findMany).mockResolvedValue(mockPlans as any);

      const req = new NextRequest(`http://localhost/api/projects/${projectId}/plans`);
      const res = await GET(req, { params: Promise.resolve({ projectId }) });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual(mockPlans);
    });
  });

  describe("POST", () => {
    it("creates a new plan", async () => {
      const mockPlan = { id: "plan-1", status: ExecutionPlanStatus.PROPOSED };
      vi.mocked(db.executionPlan.create).mockResolvedValue(mockPlan as any);

      const req = new NextRequest(`http://localhost/api/projects/${projectId}/plans`, {
        method: "POST",
        body: JSON.stringify({ taskType: "test", content: "some content" }),
      });
      const res = await POST(req, { params: Promise.resolve({ projectId }) });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data).toEqual(mockPlan);
    });

    it("returns 400 on invalid input", async () => {
      const req = new NextRequest(`http://localhost/api/projects/${projectId}/plans`, {
        method: "POST",
        body: JSON.stringify({ taskType: "" }), // missing content and empty string
      });
      const res = await POST(req, { params: Promise.resolve({ projectId }) });

      expect(res.status).toBe(400);
    });
  });
});
