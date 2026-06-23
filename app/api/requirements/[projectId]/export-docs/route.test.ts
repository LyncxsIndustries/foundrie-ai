import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { requireAuth } from "@/lib/auth/require-auth";
import { generateRequirementsDocs } from "@/lib/generation/requirements-docs";

vi.mock("@/lib/auth/require-auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/generation/requirements-docs", () => ({
  generateRequirementsDocs: vi.fn(),
}));

function makeRequest() {
  return new Request("http://localhost/api/requirements/proj-1/export-docs", {
    method: "POST",
  });
}

function makeParams(projectId = "proj-1") {
  return { params: Promise.resolve({ projectId }) };
}

describe("POST /api/requirements/[projectId]/export-docs", () => {
  const userId = "user-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"));

    const res = await POST(makeRequest(), makeParams());
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when project not found or not owner", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: userId } as any);
    vi.mocked(generateRequirementsDocs).mockRejectedValue(
      new Error("Project not found.")
    );

    const res = await POST(makeRequest(), makeParams());
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error).toBe("Not found");
  });

  it("returns 503 when AI providers are exhausted", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: userId } as any);
    vi.mocked(generateRequirementsDocs).mockRejectedValue(
      new Error("AI rotation engine exhausted providers during generation.")
    );

    const res = await POST(makeRequest(), makeParams());
    expect(res.status).toBe(503);
  });

  it("returns 200 with generated documents on success", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: userId } as any);
    vi.mocked(generateRequirementsDocs).mockResolvedValue({
      discoveryNotes: "# Discovery Notes",
      reqAnalysis: "# Requirements Analysis",
      archDecisions: "# Architecture Decisions",
    });

    const res = await POST(makeRequest(), makeParams());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.discoveryNotes).toBe("# Discovery Notes");
    expect(body.reqAnalysis).toBe("# Requirements Analysis");
    expect(body.archDecisions).toBe("# Architecture Decisions");
  });

  it("passes the correct projectId and userId to generateRequirementsDocs", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: userId } as any);
    vi.mocked(generateRequirementsDocs).mockResolvedValue({
      discoveryNotes: "",
      reqAnalysis: "",
      archDecisions: "",
    });

    await POST(makeRequest(), makeParams("proj-abc"));

    expect(generateRequirementsDocs).toHaveBeenCalledWith("proj-abc", userId);
  });
});
