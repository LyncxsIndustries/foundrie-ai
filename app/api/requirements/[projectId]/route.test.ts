import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH } from "./route";

vi.mock("@/lib/auth/require-auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: "user-1" }),
  AuthError: class AuthError extends Error {},
}));

vi.mock("@/lib/projects/auth", () => ({
  requireProjectMember: vi.fn(),
  ProjectAuthError: class ProjectAuthError extends Error {},
}));

vi.mock("@/lib/db", () => ({
  db: {
    requirements: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

const { requireAuth } = await import("@/lib/auth/require-auth");
const { requireProjectMember, ProjectAuthError } = await import("@/lib/projects/auth");
const { db } = await import("@/lib/db");

describe("GET /api/requirements/[projectId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireProjectMember).mockResolvedValue(undefined);
  });

  it("returns requirements when user owns project", async () => {
    const mockRequirements = {
      id: "req-1",
      content: { functional: ["Requirement 1"] },
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-02"),
    };

    vi.mocked(db.requirements.findFirst).mockResolvedValue(mockRequirements);

    const req = new NextRequest("http://localhost/api/requirements/proj-1");
    const res = await GET(req, {
      params: Promise.resolve({ projectId: "proj-1" }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe("req-1");
    expect(db.requirements.findFirst).toHaveBeenCalledWith({
      where: {
        projectId: "proj-1",
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  it("returns 404 when requirements not found or not owned", async () => {
    vi.mocked(requireProjectMember).mockRejectedValue(new ProjectAuthError("Not found"));
    vi.mocked(db.requirements.findFirst).mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/requirements/proj-1");
    const res = await GET(req, {
      params: Promise.resolve({ projectId: "proj-1" }),
    });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Not found");
  });
});

describe("PATCH /api/requirements/[projectId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireProjectMember).mockResolvedValue(undefined);
  });

  it("updates requirements when user owns project", async () => {
    const updatedContent = { functional: ["Updated requirement"] };
    const mockUpdated = {
      id: "req-1",
      content: updatedContent,
      updatedAt: new Date("2024-01-03"),
    };

    vi.mocked(db.requirements.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(db.requirements.findFirst).mockResolvedValue(mockUpdated);

    const req = new NextRequest("http://localhost/api/requirements/proj-1", {
      method: "PATCH",
      body: JSON.stringify({ content: updatedContent }),
    });

    const res = await PATCH(req, {
      params: Promise.resolve({ projectId: "proj-1" }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe("req-1");
    expect(data.content).toEqual(updatedContent);
    expect(db.requirements.updateMany).toHaveBeenCalledWith({
      where: {
        projectId: "proj-1",
      },
      data: {
        content: updatedContent,
      },
    });
  });

  it("returns 404 when user does not own project", async () => {
    vi.mocked(requireProjectMember).mockRejectedValue(new ProjectAuthError("Not found"));
    vi.mocked(db.requirements.updateMany).mockResolvedValue({ count: 0 });

    const req = new NextRequest("http://localhost/api/requirements/proj-1", {
      method: "PATCH",
      body: JSON.stringify({ content: { functional: ["Test"] } }),
    });

    const res = await PATCH(req, {
      params: Promise.resolve({ projectId: "proj-1" }),
    });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Not found");
  });
});
