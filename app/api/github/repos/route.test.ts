import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/require-auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: "user_1" }),
}));

vi.mock("@/lib/auth/project-access", () => ({
  requireProjectMember: vi.fn().mockResolvedValue({ id: "proj_1", role: "OWNER" }),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn().mockResolvedValue({ githubInstallationId: 123 }),
    },
  },
}));

vi.mock("@/lib/github/app-client", () => ({
  listAuthorizedRepos: vi.fn().mockResolvedValue([{ id: 1, full_name: "test/repo" }]),
  getRepoMetadata: vi.fn().mockResolvedValue({ access: "full" }),
  readRepoFile: vi.fn().mockResolvedValue({ content: "test content" }),
}));

import { GET, POST } from "./route";

describe("GitHub Repos Routes", () => {
  describe("GET /api/github/repos", () => {
    it("should return list of authorized repos", async () => {
      const req = new NextRequest("http://localhost/api/github/repos");
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.repos).toHaveLength(1);
    });
  });

  describe("POST /api/github/repos", () => {
    it("should read a repo file", async () => {
      const req = new NextRequest("http://localhost/api/github/repos", {
        method: "POST",
        body: JSON.stringify({
          projectId: "proj_1",
          owner: "test",
          repo: "repo",
          path: "README.md",
        }),
      });
      const res = await POST(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.content).toBe("test content");
    });

    it("should return 400 for invalid payload", async () => {
      const req = new NextRequest("http://localhost/api/github/repos", {
        method: "POST",
        body: JSON.stringify({
          owner: "test", // Missing projectId
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });
});
