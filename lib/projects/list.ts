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

export type DashboardProject = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: any;
  diagramCount: number;
  completedDiagramCount: number;
  featureSpecCount: number;
  updatedAt: Date;
  createdAt: Date;
  ownerName?: string;
};

interface ListDashboardProjectsArgs {
  userId: string;
  ownedCursor?: string;
  sharedCursor?: string;
  limit?: number;
}

/**
 * Fetch the first page of a user's projects for the dashboard. Returns the page
 * plus `nextCursor` for both owned and shared lists independently. Fetches one 
 * extra row per query to detect the next page without a separate count query.
 */
export async function listDashboardProjects({
  userId,
  ownedCursor,
  sharedCursor,
  limit = DASHBOARD_PAGE_SIZE,
}: ListDashboardProjectsArgs) {
  const [ownedRows, sharedRows] = await Promise.all([
    db.project.findMany({
      where: { userId },
      select: DASHBOARD_PROJECT_SELECT,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(ownedCursor ? { cursor: { id: ownedCursor }, skip: 1 } : {}),
    }),
    db.project.findMany({
      where: {
        members: {
          some: {
            userId,
            role: "COLLABORATOR",
          },
        },
      },
      select: {
        ...DASHBOARD_PROJECT_SELECT,
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(sharedCursor ? { cursor: { id: sharedCursor }, skip: 1 } : {}),
    }),
  ]);

  const ownedHasMore = ownedRows.length > limit;
  const owned = ownedHasMore ? ownedRows.slice(0, limit) : ownedRows;
  const nextOwnedCursor = ownedHasMore ? owned[owned.length - 1].id : null;

  const sharedHasMore = sharedRows.length > limit;
  const sharedRaw = sharedHasMore ? sharedRows.slice(0, limit) : sharedRows;
  const nextSharedCursor = sharedHasMore ? sharedRaw[sharedRaw.length - 1].id : null;

  const shared = sharedRaw.map((p) => {
    const { user, ...projectData } = p;
    return {
      ...projectData,
      ownerName: user?.name || user?.email || "Unknown User",
    };
  });

  return { owned, nextOwnedCursor, shared, nextSharedCursor };
}
