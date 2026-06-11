import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProjectMemberRole } from "@/lib/generated/prisma/client";

import {
  getProjectRole,
  ProjectAuthError,
  requireProjectMember,
  requireProjectOwner,
} from "./project-access";
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

describe("project-access helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requireProjectOwner", () => {
    it("returns the project when the user is the owner", async () => {
      vi.mocked(db.project.findFirst).mockResolvedValue({ id: "proj_123" } as never);

      const result = await requireProjectOwner("proj_123", "user_owner");

      expect(result).toEqual({ id: "proj_123" });
      expect(db.project.findFirst).toHaveBeenCalledWith({
        where: { id: "proj_123", userId: "user_owner" },
        select: { id: true },
      });
    });

    it("throws ProjectAuthError when the project is not owned", async () => {
      vi.mocked(db.project.findFirst).mockResolvedValue(null);

      await expect(
        requireProjectOwner("proj_123", "user_other"),
      ).rejects.toThrow(ProjectAuthError);
    });
  });

  describe("requireProjectMember", () => {
    it("returns OWNER when the user created the project", async () => {
      vi.mocked(db.project.findFirst).mockResolvedValue({
        id: "proj_123",
        userId: "user_owner",
        members: [],
      } as never);

      const result = await requireProjectMember("proj_123", "user_owner");

      expect(result).toEqual({
        id: "proj_123",
        role: ProjectMemberRole.OWNER,
      });
    });

    it("returns COLLABORATOR when the user has a membership row", async () => {
      vi.mocked(db.project.findFirst).mockResolvedValue({
        id: "proj_123",
        userId: "user_owner",
        members: [{ role: ProjectMemberRole.COLLABORATOR }],
      } as never);

      const result = await requireProjectMember("proj_123", "user_collab");

      expect(result).toEqual({
        id: "proj_123",
        role: ProjectMemberRole.COLLABORATOR,
      });
    });

    it("throws ProjectAuthError when the user is not a member", async () => {
      vi.mocked(db.project.findFirst).mockResolvedValue(null);

      await expect(
        requireProjectMember("proj_123", "user_other"),
      ).rejects.toThrow(ProjectAuthError);
    });
  });

  describe("getProjectRole", () => {
    it("returns OWNER for the project creator", async () => {
      vi.mocked(db.project.findFirst).mockResolvedValue({
        userId: "user_owner",
      } as never);

      const role = await getProjectRole("proj_123", "user_owner");

      expect(role).toBe(ProjectMemberRole.OWNER);
      expect(db.projectMember.findUnique).not.toHaveBeenCalled();
    });

    it("returns COLLABORATOR for an explicit member", async () => {
      vi.mocked(db.project.findFirst).mockResolvedValue({
        userId: "user_owner",
      } as never);
      vi.mocked(db.projectMember.findUnique).mockResolvedValue({
        role: ProjectMemberRole.COLLABORATOR,
      } as never);

      const role = await getProjectRole("proj_123", "user_collab");

      expect(role).toBe(ProjectMemberRole.COLLABORATOR);
    });

    it("returns null when the project does not exist", async () => {
      vi.mocked(db.project.findFirst).mockResolvedValue(null);

      const role = await getProjectRole("proj_missing", "user_other");

      expect(role).toBeNull();
    });

    it("returns null when the user has no access", async () => {
      vi.mocked(db.project.findFirst).mockResolvedValue({
        userId: "user_owner",
      } as never);
      vi.mocked(db.projectMember.findUnique).mockResolvedValue(null);

      const role = await getProjectRole("proj_123", "user_other");

      expect(role).toBeNull();
    });
  });
});
