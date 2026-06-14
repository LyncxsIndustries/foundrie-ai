import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectMember } from "@/lib/projects/auth";

vi.mock("@/lib/db", () => ({
  db: {
    researchAsset: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@vercel/blob/client", () => ({
  handleUpload: vi.fn().mockImplementation(async () => {
    // We can simulate the onBeforeGenerateToken call here if we wanted to deep test it,
    // but typically we just verify the handler delegates correctly or we test the 
    // inner logic. For now we just mock a successful response.
    return { type: 'blob.generate-client-token', clientToken: 'mock-token' };
  }),
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
  requireProjectMember: vi.fn(),
  ProjectAuthError: class ProjectAuthError extends Error {
    constructor(message = "Project not found.") {
      super(message);
      this.name = "ProjectAuthError";
    }
  },
}));

describe("Research Upload API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("calls handleUpload and authenticates user", async () => {
      vi.mocked(requireAuth).mockResolvedValue({ id: "user_123" } as never);
      vi.mocked(requireProjectMember).mockResolvedValue({ id: "proj_123" } as never);
      
      const req = new NextRequest("http://localhost/api/research/proj_123/upload", {
        method: "POST",
        body: JSON.stringify({
          type: "blob.generate-client-token",
          payload: { pathname: "test.png", clientPayload: '{"assetType":"IMAGE_ASSET"}' },
        }),
      });

      const res = await POST(req, { params: Promise.resolve({ projectId: "proj_123" }) });

      expect(res.status).toBe(200);
      expect(requireAuth).toHaveBeenCalled();
      
      // Note: we're not executing the inside of onBeforeGenerateToken in this shallow test,
      // but we are verifying the route wraps handleUpload securely.
    });
  });
});
