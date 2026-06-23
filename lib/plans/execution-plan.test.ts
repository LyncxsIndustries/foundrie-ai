import { describe, expect, it, vi, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { ExecutionPlanStatus } from "@/lib/generated/prisma/client";
import { requireApprovedPlan, createPlan, approvePlan, rejectPlan, requestRevision, markExecuted, PlanError } from "./execution-plan";

vi.mock("@/lib/db", () => ({
  db: {
    executionPlan: {
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

describe("execution-plan core logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requireApprovedPlan", () => {
    it("throws PlanError if no approved plan exists", async () => {
      vi.mocked(db.executionPlan.findFirst).mockResolvedValue(null);
      await expect(requireApprovedPlan("project-1", "generate-architecture")).rejects.toThrow(PlanError);
    });

    it("returns plan if approved plan exists", async () => {
      const mockPlan = { id: "plan-1", status: ExecutionPlanStatus.APPROVED };
      vi.mocked(db.executionPlan.findFirst).mockResolvedValue(mockPlan as any);
      const result = await requireApprovedPlan("project-1", "generate-architecture");
      expect(result).toBe(mockPlan);
    });
  });

  describe("state transitions", () => {
    it("createPlan creates a PROPOSED plan", async () => {
      await createPlan("project-1", "task-type", "content");
      expect(db.executionPlan.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId: "project-1",
            taskType: "task-type",
            content: "content",
            status: ExecutionPlanStatus.PROPOSED,
          })
        })
      );
    });

    it("approvePlan updates status to APPROVED", async () => {
      await approvePlan("plan-1", "project-1");
      expect(db.executionPlan.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "plan-1", projectId: "project-1" },
          data: expect.objectContaining({ status: ExecutionPlanStatus.APPROVED }),
        })
      );
    });

    it("rejectPlan updates status to REJECTED", async () => {
      await rejectPlan("plan-1", "project-1");
      expect(db.executionPlan.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "plan-1", projectId: "project-1" },
          data: expect.objectContaining({ status: ExecutionPlanStatus.REJECTED }),
        })
      );
    });

    it("requestRevision updates status to REVISION_REQUESTED", async () => {
      await requestRevision("plan-1", "project-1", "please fix X");
      expect(db.executionPlan.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "plan-1", projectId: "project-1" },
          data: expect.objectContaining({
            status: ExecutionPlanStatus.REVISION_REQUESTED,
            revisionNotes: "please fix X"
          }),
        })
      );
    });

    it("markExecuted updates status to EXECUTED", async () => {
      await markExecuted("plan-1", "project-1");
      expect(db.executionPlan.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "plan-1", projectId: "project-1" },
          data: expect.objectContaining({ status: ExecutionPlanStatus.EXECUTED }),
        })
      );
    });
  });
});
