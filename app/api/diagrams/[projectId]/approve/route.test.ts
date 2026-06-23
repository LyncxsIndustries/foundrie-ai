import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth/require-auth";
import { requireProjectMember, ProjectAuthError } from "@/lib/auth/project-access";

vi.mock("@/lib/db", () => ({
  db: {
    diagram: {
      findMany: vi.fn(),
    },
    executionPlan: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/require-auth", () => ({
  requireAuth: vi.fn(),
  AuthError: class AuthError extends Error {
    readonly status = 401;
    constructor(msg = "Authentication required.") {
      super(msg);
      this.name = "AuthError";
    }
  },
}));

vi.mock("@/lib/auth/project-access", () => ({
  requireProjectMember: vi.fn(),
  ProjectAuthError: class ProjectAuthError extends Error {
    readonly status: number;
    constructor(msg = "Project not found.", status = 404) {
      super(msg);
      this.name = "ProjectAuthError";
      this.status = status;
    }
  },
}));

describe("/api/diagrams/[projectId]/approve", () => {
  const projectId = "test-project-id";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue({ id: "user-id" } as any);
    vi.mocked(requireProjectMember).mockResolvedValue({ id: projectId, role: "OWNER" } as any);
  });

  it("returns 201 with approval record on success", async () => {
    const diagrams = [
      { id: "d1", name: "System Context", version: 1, status: "DONE" },
    ];
    vi.mocked(db.diagram.findMany).mockResolvedValue(diagrams as any);

    const mockPlan = { id: "plan-1", status: "APPROVED", taskType: "ARCHITECTURE_APPROVAL" };
    vi.mocked(db.executionPlan.create).mockResolvedValue(mockPlan as any);

    const req = new NextRequest(`http://localhost/api/diagrams/${projectId}/approve`, {
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ projectId }) });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.taskType).toBe("ARCHITECTURE_APPROVAL");
  });

  it("returns 400 when no diagrams are found", async () => {
    vi.mocked(db.diagram.findMany).mockResolvedValue([] as any);

    const req = new NextRequest(`http://localhost/api/diagrams/${projectId}/approve`, {
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ projectId }) });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("No diagrams found for approval");
  });

  it("returns 400 when not all diagrams are DONE", async () => {
    const diagrams = [
      { id: "d1", name: "System Context", version: 1, status: "DONE" },
      { id: "d2", name: "Container", version: 1, status: "GENERATING" },
    ];
    vi.mocked(db.diagram.findMany).mockResolvedValue(diagrams as any);

    const req = new NextRequest(`http://localhost/api/diagrams/${projectId}/approve`, {
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ projectId }) });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("All diagrams must be in DONE status to approve");
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new AuthError());

    const req = new NextRequest(`http://localhost/api/diagrams/${projectId}/approve`, {
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ projectId }) });

    expect(res.status).toBe(401);
  });

  it("returns 404 when user is not a project member", async () => {
    vi.mocked(requireProjectMember).mockRejectedValue(new ProjectAuthError());

    const req = new NextRequest(`http://localhost/api/diagrams/${projectId}/approve`, {
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ projectId }) });

    expect(res.status).toBe(404);
  });
});
