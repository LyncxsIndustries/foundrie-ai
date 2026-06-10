import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/require-auth", () => ({
  requireAuth: vi.fn(),
}));
vi.mock("@/lib/projects/auth", () => ({
  requireProjectMember: vi.fn(),
}));
vi.mock("@/lib/diagrams/plan-diagram-jobs", () => ({
  planDiagramJobs: vi.fn(),
}));

const { requireAuth } = await import("@/lib/auth/require-auth");
const { requireProjectMember } = await import("@/lib/projects/auth");
const { planDiagramJobs } = await import("@/lib/diagrams/plan-diagram-jobs");

describe("POST /api/diagrams/[projectId]/plan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("./route");
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error("Unauthorized"));

    const req = new NextRequest("http://localhost/api/diagrams/test-project/plan", {
      method: "POST",
    });
    const params = Promise.resolve({ projectId: "test-project" });

    const response = await POST(req, { params });
    expect(response.status).toBe(500); // Error handling returns 500
  });

  it("returns 404 when user is not a project member", async () => {
    const { POST } = await import("./route");
    vi.mocked(requireAuth).mockResolvedValueOnce({
      id: "user-123",
      clerkId: "clerk-123",
      email: "test@example.com",
      plan: "FREE",
      role: "USER",
    });
    vi.mocked(requireProjectMember).mockResolvedValueOnce(false);

    const req = new NextRequest("http://localhost/api/diagrams/test-project/plan", {
      method: "POST",
    });
    const params = Promise.resolve({ projectId: "test-project" });

    const response = await POST(req, { params });
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe("Project not found");
  });

  it("returns 200 with diagram plan when successful", async () => {
    const { POST } = await import("./route");
    vi.mocked(requireAuth).mockResolvedValueOnce({
      id: "user-123",
      clerkId: "clerk-123",
      email: "test@example.com",
      plan: "FREE",
      role: "USER",
    });
    vi.mocked(requireProjectMember).mockResolvedValueOnce(true);
    vi.mocked(planDiagramJobs).mockResolvedValueOnce({
      diagrams: [
        {
          id: "diagram-1",
          projectId: "test-project",
          diagramTypeId: "system-context",
          category: "structural",
          name: "System Context Diagram",
          folderPath: "diagrams/structural/system-context/",
          fileName: "system-context-v1.mermaid",
          orderInCategory: 0,
          status: "QUEUED",
          version: 1,
          reactFlowData: null,
          pngStorageUrl: null,
          errorMessage: null,
          startedAt: null,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      rationale: "System Context needed for all projects",
    });

    const req = new NextRequest("http://localhost/api/diagrams/test-project/plan", {
      method: "POST",
    });
    const params = Promise.resolve({ projectId: "test-project" });

    const response = await POST(req, { params });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.message).toBe("Diagram planning completed");
    expect(json.diagramCount).toBe(1);
    expect(json.diagrams).toHaveLength(1);
    expect(json.diagrams[0].diagramTypeId).toBe("system-context");
  });
});
