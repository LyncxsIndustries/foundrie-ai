import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, GET } from "./route";
import { tasks, runs } from "@trigger.dev/sdk";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    project: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/get-auth-user", () => ({
  getAuthUser: vi.fn(),
}));

vi.mock("@/lib/auth/require-auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/projects/auth", () => ({
  requireProjectMember: vi.fn().mockResolvedValue({ role: "OWNER" }),
  ProjectAuthError: class ProjectAuthError extends Error {
    status = 404;
    constructor(message = "Project not found") {
      super(message);
    }
  }
}));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: {
    trigger: vi.fn(),
  },
  runs: {
    retrieve: vi.fn(),
  },
}));

vi.mock("@/trigger/generate-project-zip", () => ({
  generateProjectZip: vi.fn(),
}));

import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectMember, ProjectAuthError } from "@/lib/projects/auth";

describe("POST /api/projects/[projectId]/download", () => {
  const mockUser = { id: "user-1", clerkId: "clerk-1", email: "test@example.com", plan: "FREE", role: "USER" };
  const mockProjectId = "project-1";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue(mockUser);
  });

  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"));

    const request = new NextRequest("http://localhost:3000/api/projects/project-1/download", {
      method: "POST",
    });
    const params = Promise.resolve({ projectId: mockProjectId });

    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 404 when project is not found or user does not own it", async () => {
    vi.mocked(requireProjectMember).mockRejectedValueOnce(new ProjectAuthError());

    const request = new NextRequest("http://localhost:3000/api/projects/project-1/download", {
      method: "POST",
    });
    const params = Promise.resolve({ projectId: mockProjectId });

    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Project not found");
  });

  it("returns cached ZIP metadata when within 10-minute window", async () => {
    const tenMinutesAgo = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    const mockProject = {
      id: mockProjectId,
      lastZipUrl: "https://blob.vercel-storage.com/zip-123.zip",
      lastZipFileName: "project_2024-01-01.zip",
      lastZipGeneratedAt: tenMinutesAgo,
    };

    vi.mocked((db.project.findFirst as any) as any).mockResolvedValue(mockProject);

    // Mock HEAD request for size
    global.fetch = vi.fn().mockResolvedValue({
      headers: {
        get: vi.fn().mockReturnValue("1024000"),
      },
    } as any);

    const request = new NextRequest("http://localhost:3000/api/projects/project-1/download", {
      method: "POST",
    });
    const params = Promise.resolve({ projectId: mockProjectId });

    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.cached).toBe(true);
    expect(data.fileName).toBe("project_2024-01-01.zip");
    expect(data.url).toBe("https://blob.vercel-storage.com/zip-123.zip");
    expect(data.size).toBe(1024000);
  });

  it("triggers generation when cache is expired", async () => {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago
    const mockProject = {
      id: mockProjectId,
      lastZipUrl: "https://blob.vercel-storage.com/zip-123.zip",
      lastZipFileName: "project_2024-01-01.zip",
      lastZipGeneratedAt: fifteenMinutesAgo,
    };

    vi.mocked((db.project.findFirst as any) as any).mockResolvedValue(mockProject);
    vi.mocked(tasks.trigger).mockResolvedValue({ id: "run-123" } as any);

    const request = new NextRequest("http://localhost:3000/api/projects/project-1/download", {
      method: "POST",
    });
    const params = Promise.resolve({ projectId: mockProjectId });

    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(202);
    expect(data.cached).toBe(false);
    expect(data.runId).toBe("run-123");
    expect(tasks.trigger).toHaveBeenCalledWith("generate-project-zip", {
      projectId: mockProjectId,
      userId: mockUser.id,
    });
  });

  it("triggers generation when no cached ZIP exists", async () => {
    const mockProject = {
      id: mockProjectId,
      lastZipUrl: null,
      lastZipFileName: null,
      lastZipGeneratedAt: null,
    };

    vi.mocked((db.project.findFirst as any) as any).mockResolvedValue(mockProject);
    vi.mocked(tasks.trigger).mockResolvedValue({ id: "run-123" } as any);

    const request = new NextRequest("http://localhost:3000/api/projects/project-1/download", {
      method: "POST",
    });
    const params = Promise.resolve({ projectId: mockProjectId });

    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(202);
    expect(data.cached).toBe(false);
    expect(data.runId).toBe("run-123");
  });
});

describe("GET /api/projects/[projectId]/download", () => {
  const mockUser = { id: "user-1", clerkId: "clerk-1", email: "test@example.com", plan: "FREE", role: "USER" };
  const mockProjectId = "project-1";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue(mockUser);
  });

  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"));

    const request = new NextRequest(
      "http://localhost:3000/api/projects/project-1/download?runId=run-123",
      { method: "GET" }
    );
    const params = Promise.resolve({ projectId: mockProjectId });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 when runId is missing", async () => {
    vi.mocked((db.project.findFirst as any) as any).mockResolvedValue({ id: mockProjectId });

    const request = new NextRequest("http://localhost:3000/api/projects/project-1/download", {
      method: "GET",
    });
    const params = Promise.resolve({ projectId: mockProjectId });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("runId query parameter is required");
  });

  it("returns 404 when project is not found or user does not own it", async () => {
    vi.mocked(requireProjectMember).mockRejectedValueOnce(new ProjectAuthError());

    const request = new NextRequest(
      "http://localhost:3000/api/projects/project-1/download?runId=run-123",
      { method: "GET" }
    );
    const params = Promise.resolve({ projectId: mockProjectId });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Project not found");
  });

  it("returns completed status with ZIP metadata", async () => {
    vi.mocked((db.project.findFirst as any) as any).mockResolvedValue({ id: mockProjectId });
    vi.mocked(runs.retrieve).mockResolvedValue({
      id: "run-123",
      status: "COMPLETED",
      output: {
        fileName: "project_2024-01-01.zip",
        url: "https://blob.vercel-storage.com/zip-123.zip",
        size: 1024000,
      },
    } as any);

    const request = new NextRequest(
      "http://localhost:3000/api/projects/project-1/download?runId=run-123",
      { method: "GET" }
    );
    const params = Promise.resolve({ projectId: mockProjectId });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("completed");
    expect(data.fileName).toBe("project_2024-01-01.zip");
    expect(data.url).toBe("https://blob.vercel-storage.com/zip-123.zip");
    expect(data.size).toBe(1024000);
  });

  it("returns generating status with progress", async () => {
    vi.mocked((db.project.findFirst as any) as any).mockResolvedValue({ id: mockProjectId });
    vi.mocked(runs.retrieve).mockResolvedValue({
      id: "run-123",
      status: "EXECUTING",
      metadata: { progress: 45 },
    } as any);

    const request = new NextRequest(
      "http://localhost:3000/api/projects/project-1/download?runId=run-123",
      { method: "GET" }
    );
    const params = Promise.resolve({ projectId: mockProjectId });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("generating");
    expect(data.progress).toBe(45);
  });

  it("returns failed status when run fails", async () => {
    vi.mocked((db.project.findFirst as any) as any).mockResolvedValue({ id: mockProjectId });
    vi.mocked(runs.retrieve).mockResolvedValue({
      id: "run-123",
      status: "FAILED",
    } as any);

    const request = new NextRequest(
      "http://localhost:3000/api/projects/project-1/download?runId=run-123",
      { method: "GET" }
    );
    const params = Promise.resolve({ projectId: mockProjectId });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("failed");
    expect(data.error).toBe("Generation failed");
  });
});
