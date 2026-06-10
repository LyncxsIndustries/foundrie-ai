import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectMember } from "@/lib/projects/auth";
import { generateProjectSkills } from "@/lib/skills/generate-project-skills";

vi.mock("@/lib/auth/require-auth");
vi.mock("@/lib/projects/auth");
vi.mock("@/lib/skills/generate-project-skills");

describe("POST /api/skills/[projectId]/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthenticated"));

    const req = new Request("http://localhost/api/skills/project-1/generate", { method: "POST" });
    const params = Promise.resolve({ projectId: "project-1" });
    const res = await POST(req as any, { params });

    expect(res.status).toBe(401);
  });

  it("returns 404 when project not found", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(requireProjectMember).mockResolvedValue(undefined);
    vi.mocked(generateProjectSkills).mockRejectedValue(new Error("Project not found"));

    const req = new Request("http://localhost/api/skills/project-1/generate", { method: "POST" });
    const params = Promise.resolve({ projectId: "project-1" });
    const res = await POST(req as any, { params });

    expect(res.status).toBe(404);
  });

  it("returns 200 with skills when successful", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(requireProjectMember).mockResolvedValue(undefined);
    vi.mocked(generateProjectSkills).mockResolvedValue([
      { slug: "code-review", name: "Code Review", type: "universal", content: "# Skill" },
    ]);

    const req = new Request("http://localhost/api/skills/project-1/generate", { method: "POST" });
    const params = Promise.resolve({ projectId: "project-1" });
    const res = await POST(req as any, { params });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.skills).toHaveLength(1);
  });
});
