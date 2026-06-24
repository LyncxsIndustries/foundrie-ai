import { describe, expect, it, beforeEach, vi } from "vitest";
import { callAI } from "@/lib/ai";
import { db } from "@/lib/db";
import {
  applyScopeChange,
  computeImpactAnalysis,
  type ImpactAnalysisReport,
} from "./impact-analysis";

const mocks = vi.hoisted(() => ({
  callAI: vi.fn(),
  contextFileFindMany: vi.fn(),
  contextFileFindUnique: vi.fn(),
  contextFileUpdate: vi.fn(),
  diagramFindMany: vi.fn(),
  diagramUpdate: vi.fn(),
  diagramVersionCreate: vi.fn(),
  executionPlanFindUnique: vi.fn(),
  executionPlanUpdate: vi.fn(),
  featureSpecCreate: vi.fn(),
  featureSpecFindMany: vi.fn(),
  featureSpecUpdate: vi.fn(),
  projectFindUnique: vi.fn(),
  projectUpdate: vi.fn(),
  researchDocumentCreate: vi.fn(),
  researchDocumentFindFirst: vi.fn(),
  researchDocumentUpdate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/ai", () => ({
  callAI: mocks.callAI,
}));

vi.mock("@/lib/db", () => ({
  db: {
    project: {
      findUnique: mocks.projectFindUnique,
    },
    featureSpec: {
      findMany: mocks.featureSpecFindMany,
    },
    diagram: {
      findMany: mocks.diagramFindMany,
    },
    contextFile: {
      findMany: mocks.contextFileFindMany,
    },
    executionPlan: {
      findUnique: mocks.executionPlanFindUnique,
    },
    $transaction: mocks.transaction,
  },
}));

const report: ImpactAnalysisReport = {
  changeType: "ADDITION",
  affectedCompletedFeatures: ["01-existing"],
  affectedInProgressFeatures: [],
  affectedPendingFeatures: ["02-pending"],
  newFeaturesNeeded: [
    { title: "Referral Rewards", description: "Adds referral rewards." },
  ],
  diagramsNeedingUpdates: ["diagram-1"],
  timelineDeltaDays: 3,
  costDeltaUsd: 1200,
  impactSummary: "Adds referral rewards and updates user flows.",
};

describe("computeImpactAnalysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the current callAI systemPrompt/userPrompt contract", async () => {
    mocks.projectFindUnique.mockResolvedValue({ id: "project-1", name: "Acme" });
    mocks.featureSpecFindMany.mockResolvedValue([
      { slug: "01-existing" },
      { slug: "02-pending" },
    ]);
    mocks.diagramFindMany.mockResolvedValue([{ id: "diagram-1", name: "System" }]);
    mocks.contextFileFindMany.mockResolvedValue([
      { fileType: "PROGRESS_TRACKER", content: "Feature 01 DONE" },
    ]);
    mocks.callAI.mockResolvedValue({
      status: "ok",
      text: JSON.stringify(report),
    });

    const result = await computeImpactAnalysis(
      "project-1",
      "Add referrals",
      "PRO",
    );

    expect(result).toEqual(report);
    expect(callAI).toHaveBeenCalledWith(
      "scope_change_impact_analysis",
      expect.objectContaining({
        systemPrompt: expect.any(String),
        userPrompt: expect.stringContaining("Add referrals"),
        plan: "PRO",
      }),
    );
    expect(callAI).not.toHaveBeenCalledWith(
      "scope_change_impact_analysis",
      expect.objectContaining({
        system: expect.any(String),
        prompt: expect.any(String),
      }),
    );
  });
});

describe("applyScopeChange", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        contextFile: {
          findUnique: mocks.contextFileFindUnique,
          update: mocks.contextFileUpdate,
        },
        diagram: {
          findMany: mocks.diagramFindMany,
          update: mocks.diagramUpdate,
        },
        diagramVersion: {
          create: mocks.diagramVersionCreate,
        },
        executionPlan: {
          update: mocks.executionPlanUpdate,
        },
        featureSpec: {
          create: mocks.featureSpecCreate,
          findMany: mocks.featureSpecFindMany,
          update: mocks.featureSpecUpdate,
        },
        project: {
          update: mocks.projectUpdate,
        },
        researchDocument: {
          create: mocks.researchDocumentCreate,
          findFirst: mocks.researchDocumentFindFirst,
          update: mocks.researchDocumentUpdate,
        },
      }),
    );
  });

  it("applies approved scope changes to diagrams, specs, tracker, changelog, and ADRs", async () => {
    mocks.executionPlanFindUnique.mockResolvedValue({
      id: "plan-1",
      projectId: "project-1",
      taskType: "SCOPE_CHANGE",
      status: "APPROVED",
      content: JSON.stringify(report),
      revisionNotes: "Add referrals",
    });
    mocks.diagramFindMany.mockResolvedValue([
      {
        id: "diagram-1",
        name: "System Context",
        version: 2,
        status: "DONE",
        reactFlowData: { nodes: [] },
        pngStorageUrl: "blob://diagram.png",
        errorMessage: null,
      },
    ]);
    mocks.featureSpecFindMany.mockResolvedValue([
      {
        id: "spec-1",
        projectId: "project-1",
        order: 1,
        title: "Existing",
        slug: "01-existing",
        content: "# Existing",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        id: "spec-2",
        projectId: "project-1",
        order: 2,
        title: "Pending",
        slug: "02-pending",
        content: "# Pending",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ]);
    mocks.contextFileFindUnique.mockResolvedValue({
      id: "tracker-1",
      content: "# Progress",
    });
    mocks.researchDocumentFindFirst.mockResolvedValue(null);

    await applyScopeChange("project-1", "plan-1", "user-1");

    expect(db.$transaction).toHaveBeenCalled();
    expect(mocks.diagramVersionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        diagramId: "diagram-1",
        version: 2,
        pngStorageUrl: "blob://diagram.png",
      }),
    });
    expect(mocks.diagramUpdate).toHaveBeenCalledWith({
      where: { id: "diagram-1" },
      data: expect.objectContaining({
        version: 3,
        status: "QUEUED",
        startedAt: null,
        completedAt: null,
      }),
    });
    expect(mocks.featureSpecUpdate).toHaveBeenCalledWith({
      where: { id: "spec-1" },
      data: {
        content: expect.stringContaining("ExecutionPlan: plan-1"),
      },
    });
    expect(mocks.featureSpecCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId: "project-1",
        order: 3,
        title: "Referral Rewards",
        slug: "referral-rewards",
        content: expect.stringContaining(
          "CRITICAL CONTRACT SYNCHRONIZATION GATE",
        ),
      }),
    });
    expect(mocks.projectUpdate).toHaveBeenCalledWith({
      where: { id: "project-1" },
      data: { featureSpecCount: 3 },
    });
    expect(mocks.executionPlanUpdate).toHaveBeenCalledWith({
      where: { id: "plan-1" },
      data: expect.objectContaining({ status: "EXECUTED" }),
    });
    expect(mocks.contextFileUpdate).toHaveBeenCalledWith({
      where: { id: "tracker-1" },
      data: {
        content: expect.stringContaining("Scope Change Applied"),
      },
    });
    expect(mocks.researchDocumentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sourceType: "PROJECT_MANAGEMENT_EXPORT",
        title: "CHANGE_LOG.md",
      }),
    });
    expect(mocks.researchDocumentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sourceType: "SCOPE_CHANGE_ADR",
        title: expect.stringContaining("scope-change-plan-1"),
      }),
    });
  });
});
