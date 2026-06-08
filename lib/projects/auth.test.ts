import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireProjectOwner, requireProjectMember, ProjectAuthError } from "./auth";
import { db } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  db: {
    project: {
      findFirst: vi.fn(),
    },
  },
}));

describe("Project Auth Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requireProjectOwner", () => {
    it("returns project when ownership matches", async () => {
      vi.mocked(db.project.findFirst).mockResolvedValue({ id: "proj_123" } as never);

      const result = await requireProjectOwner("proj_123", "user_456");

      expect(result).toEqual({ id: "proj_123" });
      expect(db.project.findFirst).toHaveBeenCalledWith({
        where: { id: "proj_123", userId: "user_456" },
        select: { id: true },
      });
    });

    it("throws ProjectAuthError when project does not exist or not owned", async () => {
      vi.mocked(db.project.findFirst).mockResolvedValue(null);

      await expect(requireProjectOwner("proj_123", "user_456")).rejects.toThrow(ProjectAuthError);
    });
  });

  describe("requireProjectMember", () => {
    it("aliases requireProjectOwner for now", async () => {
      vi.mocked(db.project.findFirst).mockResolvedValue({ id: "proj_123" } as never);

      const result = await requireProjectMember("proj_123", "user_456");

      expect(result).toEqual({ id: "proj_123" });
      expect(db.project.findFirst).toHaveBeenCalledWith({
        where: { id: "proj_123", userId: "user_456" },
        select: { id: true },
      });
    });
  });
});
