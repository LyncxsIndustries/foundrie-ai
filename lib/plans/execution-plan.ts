import { db } from "@/lib/db";
import { ExecutionPlanStatus } from "@/lib/generated/prisma/client";

export class PlanError extends Error {
  readonly status: number;
  constructor(message = "Execution plan requirement not met.", status = 400) {
    super(message);
    this.name = "PlanError";
    this.status = status;
  }
}

/**
 * Validates that an APPROVED execution plan exists for the given task type.
 * Throws PlanError if not found.
 */
export async function requireApprovedPlan(projectId: string, taskType: string) {
  const plan = await db.executionPlan.findFirst({
    where: {
      projectId,
      taskType,
      status: ExecutionPlanStatus.APPROVED,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!plan) {
    throw new PlanError(`An approved execution plan for ${taskType} is required before proceeding.`);
  }

  return plan;
}

export async function createPlan(projectId: string, taskType: string, content: string) {
  return db.executionPlan.create({
    data: {
      projectId,
      taskType,
      content,
      status: ExecutionPlanStatus.PROPOSED,
    },
  });
}

export async function approvePlan(planId: string, projectId: string) {
  return db.executionPlan.updateMany({
    where: { id: planId, projectId },
    data: {
      status: ExecutionPlanStatus.APPROVED,
      approvedAt: new Date(),
    },
  });
}

export async function rejectPlan(planId: string, projectId: string) {
  return db.executionPlan.updateMany({
    where: { id: planId, projectId },
    data: {
      status: ExecutionPlanStatus.REJECTED,
    },
  });
}

export async function requestRevision(planId: string, projectId: string, revisionNotes: string) {
  return db.executionPlan.updateMany({
    where: { id: planId, projectId },
    data: {
      status: ExecutionPlanStatus.REVISION_REQUESTED,
      revisionNotes,
    },
  });
}

export async function markExecuted(planId: string, projectId: string) {
  return db.executionPlan.updateMany({
    where: { id: planId, projectId },
    data: {
      status: ExecutionPlanStatus.EXECUTED,
      executedAt: new Date(),
    },
  });
}
