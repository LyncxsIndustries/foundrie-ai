import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  db: {
    project: {
      findMany,
    },
  },
}));

import {
  DASHBOARD_PAGE_SIZE,
  DASHBOARD_PROJECT_SELECT,
  listDashboardProjects,
} from "./list";

describe("listDashboardProjects", () => {
  beforeEach(() => {
    findMany.mockReset();
    findMany.mockResolvedValue([]);
  });

  it("uses a deterministic cursor-paginated dashboard query", async () => {
    await listDashboardProjects({ userId: "user_123", cursor: "project_1" });

    expect(findMany).toHaveBeenCalledWith({
      where: { userId: "user_123" },
      select: DASHBOARD_PROJECT_SELECT,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: DASHBOARD_PAGE_SIZE + 1,
      cursor: { id: "project_1" },
      skip: 1,
    });
  });

  it("returns a next cursor when the query fetches an extra row", async () => {
    findMany.mockResolvedValue([
      { id: "project_3" },
      { id: "project_2" },
      { id: "project_1" },
    ]);

    const result = await listDashboardProjects({
      userId: "user_123",
      limit: 2,
    });

    expect(result.projects).toEqual([{ id: "project_3" }, { id: "project_2" }]);
    expect(result.nextCursor).toBe("project_2");
  });
});
