import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/require-auth");
vi.mock("@/lib/projects/auth");
vi.mock("@/lib/db");

describe("GET /api/diagrams/[projectId]/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { requireAuth } = await import("@/lib/auth/require-auth");
    vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"));

    const req = new NextRequest("http://localhost/api/diagrams/proj-1/status");
    const params = Promise.resolve({ projectId: "proj-1" });

    const res = await GET(req, { params });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 404 when project not found", async () => {
    const { requireAuth } = await import("@/lib/auth/require-auth");
    const { requireProjectMember } = await import("@/lib/projects/auth");
    vi.mocked(requireAuth).mockResolvedValue({
      id: "user-1",
      clerkId: "clerk-1",
      email: "user@example.com",
      plan: "FREE",
      role: "USER",
    });
    vi.mocked(requireProjectMember).mockRejectedValue(new Error("Project not found"));

    const req = new NextRequest("http://localhost/api/diagrams/proj-1/status");
    const params = Promise.resolve({ projectId: "proj-1" });

    const res = await GET(req, { params });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Project not found");
  });

  it("returns diagram status on success", async () => {
    const { requireAuth } = await import("@/lib/auth/require-auth");
    const { requireProjectMember } = await import("@/lib/projects/auth");
    const { db } = await import("@/lib/db");

    vi.mocked(requireAuth).mockResolvedValue({
      id: "user-1",
      clerkId: "clerk-1",
      email: "user@example.com",
      plan: "FREE",
      role: "USER",
    });
    vi.mocked(requireProjectMember).mockResolvedValue(undefined);
    
    const mockDb = db as any;
    mockDb.diagram = { findMany: vi.fn() };
    mockDb.project = { findUnique: vi.fn() };

    mockDb.diagram.findMany.mockResolvedValue([
      {
        id: "diag-1",
        diagramTypeId: "system-context",
        category: "structural",
        name: "System Context",
        status: "DONE",
        orderInCategory: 0,
        errorMessage: null,
        startedAt: new Date(),
        completedAt: new Date(),
      },
    ]);
    mockDb.project.findUnique.mockResolvedValue({
      status: "DIAGRAMS",
      completedDiagramCount: 1,
      diagramCount: 5,
    });

    const req = new NextRequest("http://localhost/api/diagrams/proj-1/status");
    const params = Promise.resolve({ projectId: "proj-1" });

    const res = await GET(req, { params });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.diagrams).toHaveLength(1);
    expect(data.projectStatus).toBe("DIAGRAMS");
    expect(data.completedCount).toBe(1);
    expect(data.totalCount).toBe(5);
  });
});
