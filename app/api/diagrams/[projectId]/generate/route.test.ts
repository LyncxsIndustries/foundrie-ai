import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/require-auth");
vi.mock("@/lib/projects/auth");
vi.mock("@trigger.dev/sdk/v3");

describe("POST /api/diagrams/[projectId]/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { requireAuth } = await import("@/lib/auth/require-auth");
    vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"));

    const req = new NextRequest("http://localhost/api/diagrams/proj-1/generate", {
      method: "POST",
    });
    const params = Promise.resolve({ projectId: "proj-1" });

    const res = await POST(req, { params });
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

    const req = new NextRequest("http://localhost/api/diagrams/proj-1/generate", {
      method: "POST",
    });
    const params = Promise.resolve({ projectId: "proj-1" });

    const res = await POST(req, { params });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Project not found");
  });

  it("returns 202 and triggers task on success", async () => {
    const { requireAuth } = await import("@/lib/auth/require-auth");
    const { requireProjectMember } = await import("@/lib/projects/auth");
    const { tasks } = await import("@trigger.dev/sdk/v3");

    vi.mocked(requireAuth).mockResolvedValue({
      id: "user-1",
      clerkId: "clerk-1",
      email: "user@example.com",
      plan: "FREE",
      role: "USER",
    });
    vi.mocked(requireProjectMember).mockResolvedValue(undefined);
    vi.mocked(tasks.trigger).mockResolvedValue({ id: "run-123" } as any);

    const req = new NextRequest("http://localhost/api/diagrams/proj-1/generate", {
      method: "POST",
    });
    const params = Promise.resolve({ projectId: "proj-1" });

    const res = await POST(req, { params });
    const data = await res.json();

    expect(res.status).toBe(202);
    expect(data.message).toBe("Diagram generation started");
    expect(data.runId).toBe("run-123");
    expect(tasks.trigger).toHaveBeenCalledWith("generate-diagrams", { projectId: "proj-1" });
  });
});
