import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, DELETE } from "./route";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectMember } from "@/lib/auth/project-access";
import * as checkpoint from "@/lib/session/checkpoint";

vi.mock("@/lib/auth/require-auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/auth/project-access", () => ({
  requireProjectMember: vi.fn(),
}));

vi.mock("@/lib/session/checkpoint", () => ({
  getSessionCheckpoint: vi.fn(),
  discardSession: vi.fn(),
}));

describe("Session API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 if unauthenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValueOnce({ status: 401 });
      const req = new NextRequest("http://localhost/api/projects/proj_1/session");
      const res = await GET(req, { params: Promise.resolve({ projectId: "proj_1" }) });
      expect(res.status).toBe(401);
    });

    it("returns 200 with checkpoint", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({ id: "user_1" } as any);
      vi.mocked(requireProjectMember).mockResolvedValueOnce({} as any);
      vi.mocked(checkpoint.getSessionCheckpoint).mockResolvedValueOnce({
        hasUnfinishedSession: true,
        resumeUrl: "/projects/proj_1/discovery",
        checkpointSummary: "Unfinished discovery chat (2 messages)",
        phase: "DISCOVERY",
        lastActivityAt: null,
      });

      const req = new NextRequest("http://localhost/api/projects/proj_1/session");
      const res = await GET(req, { params: Promise.resolve({ projectId: "proj_1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.hasUnfinishedSession).toBe(true);
      expect(data.resumeUrl).toBe("/projects/proj_1/discovery");
    });
  });

  describe("DELETE", () => {
    it("returns 204 after discarding", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({ id: "user_1" } as any);
      vi.mocked(requireProjectMember).mockResolvedValueOnce({} as any);
      vi.mocked(checkpoint.discardSession).mockResolvedValueOnce();

      const req = new NextRequest("http://localhost/api/projects/proj_1/session");
      const res = await DELETE(req, { params: Promise.resolve({ projectId: "proj_1" }) });
      expect(res.status).toBe(204);
      expect(checkpoint.discardSession).toHaveBeenCalledWith("proj_1");
    });
  });
});
