import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateAgenticSecurity } from "./agentic-security";
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

const MOCK_PROJECT_AGENTIC = {
  id: "proj-1",
  name: "Test Project",
  contextFiles: [
    { fileType: "ARCHITECTURE_CONTEXT", content: "# Architecture\n\nNext.js" },
  ],
  diagrams: [{ diagramTypeId: "agent-architecture" }],
};

const MOCK_PROJECT_NON_AGENTIC = {
  id: "proj-1",
  name: "Test Project",
  contextFiles: [
    { fileType: "ARCHITECTURE_CONTEXT", content: "# Architecture\n\nNext.js" },
  ],
  diagrams: [{ diagramTypeId: "system-context" }],
};

describe("generateAgenticSecurity", () => {
  const projectId = "proj-1";
  const userId = "user-1";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireProjectOwner).mockResolvedValue({ id: projectId } as any);
    vi.mocked(getAuthUser).mockResolvedValue({ id: userId, plan: "PRO" } as any);
  });

  it("should generate and persist agentic security for agentic project", async () => {
    vi.mocked((db.project.findUnique as any) as any).mockResolvedValue(MOCK_PROJECT_AGENTIC as any);

    vi.mocked(callAI).mockResolvedValue({
      status: "ok",
      text: '```json\n{"tools/permissions.yaml": "content", "evals/golden-set.json": "content2"}\n```',
    } as any);

    const result = await generateAgenticSecurity(projectId, userId);

    expect(result.success).toBe(true);
    expect(result.documentCount).toBe(2);

    expect(callAI).toHaveBeenCalledTimes(1);
    expect(callAI).toHaveBeenCalledWith(
      "agentic_security_generation",
      expect.objectContaining({
        maxTokens: 4000,
      })
    );

    // Check persist transaction
    expect(db.$transaction).toHaveBeenCalled();
    expect(db.researchDocument.deleteMany).toHaveBeenCalledWith({
      where: { projectId, sourceType: "AGENTIC_SECURITY_EXPORT" },
    });
    expect(db.researchDocument.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ title: "tools/permissions.yaml", content: "content" }),
        expect.objectContaining({ title: "evals/golden-set.json", content: "content2" }),
      ]),
    });
  });

  it("should skip generation for non-agentic projects", async () => {
    vi.mocked((db.project.findUnique as any) as any).mockResolvedValue(MOCK_PROJECT_NON_AGENTIC as any);

    const result = await generateAgenticSecurity(projectId, userId);

    expect(result.success).toBe(true);
    expect(result.documentCount).toBe(0);
    expect(result.skipped).toBe(true);
    expect(callAI).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("should throw if AI rotation is exhausted", async () => {
    vi.mocked((db.project.findUnique as any) as any).mockResolvedValue(MOCK_PROJECT_AGENTIC as any);

    vi.mocked(callAI).mockResolvedValue({
      status: "queued",
      retryable: true,
      position: 1,
      rateLimited: false,
    } as any);

    await expect(generateAgenticSecurity(projectId, userId)).rejects.toThrow(
      "AI rotation engine exhausted providers during generation."
    );
  });

  it("should throw if project not found", async () => {
    vi.mocked((db.project.findUnique as any) as any).mockResolvedValue(null);
    await expect(generateAgenticSecurity(projectId, userId)).rejects.toThrow(
      `Project ${projectId} not found.`
    );
  });
});
