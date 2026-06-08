import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectOwner } from "@/lib/projects/auth";

vi.mock("@/lib/db", () => ({
  db: {
    researchAsset: {
      findMany: vi.fn(),
    },
    researchDocument: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/require-auth", () => ({
  requireAuth: vi.fn(),
  AuthError: class AuthError extends Error {
    constructor(message = "Authentication required.") {
      super(message);
      this.name = "AuthError";
    }
  },
}));

vi.mock("@/lib/projects/auth", () => ({
  requireProjectOwner: vi.fn(),
  ProjectAuthError: class ProjectAuthError extends Error {
    constructor(message = "Project not found.") {
      super(message);
      this.name = "ProjectAuthError";
    }
  },
}));

describe("Research Assets API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns assets and documents for the project", async () => {
      vi.mocked(requireAuth).mockResolvedValue({ id: "user_123" } as never);
      vi.mocked(requireProjectOwner).mockResolvedValue({ id: "proj_123" } as never);
      
      const mockAssets = [{ id: "asset_1" }];
      const mockDocs = [{ id: "doc_1" }];
      vi.mocked(db.researchAsset.findMany).mockResolvedValue(mockAssets as never);
      vi.mocked(db.researchDocument.findMany).mockResolvedValue(mockDocs as never);

      const req = new NextRequest("http://localhost/api/research/proj_123/assets");
      const res = await GET(req, { params: Promise.resolve({ projectId: "proj_123" }) });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ assets: mockAssets, documents: mockDocs });
      
      expect(requireProjectOwner).toHaveBeenCalledWith("proj_123", "user_123");
    });
  });

  describe("POST", () => {
    it("creates a document when given valid payload", async () => {
      vi.mocked(requireAuth).mockResolvedValue({ id: "user_123" } as never);
      vi.mocked(requireProjectOwner).mockResolvedValue({ id: "proj_123" } as never);
      
      const mockDoc = { id: "doc_1", title: "Test Note" };
      vi.mocked(db.researchDocument.create).mockResolvedValue(mockDoc as never);

      const req = new NextRequest("http://localhost/api/research/proj_123/assets", {
        method: "POST",
        body: JSON.stringify({
          sourceType: "USER_NOTE",
          title: "Test Note",
          content: "This is some test content",
        }),
      });

      const res = await POST(req, { params: Promise.resolve({ projectId: "proj_123" }) });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ document: mockDoc });
      expect(db.researchDocument.create).toHaveBeenCalledWith({
        data: {
          projectId: "proj_123",
          sourceType: "USER_NOTE",
          title: "Test Note",
          content: "This is some test content",
        },
      });
    });

    it("returns 400 for invalid payload", async () => {
      vi.mocked(requireAuth).mockResolvedValue({ id: "user_123" } as never);
      vi.mocked(requireProjectOwner).mockResolvedValue({ id: "proj_123" } as never);
      
      const req = new NextRequest("http://localhost/api/research/proj_123/assets", {
        method: "POST",
        body: JSON.stringify({}), // empty payload
      });

      const res = await POST(req, { params: Promise.resolve({ projectId: "proj_123" }) });

      expect(res.status).toBe(400);
    });
  });
});
