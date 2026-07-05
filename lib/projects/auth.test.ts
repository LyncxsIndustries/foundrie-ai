import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProjectMemberRole } from "@/lib/generated/prisma/client";
import { requireProjectOwner, requireProjectMember, ProjectAuthError } from "./auth";
import { db } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  db: {
    project: {
      findFirst: vi.fn(),
    },
    projectMember: {
      findUnique: vi.fn(),
    },
  },
}));

describe("Project Auth Helpers (re-exports)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requireProjectOwner", () => {
    it("returns project when ownership matches", async () => {
      vi.mocked((db.project.findFirst as any) as any).mockResolvedValue({ id: "proj_123" } as never);

      const result = await requireProjectOwner("proj_123", "user_456");

      expect(result).toEqual({ id: "proj_123" });
    });

    it("throws ProjectAuthError when project does not exist or not owned", async () => {
      vi.mocked((db.project.findFirst as any) as any).mockResolvedValue(null);

      await expect(requireProjectOwner("proj_123", "user_456")).rejects.toThrow(
        ProjectAuthError,
      );
    });
  });

  describe("requireProjectMember", () => {
    it("returns owner role for project creator", async () => {
      vi.mocked((db.project.findFirst as any) as any).mockResolvedValue({
        id: "proj_123",
        userId: "user_456",
        members: [],
      } as never);

      const result = await requireProjectMember("proj_123", "user_456");

      expect(result).toEqual({
        id: "proj_123",
        role: ProjectMemberRole.OWNER,
      });
    });
  });
});
