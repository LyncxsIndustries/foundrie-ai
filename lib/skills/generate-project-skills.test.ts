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
  return {
    ...actual,
    readFile: vi.fn(),
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
    const { readFile } = await import("fs/promises");

    vi.mocked((db.project.findFirst as any) as any).mockResolvedValue({
      id: "project-1",
      name: "Test Project",
      userId: "user-1",
      contextFiles: [],
      requirements: null,
    } as any);

    vi.mocked(readFile).mockImplementation((path: any) => {
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

  // TODO: Fix this test - mock needs adjustment for stack detection
  it.skip("detects Next.js stack skills", async () => {
    const { db } = await import("@/lib/db");
    const { readFile } = await import("fs/promises");

    vi.mocked((db.project.findFirst as any) as any).mockResolvedValue({
      id: "project-1",
      name: "Test Project",
      userId: "user-1",
      contextFiles: [{ content: "Architecture uses Next.js framework" }],
      requirements: null,
    } as any);

    vi.mocked(readFile).mockImplementation((path: any) => {
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
