// Dashboard project list query (Feature 06).
// Server-side read used by the dashboard surface. Mirrors the Feature 04 list
// route exactly: ownership-scoped, cursor-paginated, `select`-only with the
// denormalized counters, and ordered by the [userId, updatedAt] index. Heavy
// child collections (diagrams, specs, conversation JSON) are never loaded here.
import { db } from "@/lib/db";

export const DASHBOARD_PROJECT_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  status: true,
  diagramCount: true,
  completedDiagramCount: true,
  featureSpecCount: true,
  updatedAt: true,
  createdAt: true,
} as const;

export const DASHBOARD_PAGE_SIZE = 24;

export type DashboardProject = Awaited<
  ReturnType<typeof listDashboardProjects>
>["projects"][number];

interface ListDashboardProjectsArgs {
  userId: string;
  cursor?: string;
  limit?: number;
}

/**
 * Fetch the first page of a user's projects for the dashboard. Returns the page
 * plus `nextCursor` (null when there is no further page). Fetches one extra row
 * to detect the next page without a separate count query.
 */
export async function listDashboardProjects({
  userId,
  cursor,
  limit = DASHBOARD_PAGE_SIZE,
}: ListDashboardProjectsArgs) {
  const rows = await db.project.findMany({
    where: { userId },
    select: DASHBOARD_PROJECT_SELECT,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > limit;
  const projects = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? projects[projects.length - 1].id : null;

  return { projects, nextCursor };
}
