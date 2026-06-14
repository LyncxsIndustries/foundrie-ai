import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { requireAuth, AuthError } from "@/lib/auth/require-auth";
import { requireProjectMember, ProjectAuthError } from "@/lib/projects/auth";

vi.mock("@/lib/auth/require-auth", () => ({
  requireAuth: vi.fn(),
  AuthError: class AuthError extends Error {},
}));

vi.mock("@/lib/projects/auth", () => ({
  requireProjectMember: vi.fn(),
  ProjectAuthError: class ProjectAuthError extends Error {},
}));

vi.mock("@/lib/db", () => ({
  db: {
    project: {
      updateMany: vi.fn(),
    },
  },
}));

describe("POST /api/projects/[projectId]/clear-zip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new AuthError("Unauthorized"));

    const request = new Request("http://localhost/api/projects/proj-1/clear-zip");
    const params = Promise.resolve({ projectId: "proj-1" });

    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
  });

  it("returns 404 when project not found or user is not a member", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(requireProjectMember).mockRejectedValue(new ProjectAuthError("Not found"));
    vi.mocked(db.project.updateMany).mockResolvedValue({ count: 0 } as any);

    const request = new Request("http://localhost/api/projects/proj-1/clear-zip");
    const params = Promise.resolve({ projectId: "proj-1" });

    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Project not found.");
  });

  it("clears ZIP metadata successfully", async () => {
    const { db } = await import("@/lib/db");

    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(requireProjectMember).mockResolvedValue(undefined);
    vi.mocked(db.project.updateMany).mockResolvedValue({ count: 1 } as any);

    const request = new Request("http://localhost/api/projects/proj-1/clear-zip");
    const params = Promise.resolve({ projectId: "proj-1" });

    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(db.project.updateMany).toHaveBeenCalledWith({
      where: { id: "proj-1" },
      data: {
        lastZipUrl: null,
        lastZipFileName: null,
        lastZipGeneratedAt: null,
      },
    });
  });
});
