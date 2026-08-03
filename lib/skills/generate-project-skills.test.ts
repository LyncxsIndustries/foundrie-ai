import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateProjectSkills } from "./generate-project-skills";

vi.mock("@/lib/db", async () => {
  const mockDb = {
    project: { findFirst: vi.fn() },
    projectAgentSkill: { create: vi.fn(), deleteMany: vi.fn() },
    $transaction: vi.fn((ops) => Promise.all(ops)),
  };
  return {
    db: mockDb,
  };
});

vi.mock("fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs/promises")>();
  const readFileMock = vi.fn();
  return {
    ...actual,
    readFile: readFileMock,
    default: {
      ...actual,
      readFile: readFileMock,
    },
  };
});

describe("generateProjectSkills", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws error when project not found", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked((db.project.findFirst as any) as any).mockResolvedValue(null);

    await expect(generateProjectSkills("project-1", "user-1")).rejects.toThrow(
      "Project not found"
    );
  });

  it("generates universal skills", async () => {
    const { db } = await import("@/lib/db");
    const fs = await import("fs/promises");

    vi.mocked((db.project.findFirst as any) as any).mockResolvedValue({
      id: "project-1",
      name: "Test Project",
      userId: "user-1",
      contextFiles: [],
      requirements: null,
    } as any);

    vi.mocked(fs.readFile).mockImplementation((path: any) => {
      if (path.includes("skills-lock.json")) {
        return Promise.resolve(
          JSON.stringify({
            version: 1,
            skills: {
              "code-review": { source: "test", sourceType: "github", skillPath: "" },
              autofix: { source: "test", sourceType: "github", skillPath: "" },
            },
          }) as any
        );
      }
      return Promise.resolve("# Test Skill" as any);
    });

    const skills = await generateProjectSkills("project-1", "user-1");

    expect(skills.some((s) => s.slug === "code-review" && s.type === "universal")).toBe(true);
    expect(skills.some((s) => s.slug === "project-research" && s.type === "custom")).toBe(true);
  });

  it("resolves multi-level alias chains with notes", async () => {
    const { db } = await import("@/lib/db");
    const fs = await import("fs/promises");

    vi.mocked((db.project.findFirst as any) as any).mockResolvedValue({
      id: "project-1",
      name: "Test Project",
      userId: "user-1",
      contextFiles: [],
      requirements: null,
    } as any);

    vi.mocked(fs.readFile).mockImplementation((path: any) => {
      if (path.includes("skills-lock.json")) {
        return Promise.resolve(
          JSON.stringify({
            version: 1,
            skills: {
              "code-review": { aliasOf: "alias-1", notes: "Top note" },
              "alias-1": { aliasOf: "alias-2", notes: "Mid note" },
              "alias-2": { source: "test", sourceType: "github", skillPath: "" },
            },
          }) as any
        );
      }
      return Promise.resolve("# Base content" as any);
    });

    const skills = await generateProjectSkills("project-1", "user-1");
    const codeReviewSkill = skills.find((s) => s.slug === "code-review");
    expect(codeReviewSkill).toBeDefined();
    expect(codeReviewSkill?.content).toBe(
      "> **Alias Note for code-review:** Top note\n\n> **Alias Note for alias-1:** Mid note\n\n# Base content"
    );
  });

  it("throws on circular aliases", async () => {
    const { db } = await import("@/lib/db");
    const fs = await import("fs/promises");

    vi.mocked((db.project.findFirst as any) as any).mockResolvedValue({
      id: "project-1",
      name: "Test Project",
      userId: "user-1",
      contextFiles: [],
      requirements: null,
    } as any);

    vi.mocked(fs.readFile).mockImplementation((path: any) => {
      if (path.includes("skills-lock.json")) {
        return Promise.resolve(
          JSON.stringify({
            version: 1,
            skills: {
              "code-review": { aliasOf: "alias-1" },
              "alias-1": { aliasOf: "code-review" },
            },
          }) as any
        );
      }
      return Promise.resolve("" as any);
    });

    await expect(generateProjectSkills("project-1", "user-1")).rejects.toThrow(
      "Circular skill alias detected: code-review -> alias-1 -> code-review"
    );
  });


  // TODO: Fix this test - mock needs adjustment for stack detection
  it.skip("detects Next.js stack skills", async () => {
    const { db } = await import("@/lib/db");
    const fs = await import("fs/promises");

    vi.mocked((db.project.findFirst as any) as any).mockResolvedValue({
      id: "project-1",
      name: "Test Project",
      userId: "user-1",
      contextFiles: [{ content: "Architecture uses Next.js framework" }],
      requirements: null,
    } as any);

    vi.mocked(fs.readFile).mockImplementation((path: any) => {
      if (path.includes("skills-lock.json")) {
        return Promise.resolve(
          JSON.stringify({
            version: 1,
            skills: {
              "next-best-practices": { source: "test", sourceType: "github", skillPath: "" },
            },
          }) as any
        );
      }
      return Promise.resolve("# Test Skill" as any);
    });

    const skills = await generateProjectSkills("project-1", "user-1");

    expect(
      skills.some((s) => s.slug === "next-best-practices" && s.type === "stack-dependent")
    ).toBe(true);
  });
});
