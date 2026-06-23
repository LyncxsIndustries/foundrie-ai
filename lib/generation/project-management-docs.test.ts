import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateProjectManagementDocs } from "./project-management-docs";
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
  executionPlans: [{ content: "Plan 1", revisionNotes: null }],
  featureSpecs: [
    {
      order: 1,
      title: "Design System",
      content:
        "## Dependencies\n\n- None\n\n## Out of Scope\n\n- Mobile app\n- Internationalization",
    },
    {
      order: 2,
      title: "Auth",
      content:
        "## Dependencies\n\n- Feature 01\n\n## Out of Scope\n\n- SSO\n- MFA",
    },
  ],
  researchDocuments: [
    { title: "R1", sourceType: "URL", content: "Research data" },
  ],
  contextFiles: [
    { fileType: "ARCHITECTURE_CONTEXT", content: "# Architecture\n\nNext.js, Neon, Clerk" },
  ],
};

describe("generateProjectManagementDocs", () => {
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

  it("should generate and persist four project management documents", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(
      MOCK_PROJECT as any
    );

    vi.mocked(callAI).mockResolvedValue({
      status: "success",
      text: "```markdown\nGenerated content\n```",
    } as any);

    const result = await generateProjectManagementDocs(projectId, userId);

    expect(result).toHaveProperty("scopeMd", "Generated content");
    expect(result).toHaveProperty("timelineMd", "Generated content");
    expect(result).toHaveProperty("pricingMd", "Generated content");
    expect(result).toHaveProperty("changelogMd", "Generated content");

    expect(callAI).toHaveBeenCalledTimes(4);

    // Check persist transaction
    expect(db.$transaction).toHaveBeenCalled();
    expect(db.researchDocument.deleteMany).toHaveBeenCalledWith({
      where: { projectId, sourceType: "PROJECT_MANAGEMENT_EXPORT" },
    });
    expect(db.researchDocument.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          title: "SCOPE.md",
          content: "Generated content",
        }),
        expect.objectContaining({
          title: "TIMELINE.md",
          content: "Generated content",
        }),
        expect.objectContaining({
          title: "PRICING.md",
          content: "Generated content",
        }),
        expect.objectContaining({
          title: "CHANGE_LOG.md",
          content: "Generated content",
        }),
      ]),
    });
  });

  it("should throw if AI rotation is exhausted", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(
      MOCK_PROJECT as any
    );

    vi.mocked(callAI).mockResolvedValue({
      status: "queued",
      retryable: true,
      position: 1,
      rateLimited: false,
    } as any);

    await expect(
      generateProjectManagementDocs(projectId, userId)
    ).rejects.toThrow(
      "AI rotation engine exhausted providers during generation."
    );
  });

  it("should throw if project not found", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(null);
    await expect(
      generateProjectManagementDocs(projectId, userId)
    ).rejects.toThrow(`Project ${projectId} not found.`);
  });

  it("should use requireProjectOwner for authorization", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(
      MOCK_PROJECT as any
    );

    vi.mocked(callAI).mockResolvedValue({
      status: "success",
      text: "content",
    } as any);

    await generateProjectManagementDocs(projectId, userId);

    expect(requireProjectOwner).toHaveBeenCalledWith(projectId, userId);
  });

  it("should call AI with correct task names", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(
      MOCK_PROJECT as any
    );

    vi.mocked(callAI).mockResolvedValue({
      status: "success",
      text: "content",
    } as any);

    await generateProjectManagementDocs(projectId, userId);

    const calledTasks = vi.mocked(callAI).mock.calls.map((c) => c[0]);
    expect(calledTasks).toContain("pm_scope_md");
    expect(calledTasks).toContain("pm_timeline_md");
    expect(calledTasks).toContain("pm_pricing_md");
    expect(calledTasks).toContain("pm_changelog_md");
  });

  it("should exclude REQUIREMENTS_EXPORT and PROJECT_MANAGEMENT_EXPORT from research context", async () => {
    vi.mocked(db.project.findUnique).mockResolvedValue(
      MOCK_PROJECT as any
    );

    vi.mocked(callAI).mockResolvedValue({
      status: "success",
      text: "content",
    } as any);

    await generateProjectManagementDocs(projectId, userId);

    // The findUnique select should have a NOT filter for the two export types
    const findUniqueCall = vi.mocked(db.project.findUnique).mock.calls[0][0];
    const researchFilter = (findUniqueCall as any).select.researchDocuments.where;
    expect(researchFilter).toBeDefined();
    expect(researchFilter.NOT.sourceType.in).toContain("REQUIREMENTS_EXPORT");
    expect(researchFilter.NOT.sourceType.in).toContain(
      "PROJECT_MANAGEMENT_EXPORT"
    );
  });
});
