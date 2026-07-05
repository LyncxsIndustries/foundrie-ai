import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateCicdScaffolding } from "./cicd-scaffolding";
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

const MOCK_PROJECT = {
  id: "proj-1",
  name: "Test Project",
  contextFiles: [
    { fileType: "ARCHITECTURE_CONTEXT", content: "# Architecture\n\nNext.js" },
  ],
  executionPlans: [{ content: "Plan 1" }],
};

describe("generateCicdScaffolding", () => {
  const projectId = "proj-1";
  const userId = "user-1";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireProjectOwner).mockResolvedValue({ id: projectId } as any);
    vi.mocked(getAuthUser).mockResolvedValue({ id: userId, plan: "PRO" } as any);
  });

  it("should generate and persist CI/CD scaffolding", async () => {
    vi.mocked((db.project.findUnique as any) as any).mockResolvedValue(MOCK_PROJECT as any);

    vi.mocked(callAI).mockResolvedValue({
      status: "ok",
      text: '```json\n{"ci.yml": "content", "cd.yml": "content2"}\n```',
    } as any);

    const result = await generateCicdScaffolding(projectId, userId);

    expect(result.success).toBe(true);
    expect(result.documentCount).toBe(2);

    expect(callAI).toHaveBeenCalledTimes(1);
    expect(callAI).toHaveBeenCalledWith(
      "cicd_scaffolding_generation",
      expect.objectContaining({
        maxTokens: 8000,
      })
    );

    // Check persist transaction
    expect(db.$transaction).toHaveBeenCalled();
    expect(db.researchDocument.deleteMany).toHaveBeenCalledWith({
      where: { projectId, sourceType: "CICD_SCAFFOLDING_EXPORT" },
    });
    expect(db.researchDocument.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ title: "ci.yml", content: "content" }),
        expect.objectContaining({ title: "cd.yml", content: "content2" }),
      ]),
    });
  });

  it("should throw if AI rotation is exhausted", async () => {
    vi.mocked((db.project.findUnique as any) as any).mockResolvedValue(MOCK_PROJECT as any);

    vi.mocked(callAI).mockResolvedValue({
      status: "queued",
      retryable: true,
      position: 1,
      rateLimited: false,
    } as any);

    await expect(generateCicdScaffolding(projectId, userId)).rejects.toThrow(
      "AI rotation engine exhausted providers during generation."
    );
  });

  it("should throw if project not found", async () => {
    vi.mocked((db.project.findUnique as any) as any).mockResolvedValue(null);
    await expect(generateCicdScaffolding(projectId, userId)).rejects.toThrow(
      `Project ${projectId} not found.`
    );
  });
});
