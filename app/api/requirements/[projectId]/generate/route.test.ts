import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectMember } from "@/lib/projects/auth";
import { tasks } from "@trigger.dev/sdk";

vi.mock("@/lib/auth/require-auth", () => ({
  requireAuth: vi.fn(),
  AuthError: class AuthError extends Error {
    status = 401;
    constructor() {
      super("Auth");
    }
  },
}));

vi.mock("@/lib/projects/auth", () => ({
  requireProjectMember: vi.fn(),
  ProjectAuthError: class ProjectAuthError extends Error {
    status = 404;
    constructor() {
      super("Not Found");
    }
  },
}));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: {
    trigger: vi.fn(),
  },
}));

describe("Requirements Generate Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should trigger the requirements task and return 202", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      id: "user-1",
      email: "test@test.com",
      role: "USER",
      plan: "FREE",
    } as any);
    vi.mocked(requireProjectMember).mockResolvedValue(undefined as any);
    vi.mocked(tasks.trigger).mockResolvedValue({ id: "task-id-123" } as any);

    const request = new Request(
      "http://localhost/api/requirements/proj-1/generate",
      { method: "POST" }
    );
    const response = await POST(request, {
      params: Promise.resolve({ projectId: "proj-1" }),
    });

    expect(response.status).toBe(202);
    const data = await response.json();
    expect(data).toEqual({ id: "task-id-123" });
    expect(requireAuth).toHaveBeenCalled();
    expect(requireProjectMember).toHaveBeenCalledWith("proj-1", "user-1");
    expect(tasks.trigger).toHaveBeenCalledWith("generate-requirements", {
      projectId: "proj-1",
    });
  });

  it("should return 404 if unauthorized or project not found", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      id: "user-1",
      email: "test@test.com",
      role: "USER",
      plan: "FREE",
    } as any);
    const error = new Error("Not Found");
    (error as any).status = 404;
    vi.mocked(requireProjectMember).mockRejectedValue(error);

    const request = new Request(
      "http://localhost/api/requirements/proj-1/generate",
      { method: "POST" }
    );
    const response = await POST(request, {
      params: Promise.resolve({ projectId: "proj-1" }),
    });

    expect(response.status).toBe(404);
  });

  it("should return 401 if not authenticated", async () => {
    const error = new Error("Auth");
    (error as any).status = 401;
    vi.mocked(requireAuth).mockRejectedValue(error);

    const request = new Request(
      "http://localhost/api/requirements/proj-1/generate",
      { method: "POST" }
    );
    const response = await POST(request, {
      params: Promise.resolve({ projectId: "proj-1" }),
    });

    expect(response.status).toBe(401);
  });
});
