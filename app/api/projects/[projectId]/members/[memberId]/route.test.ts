import { describe, expect, it, vi, beforeEach } from "vitest";
import { DELETE } from "./route";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectMember, ProjectAuthError } from "@/lib/auth/project-access";
import { ProjectMemberRole } from "@/lib/generated/prisma/client";

vi.mock("@/lib/db", () => ({
  db: {
    project: {
      findUnique: vi.fn(),
    },
    projectMember: {
      findFirst: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/require-auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/auth/project-access", () => ({
  requireProjectMember: vi.fn(),
  ProjectAuthError: class ProjectAuthError extends Error {
    status = 404;
    constructor() {
      super("Project not found.");
      this.name = "ProjectAuthError";
    }
  },
}));

describe("DELETE /api/projects/[projectId]/members/[memberId]", () => {
  const projectId = "test-project-id";
  const authUserId = "user-id-actor";
  const ownerUserId = "user-id-owner";
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue({ id: authUserId } as any);
    vi.mocked(requireProjectMember).mockResolvedValue({ id: projectId, role: ProjectMemberRole.OWNER } as any);
    vi.mocked(db.project.findUnique).mockResolvedValue({ userId: ownerUserId } as any);
    vi.mocked(db.projectMember.findFirst).mockResolvedValue({ userId: "some-other-user" } as any);
  });

  function createRequest(memberId: string) {
    return new NextRequest(`http://localhost/api/projects/${projectId}/members/${memberId}`, {
      method: "DELETE",
    });
  }

  it("returns 401 if unauthenticated", async () => {
    const error = new Error("Unauthorized");
    error.name = "AuthError";
    (error as any).status = 401;
    vi.mocked(requireAuth).mockRejectedValue(error);

    const req = createRequest("member-123");
    const res = await DELETE(req, { params: Promise.resolve({ projectId, memberId: "member-123" }) });

    expect(res.status).toBe(401);
  });

  it("returns 404 if project is not found during member check", async () => {
    vi.mocked(requireProjectMember).mockRejectedValue(new ProjectAuthError());

    const req = createRequest("member-123");
    const res = await DELETE(req, { params: Promise.resolve({ projectId, memberId: "member-123" }) });

    expect(res.status).toBe(404);
  });

  it("returns 400 if trying to remove the owner", async () => {
    const req = createRequest(ownerUserId);
    const res = await DELETE(req, { params: Promise.resolve({ projectId, memberId: ownerUserId }) });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toBe("Cannot remove the project owner.");
  });

  it("returns 404 if the target member does not exist", async () => {
    vi.mocked(db.projectMember.findFirst).mockResolvedValue(null);

    const req = createRequest("missing-member");
    const res = await DELETE(req, { params: Promise.resolve({ projectId, memberId: "missing-member" }) });

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.message).toBe("Member not found.");
  });

  it("returns 200 when owner removes a collaborator", async () => {
    vi.mocked(requireProjectMember).mockResolvedValue({ id: projectId, role: ProjectMemberRole.OWNER } as any);
    
    const req = createRequest("collab-member");
    const res = await DELETE(req, { params: Promise.resolve({ projectId, memberId: "collab-member" }) });

    expect(res.status).toBe(200);
    expect(db.projectMember.deleteMany).toHaveBeenCalledWith({
      where: { id: "collab-member", projectId },
    });
  });

  it("returns 200 when collaborator removes themselves", async () => {
    vi.mocked(requireProjectMember).mockResolvedValue({ id: projectId, role: ProjectMemberRole.COLLABORATOR } as any);
    vi.mocked(db.projectMember.findFirst).mockResolvedValue({ userId: authUserId } as any);
    
    const req = createRequest("my-member-id");
    const res = await DELETE(req, { params: Promise.resolve({ projectId, memberId: "my-member-id" }) });

    expect(res.status).toBe(200);
    expect(db.projectMember.deleteMany).toHaveBeenCalledWith({
      where: { id: "my-member-id", projectId },
    });
  });

  it("returns 404 when collaborator tries to remove someone else", async () => {
    vi.mocked(requireProjectMember).mockResolvedValue({ id: projectId, role: ProjectMemberRole.COLLABORATOR } as any);
    vi.mocked(db.projectMember.findFirst).mockResolvedValue({ userId: "another-user" } as any);
    
    const req = createRequest("other-member-id");
    const res = await DELETE(req, { params: Promise.resolve({ projectId, memberId: "other-member-id" }) });

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.message).toBe("Non-owners cannot remove other Collaborators.");
    expect(db.projectMember.deleteMany).not.toHaveBeenCalled();
  });
});
