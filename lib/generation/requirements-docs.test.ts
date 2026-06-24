import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateRequirementsDocs } from "./requirements-docs";
import { db } from "../db";
import { getAuthUser } from "../auth/get-auth-user";
import { requireProjectOwner } from "../auth/project-access";
import { callAI } from "../ai";

vi.mock("../db", () => ({
  db: {
    project: { findUnique: vi.fn() },
    researchDocument: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn((cb) => (Array.isArray(cb) ? Promise.all(cb) : cb(db))),
  },
}));

vi.mock("../auth/get-auth-user", () => ({
  getAuthUser: vi.fn(),
}));

vi.mock("../auth/project-access", () => ({
  requireProjectOwner: vi.fn(),
}));

vi.mock("../ai", () => ({
  callAI: vi.fn(),
}));

describe("generateRequirementsDocs", () => {
  const projectId = "proj-1";
  const userId = "user-1";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireProjectOwner).mockResolvedValue({ id: projectId } as any);
    vi.mocked(getAuthUser).mockResolvedValue({ id: userId, plan: "PRO" } as any);
  });

  it("should generate and persist three requirement documents", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue({
      id: projectId,
      requirements: { content: { some: "req" } },
      executionPlans: [{ content: "Plan 1", taskType: "ARCHITECTURE" }],
      researchDocuments: [{ title: "R1", sourceType: "URL", content: "Data" }],
    } as any);

    vi.mocked(callAI).mockResolvedValue({
      status: "ok",
      text: "```markdown\nGenerated content\n```",
    } as any);

    const result = await generateRequirementsDocs(projectId, userId);

    expect(result).toHaveProperty("discoveryNotes", "Generated content");
    expect(result).toHaveProperty("reqAnalysis", "Generated content");
    expect(result).toHaveProperty("archDecisions", "Generated content");

    expect(callAI).toHaveBeenCalledTimes(3);
    
    // Check persist transaction
    expect(db.$transaction).toHaveBeenCalled();
    expect(db.researchDocument.deleteMany).toHaveBeenCalledWith({
      where: { projectId, sourceType: "REQUIREMENTS_EXPORT" },
    });
    expect(db.researchDocument.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ title: "discovery-notes.md", content: "Generated content" }),
        expect.objectContaining({ title: "requirements-analysis.md", content: "Generated content" }),
        expect.objectContaining({ title: "architecture-decisions.md", content: "Generated content" }),
      ]),
    });
  });

  it("should throw if AI rotation is exhausted", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue({
      id: projectId,
      requirements: { content: { some: "req" } },
      executionPlans: [],
      researchDocuments: [],
    } as any);

    vi.mocked(callAI).mockResolvedValue({
      status: "queued",
      retryable: true,
      position: 1,
      rateLimited: false,
    } as any);

    await expect(generateRequirementsDocs(projectId, userId)).rejects.toThrow("AI rotation engine exhausted providers during generation.");
  });

  it("should throw if project not found", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(null);
    await expect(generateRequirementsDocs(projectId, userId)).rejects.toThrow(`Project ${projectId} not found.`);
  });

  it("should use requireProjectOwner for authorization", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue({
      id: projectId,
      requirements: { content: {} },
      executionPlans: [],
      researchDocuments: [],
    } as any);

    vi.mocked(callAI).mockResolvedValue({
      status: "ok",
      text: "content",
    } as any);

    await generateRequirementsDocs(projectId, userId);

    expect(requireProjectOwner).toHaveBeenCalledWith(projectId, userId);
  });
});
