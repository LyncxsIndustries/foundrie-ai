import { describe, expect, it, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  applyScopeChange: vi.fn(),
  computeImpactAnalysis: vi.fn(),
  executionPlanCreate: vi.fn(),
  recordRejectedScopeChange: vi.fn(),
  requireAuth: vi.fn(),
  requireProjectOwner: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    executionPlan: {
      create: mocks.executionPlanCreate,
    },
  },
}));

vi.mock("@/lib/auth/require-auth", () => ({
  requireAuth: mocks.requireAuth,
  AuthError: class AuthError extends Error {
    readonly status = 401;

    constructor(message = "Authentication required.") {
      super(message);
      this.name = "AuthError";
    }
  },
}));

vi.mock("@/lib/auth/project-access", () => ({
  requireProjectOwner: mocks.requireProjectOwner,
  ProjectAuthError: class ProjectAuthError extends Error {
    readonly status: number;

    constructor(message = "Project not found.", status = 404) {
      super(message);
      this.name = "ProjectAuthError";
      this.status = status;
    }
  },
}));

vi.mock("@/lib/scope/impact-analysis", () => ({
  computeImpactAnalysis: mocks.computeImpactAnalysis,
  applyScopeChange: mocks.applyScopeChange,
  recordRejectedScopeChange: mocks.recordRejectedScopeChange,
}));

const projectId = "project-123";
const user = {
  id: "local-user-123",
  clerkId: "clerk-user-123",
  email: "owner@example.com",
  plan: "PRO",
  role: "USER",
};
const report = {
  changeType: "ADDITION",
  affectedCompletedFeatures: ["01-existing"],
  affectedInProgressFeatures: [],
  affectedPendingFeatures: ["02-pending"],
  newFeaturesNeeded: [{ title: "Referral Rewards", description: "Adds rewards." }],
  diagramsNeedingUpdates: ["diagram-1"],
  timelineDeltaDays: 3,
  costDeltaUsd: 1200,
  impactSummary: "Adds a referral program.",
};

describe("POST /api/projects/[projectId]/scope-changes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuth.mockResolvedValue(user);
    mocks.requireProjectOwner.mockResolvedValue({ id: projectId });
    mocks.executionPlanCreate.mockResolvedValue({ id: "plan-1" });
  });

  it("computes impact analysis with the authenticated local user's plan", async () => {
    mocks.computeImpactAnalysis.mockResolvedValue(report);

    const response = await POST(jsonRequest({ action: "COMPUTE", changeDescription: "Add referrals" }), {
      params: Promise.resolve({ projectId }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(report);
    expect(mocks.requireProjectOwner).toHaveBeenCalledWith(projectId, user.id);
    expect(mocks.computeImpactAnalysis).toHaveBeenCalledWith(
      projectId,
      "Add referrals",
      "PRO",
    );
  });

  it("approves and applies a valid scope-change report", async () => {
    const response = await POST(
      jsonRequest({
        action: "APPROVE",
        changeDescription: "Add referrals",
        report,
      }),
      { params: Promise.resolve({ projectId }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, executionPlanId: "plan-1" });
    expect(mocks.executionPlanCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId,
        taskType: "SCOPE_CHANGE",
        status: "APPROVED",
        content: JSON.stringify(report),
        revisionNotes: "Add referrals",
        approvedAt: expect.any(Date),
      }),
    });
    expect(mocks.applyScopeChange).toHaveBeenCalledWith(
      projectId,
      "plan-1",
      user.id,
    );
  });

  it("records a rejected scope-change ADR", async () => {
    const response = await POST(
      jsonRequest({
        action: "REJECT",
        changeDescription: "Add referrals",
        report,
      }),
      { params: Promise.resolve({ projectId }) },
    );

    expect(response.status).toBe(200);
    expect(mocks.executionPlanCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId,
        taskType: "SCOPE_CHANGE",
        status: "REJECTED",
        content: JSON.stringify(report),
        revisionNotes: "Add referrals",
      }),
    });
    expect(mocks.recordRejectedScopeChange).toHaveBeenCalledWith(
      projectId,
      "plan-1",
      user.id,
    );
  });

  it("rejects malformed reports before creating an execution plan", async () => {
    const response = await POST(
      jsonRequest({
        action: "APPROVE",
        changeDescription: "Add referrals",
        report: { impactSummary: "missing required fields" },
      }),
      { params: Promise.resolve({ projectId }) },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("report must be a valid impact analysis report");
    expect(mocks.executionPlanCreate).not.toHaveBeenCalled();
  });
});

function jsonRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/projects/${projectId}/scope-changes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
