import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/require-auth");
vi.mock("@/lib/projects/auth");
vi.mock("@trigger.dev/sdk", () => ({
  tasks: {
    trigger: vi.fn(),
  },
}));

const { requireAuth } = await import("@/lib/auth/require-auth");
const { requireProjectMember } = await import("@/lib/projects/auth");
const { tasks } = await import("@trigger.dev/sdk");

describe("POST /api/architecture/[projectId]/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 202 when architecture generation starts successfully", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      id: "user-1",
      clerkId: "clerk-1",
      email: "test@example.com",
      plan: "PRO",
      role: "USER",
    });
    vi.mocked(requireProjectMember).mockResolvedValue(undefined);
    vi.mocked(tasks.trigger).mockResolvedValue({ id: "run-123" } as any);

    const req = new NextRequest("http://localhost/api/architecture/project-1/generate", {
      method: "POST",
    });
    const context = { params: Promise.resolve({ projectId: "project-1" }) };

    const response = await POST(req, context);
    const data = await response.json();

    expect(response.status).toBe(202);
    expect(data.runId).toBe("run-123");
    expect(tasks.trigger).toHaveBeenCalledWith("generate-architecture", {
      projectId: "project-1",
    });
  });

  it("returns 404 when user is not a project member", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      id: "user-1",
      clerkId: "clerk-1",
      email: "test@example.com",
      plan: "PRO",
      role: "USER",
    });
    vi.mocked(requireProjectMember).mockRejectedValue(new Error("not a member"));

    const req = new NextRequest("http://localhost/api/architecture/project-1/generate", {
      method: "POST",
    });
    const context = { params: Promise.resolve({ projectId: "project-1" }) };

    const response = await POST(req, context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Project not found");
  });

  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"));

    const req = new NextRequest("http://localhost/api/architecture/project-1/generate", {
      method: "POST",
    });
    const context = { params: Promise.resolve({ projectId: "project-1" }) };

    const response = await POST(req, context);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });
});
