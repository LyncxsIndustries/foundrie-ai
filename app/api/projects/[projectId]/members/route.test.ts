import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectOwner, ProjectAuthError } from "@/lib/auth/project-access";
import { ProjectMemberRole } from "@/lib/generated/prisma/client";

// Mock the dependencies
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
    projectMember: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/require-auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/auth/project-access", () => ({
  requireProjectOwner: vi.fn(),
  ProjectAuthError: class ProjectAuthError extends Error {
    status = 404;
    constructor() {
      super("Project not found.");
      this.name = "ProjectAuthError";
    }
  },
}));

describe("POST /api/projects/[projectId]/members", () => {
  const projectId = "test-project-id";
  const authUserId = "user-id-owner";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue({ id: authUserId } as any);
    vi.mocked(requireProjectOwner).mockResolvedValue({ id: projectId } as any);
  });

  function createRequest(body: any) {
    return new NextRequest(`http://localhost/api/projects/${projectId}/members`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  it("returns 401 if unauthenticated", async () => {
    const error = new Error("Unauthorized");
    error.name = "AuthError";
    (error as any).status = 401;
    vi.mocked(requireAuth).mockRejectedValue(error);

    const req = createRequest({ email: "test@example.com" });
    const res = await POST(req, { params: Promise.resolve({ projectId }) });

    expect(res.status).toBe(401);
  });

  it("returns 404 if not the project owner", async () => {
    vi.mocked(requireProjectOwner).mockRejectedValue(new ProjectAuthError());

    const req = createRequest({ email: "test@example.com" });
    const res = await POST(req, { params: Promise.resolve({ projectId }) });

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.message).toBe("Project not found.");
  });

  it("returns 400 for invalid email", async () => {
    const req = createRequest({ email: "not-an-email" });
    const res = await POST(req, { params: Promise.resolve({ projectId }) });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toBe("Invalid email address.");
  });

  it("returns 404 if target user is not found by email", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null);

    const req = createRequest({ email: "unknown@example.com" });
    const res = await POST(req, { params: Promise.resolve({ projectId }) });

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.message).toBe("User not found. They must sign up first.");
  });

  it("returns 400 if target user is the owner", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: authUserId } as any);

    const req = createRequest({ email: "owner@example.com" });
    const res = await POST(req, { params: Promise.resolve({ projectId }) });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toBe("Cannot invite yourself.");
  });

  it("returns 409 if membership already exists", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "target-user-id" } as any);
    vi.mocked(db.projectMember.findUnique).mockResolvedValue({ id: "existing-member" } as any);

    const req = createRequest({ email: "member@example.com" });
    const res = await POST(req, { params: Promise.resolve({ projectId }) });

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.message).toBe("User is already a member.");
  });

  it("returns 201 and creates membership on success", async () => {
    const targetUserId = "target-user-id";
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: targetUserId } as any);
    vi.mocked(db.projectMember.findUnique).mockResolvedValue(null);
    vi.mocked(db.projectMember.create).mockResolvedValue({
      id: "new-member-id",
      projectId,
      userId: targetUserId,
      role: ProjectMemberRole.COLLABORATOR,
      invitedByUserId: authUserId,
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = createRequest({ email: "new@example.com" });
    const res = await POST(req, { params: Promise.resolve({ projectId }) });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBe("new-member-id");
    expect(data.role).toBe(ProjectMemberRole.COLLABORATOR);
    expect(db.projectMember.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId,
        userId: targetUserId,
        role: ProjectMemberRole.COLLABORATOR,
        invitedByUserId: authUserId,
      }),
    });
  });
});
