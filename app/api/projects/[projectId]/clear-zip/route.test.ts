import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { AuthError } from "@/lib/auth/require-auth";

vi.mock("@/lib/auth/require-auth", () => ({
  requireAuth: vi.fn(),
  AuthError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = "AuthError";
    }
  },
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
    const { requireAuth } = await import("@/lib/auth/require-auth");
    vi.mocked(requireAuth).mockRejectedValue(new AuthError("Unauthorized"));

    const request = new Request("http://localhost/api/projects/proj-1/clear-zip");
    const params = Promise.resolve({ projectId: "proj-1" });

    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 404 when project not found", async () => {
    const { requireAuth } = await import("@/lib/auth/require-auth");
    const { db } = await import("@/lib/db");

    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" });
    vi.mocked((db.project.updateMany as any) as any).mockResolvedValue({ count: 0 });

    const request = new Request("http://localhost/api/projects/proj-1/clear-zip");
    const params = Promise.resolve({ projectId: "proj-1" });

    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Project not found.");
  });

  it("clears ZIP metadata successfully", async () => {
    const { requireAuth } = await import("@/lib/auth/require-auth");
    const { db } = await import("@/lib/db");

    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" });
    vi.mocked((db.project.updateMany as any) as any).mockResolvedValue({ count: 1 });

    const request = new Request("http://localhost/api/projects/proj-1/clear-zip");
    const params = Promise.resolve({ projectId: "proj-1" });

    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect((db.project.updateMany as any)).toHaveBeenCalledWith({
      where: { id: "proj-1", userId: "user-1" },
      data: {
        lastZipUrl: null,
        lastZipFileName: null,
        lastZipGeneratedAt: null,
      },
    });
  });

  it("scopes update to authenticated user", async () => {
    const { requireAuth } = await import("@/lib/auth/require-auth");
    const { db } = await import("@/lib/db");

    vi.mocked(requireAuth).mockResolvedValue({ id: "user-2" });
    vi.mocked((db.project.updateMany as any) as any).mockResolvedValue({ count: 1 });

    const request = new Request("http://localhost/api/projects/proj-1/clear-zip");
    const params = Promise.resolve({ projectId: "proj-1" });

    await POST(request, { params });

    expect((db.project.updateMany as any)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "proj-1", userId: "user-2" },
      })
    );
  });
});
