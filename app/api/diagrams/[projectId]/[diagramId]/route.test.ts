import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH } from "./route";
import { DiagramStatus } from "@/lib/generated/prisma/client";

vi.mock("@/lib/auth/require-auth");
vi.mock("@/lib/projects/auth");
vi.mock("@/lib/diagrams/storage");
vi.mock("@/lib/db", () => ({
  db: {
    diagram: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

describe("GET /api/diagrams/[projectId]/[diagramId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { requireAuth, AuthError } = await import("@/lib/auth/require-auth");
    vi.mocked(requireAuth).mockRejectedValue(new AuthError("Unauthorized"));

    const req = new Request("http://localhost/api/diagrams/proj-1/diag-1");
    const params = Promise.resolve({ projectId: "proj-1", diagramId: "diag-1" });
    const res = await GET(req as never, { params });

    expect(res.status).toBe(401);
  });

  it("returns 404 when project access denied", async () => {
    const { requireAuth } = await import("@/lib/auth/require-auth");
    const { requireProjectMember, ProjectAuthError } = await import(
      "@/lib/projects/auth"
    );
    vi.mocked(requireAuth).mockResolvedValue({
      id: "user-1",
      clerkId: "clerk-1",
      email: "test@example.com",
      plan: "FREE",
      role: "USER",
    });
    vi.mocked(requireProjectMember).mockRejectedValue(
      new ProjectAuthError("Not a member"),
    );

    const req = new Request("http://localhost/api/diagrams/proj-1/diag-1");
    const params = Promise.resolve({ projectId: "proj-1", diagramId: "diag-1" });
    const res = await GET(req as never, { params });

    expect(res.status).toBe(404);
  });

  it("returns diagram data when authorized", async () => {
    const { requireAuth } = await import("@/lib/auth/require-auth");
    const { requireProjectMember } = await import("@/lib/projects/auth");
    const { getDiagramWithData } = await import("@/lib/diagrams/storage");
    vi.mocked(requireAuth).mockResolvedValue({
      id: "user-1",
      clerkId: "clerk-1",
      email: "test@example.com",
      plan: "FREE",
      role: "USER",
    });
    vi.mocked(requireProjectMember).mockResolvedValue();
    vi.mocked(getDiagramWithData).mockResolvedValue({
      id: "diag-1",
      projectId: "proj-1",
      diagramTypeId: "system-context",
      category: "structural",
      name: "System Context",
      status: DiagramStatus.DONE,
      version: 1,
      reactFlowData: { nodes: [], edges: [] },
      pngStorageUrl: "https://blob.vercel-storage.com/test.png",
      errorMessage: null,
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = new Request("http://localhost/api/diagrams/proj-1/diag-1");
    const params = Promise.resolve({ projectId: "proj-1", diagramId: "diag-1" });
    const res = await GET(req as never, { params });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("diag-1");
  });
});

describe("PATCH /api/diagrams/[projectId]/[diagramId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { requireAuth, AuthError } = await import("@/lib/auth/require-auth");
    vi.mocked(requireAuth).mockRejectedValue(new AuthError("Unauthorized"));

    const req = new Request("http://localhost/api/diagrams/proj-1/diag-1", {
      method: "PATCH",
      body: JSON.stringify({ status: DiagramStatus.DONE }),
    });
    const params = Promise.resolve({ projectId: "proj-1", diagramId: "diag-1" });
    const res = await PATCH(req as never, { params });

    expect(res.status).toBe(401);
  });

  it("returns 404 when diagram not found", async () => {
    const { requireAuth } = await import("@/lib/auth/require-auth");
    const { requireProjectMember } = await import("@/lib/projects/auth");
    const { db } = await import("@/lib/db");
    vi.mocked(requireAuth).mockResolvedValue({
      id: "user-1",
      clerkId: "clerk-1",
      email: "test@example.com",
      plan: "FREE",
      role: "USER",
    });
    vi.mocked(requireProjectMember).mockResolvedValue();
    vi.mocked(db.diagram.findUnique).mockResolvedValue(null);

    const req = new Request("http://localhost/api/diagrams/proj-1/diag-1", {
      method: "PATCH",
      body: JSON.stringify({ status: DiagramStatus.DONE }),
    });
    const params = Promise.resolve({ projectId: "proj-1", diagramId: "diag-1" });
    const res = await PATCH(req as never, { params });

    expect(res.status).toBe(404);
  });

  it("updates diagram when authorized", async () => {
    const { requireAuth } = await import("@/lib/auth/require-auth");
    const { requireProjectMember } = await import("@/lib/projects/auth");
    const { getDiagramWithData } = await import("@/lib/diagrams/storage");
    const { db } = await import("@/lib/db");
    vi.mocked(requireAuth).mockResolvedValue({
      id: "user-1",
      clerkId: "clerk-1",
      email: "test@example.com",
      plan: "FREE",
      role: "USER",
    });
    vi.mocked(requireProjectMember).mockResolvedValue();
    vi.mocked(db.diagram.findUnique).mockResolvedValue({
      projectId: "proj-1",
    } as never);
    vi.mocked(db.diagram.updateMany).mockResolvedValue({ count: 1 } as never);
    vi.mocked(getDiagramWithData).mockResolvedValue({
      id: "diag-1",
      projectId: "proj-1",
      diagramTypeId: "system-context",
      category: "structural",
      name: "System Context",
      status: DiagramStatus.DONE,
      version: 1,
      reactFlowData: { nodes: [], edges: [] },
      pngStorageUrl: null,
      errorMessage: null,
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = new Request("http://localhost/api/diagrams/proj-1/diag-1", {
      method: "PATCH",
      body: JSON.stringify({ status: DiagramStatus.DONE }),
    });
    const params = Promise.resolve({ projectId: "proj-1", diagramId: "diag-1" });
    const res = await PATCH(req as never, { params });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("diag-1");
  });
});
