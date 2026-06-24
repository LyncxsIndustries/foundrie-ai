import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateProjectDocs } from "./project-docs";
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
  requirements: { content: { functional: ["User login"] } },
  executionPlans: [{ content: "Plan 1" }],
  diagrams: [{ diagramTypeId: "agent-architecture" }],
  researchDocuments: [
    { title: "R1", sourceType: "URL", content: "Research data" },
  ],
  contextFiles: [
    { fileType: "ARCHITECTURE_CONTEXT", content: "# Architecture\n\nNext.js" },
  ],
};

const MOCK_NON_AGENTIC_PROJECT = {
  ...MOCK_PROJECT,
  diagrams: [{ diagramTypeId: "system-context" }],
};

describe("generateProjectDocs", () => {
  const projectId = "proj-1";
  const userId = "user-1";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireProjectOwner).mockResolvedValue({
      id: projectId,
    } as any);
    vi.mocked(getAuthUser).mockResolvedValue({
      id: userId,
      plan: "PRO",
    } as any);
  });

  it("should generate and persist docs package for agentic project", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(MOCK_PROJECT as any);

    vi.mocked(callAI).mockImplementation(async (taskName) => {
      if (taskName === "docs_adr_md") {
        return {
          status: "ok",
          text: '```json\n[{"filename": "ADR-0001.md", "content": "ADR 1"}]\n```',
        } as any;
      }
      return {
        status: "ok",
        text: "```markdown\nGenerated content\n```",
      } as any;
    });

    const result = await generateProjectDocs(projectId, userId);

    expect(result.success).toBe(true);
    expect(result.documentCount).toBe(9); // 7 base + 1 ADR + 1 RED-TEAM

    expect(callAI).toHaveBeenCalledTimes(9);

    // Check persist transaction
    expect(db.$transaction).toHaveBeenCalled();
    expect(db.researchDocument.deleteMany).toHaveBeenCalledWith({
      where: { projectId, sourceType: "PROJECT_DOCS_EXPORT" },
    });
    expect(db.researchDocument.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ title: "PRODUCTION-CHECKLIST.md" }),
        expect.objectContaining({ title: "QUALITY-GATE.md" }),
        expect.objectContaining({ title: "LOGGING.md" }),
        expect.objectContaining({ title: "SECURITY.md" }),
        expect.objectContaining({ title: "PRIVACY.md" }),
        expect.objectContaining({ title: "TOOLING.md" }),
        expect.objectContaining({ title: "CONTRIBUTING.md" }),
        expect.objectContaining({ title: "adr/ADR-0001.md" }),
        expect.objectContaining({ title: "security/RED-TEAM.md" }),
      ]),
    });
  });

  it("should not generate RED-TEAM.md for non-agentic projects", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(
      MOCK_NON_AGENTIC_PROJECT as any
    );

    vi.mocked(callAI).mockImplementation(async (taskName) => {
      if (taskName === "docs_adr_md") {
        return {
          status: "ok",
          text: '[{"filename": "ADR-0001.md", "content": "ADR 1"}]',
        } as any;
      }
      return {
        status: "ok",
        text: "content",
      } as any;
    });

    const result = await generateProjectDocs(projectId, userId);

    expect(result.success).toBe(true);
    expect(result.documentCount).toBe(8); // 7 base + 1 ADR
    expect(callAI).toHaveBeenCalledTimes(8);
  });

  it("should throw if AI rotation is exhausted", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(MOCK_PROJECT as any);

    vi.mocked(callAI).mockResolvedValue({
      status: "queued",
      retryable: true,
      position: 1,
      rateLimited: false,
    } as any);

    await expect(generateProjectDocs(projectId, userId)).rejects.toThrow(
      "AI rotation engine exhausted providers during generation."
    );
  });

  it("should throw if project not found", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(null);
    await expect(generateProjectDocs(projectId, userId)).rejects.toThrow(
      `Project ${projectId} not found.`
    );
  });

  it("should use requireProjectOwner for authorization", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(MOCK_PROJECT as any);

    vi.mocked(callAI).mockImplementation(async (taskName) => {
      if (taskName === "docs_adr_md") {
        return {
          status: "ok",
          text: "[]",
        } as any;
      }
      return {
        status: "ok",
        text: "content",
      } as any;
    });

    await generateProjectDocs(projectId, userId);

    expect(requireProjectOwner).toHaveBeenCalledWith(projectId, userId);
  });
});
