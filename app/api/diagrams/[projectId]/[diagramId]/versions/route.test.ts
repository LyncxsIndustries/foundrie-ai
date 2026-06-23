import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { NextRequest } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/require-auth";
import { requireProjectMember, ProjectAuthError } from "@/lib/auth/project-access";
import * as versioning from "@/lib/diagrams/versioning";

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

vi.mock("@/lib/diagrams/versioning", () => ({
  listDiagramVersions: vi.fn(),
  restoreDiagramVersion: vi.fn(),
  VersioningError: class VersioningError extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "VersioningError";
    }
  },
}));

describe("/api/diagrams/[projectId]/[diagramId]/versions", () => {
  const projectId = "test-project-id";
  const diagramId = "test-diagram-id";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue({ id: "user-id" } as any);
    vi.mocked(requireProjectMember).mockResolvedValue({ id: projectId, role: "OWNER" } as any);
  });

  describe("GET", () => {
    it("returns 200 with version list", async () => {
      const mockVersions = [
        { id: "v1", diagramId, version: 1, pngStorageUrl: null, errorMessage: null, createdAt: "2026-01-01" },
      ];
      vi.mocked(versioning.listDiagramVersions).mockResolvedValue(mockVersions as any);

      const req = new NextRequest(`http://localhost/api/diagrams/${projectId}/${diagramId}/versions`);
      const res = await GET(req, { params: Promise.resolve({ projectId, diagramId }) });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual(mockVersions);
    });

    it("returns 401 when unauthenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new AuthError());

      const req = new NextRequest(`http://localhost/api/diagrams/${projectId}/${diagramId}/versions`);
      const res = await GET(req, { params: Promise.resolve({ projectId, diagramId }) });

      expect(res.status).toBe(401);
    });

    it("returns 404 when user is not a project member", async () => {
      vi.mocked(requireProjectMember).mockRejectedValue(new ProjectAuthError());

      const req = new NextRequest(`http://localhost/api/diagrams/${projectId}/${diagramId}/versions`);
      const res = await GET(req, { params: Promise.resolve({ projectId, diagramId }) });

      expect(res.status).toBe(404);
    });
    
    it("returns 404 when diagram not found", async () => {
      vi.mocked(versioning.listDiagramVersions).mockRejectedValue(new versioning.VersioningError("Diagram not found"));

      const req = new NextRequest(`http://localhost/api/diagrams/${projectId}/${diagramId}/versions`);
      const res = await GET(req, { params: Promise.resolve({ projectId, diagramId }) });

      expect(res.status).toBe(404);
    });
  });

  describe("POST (restore)", () => {
    it("returns 200 on successful restore", async () => {
      const mockDiagram = { id: diagramId, version: 3 };
      vi.mocked(versioning.restoreDiagramVersion).mockResolvedValue(mockDiagram as any);

      const req = new NextRequest(`http://localhost/api/diagrams/${projectId}/${diagramId}/versions`, {
        method: "POST",
        body: JSON.stringify({ versionId: "v1" }),
      });
      const res = await POST(req, { params: Promise.resolve({ projectId, diagramId }) });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe(diagramId);
      expect(versioning.restoreDiagramVersion).toHaveBeenCalledWith(projectId, diagramId, "v1");
    });

    it("returns 400 on invalid body", async () => {
      const req = new NextRequest(`http://localhost/api/diagrams/${projectId}/${diagramId}/versions`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      const res = await POST(req, { params: Promise.resolve({ projectId, diagramId }) });

      expect(res.status).toBe(400);
    });

    it("returns 401 when unauthenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new AuthError());

      const req = new NextRequest(`http://localhost/api/diagrams/${projectId}/${diagramId}/versions`, {
        method: "POST",
        body: JSON.stringify({ versionId: "v1" }),
      });
      const res = await POST(req, { params: Promise.resolve({ projectId, diagramId }) });

      expect(res.status).toBe(401);
    });
    
    it("returns 404 when version not found", async () => {
      vi.mocked(versioning.restoreDiagramVersion).mockRejectedValue(new versioning.VersioningError("Version not found"));

      const req = new NextRequest(`http://localhost/api/diagrams/${projectId}/${diagramId}/versions`, {
        method: "POST",
        body: JSON.stringify({ versionId: "v1" }),
      });
      const res = await POST(req, { params: Promise.resolve({ projectId, diagramId }) });

      expect(res.status).toBe(404);
    });
  });
});
