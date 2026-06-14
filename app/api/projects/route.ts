// Project collection API (Feature 04).
// GET lists the authenticated user's projects (cursor-paginated, denormalized
// counters only, ordered by the [userId, updatedAt] index). POST creates a
// project after the plan gate, with the owner derived from the session — never
// from request input.
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { canCreateProject } from "@/lib/auth/plan-limits";
import { requireAuth, AuthError } from "@/lib/auth/require-auth";
import { db } from "@/lib/db";
import { buildProjectSlug } from "@/lib/projects/slug";

// Dashboard list shape: counters are denormalized on Project (Feature 03), so we
// never count diagrams/specs per row. Large JSON columns are excluded.
const PROJECT_LIST_SELECT = {
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

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

const listQuerySchema = z.object({
  ownedCursor: z.string().min(1).optional(),
  sharedCursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).optional(),
});

const createProjectSchema = z.object({
  // The raw idea seeds the project; name is optional and defaults server-side.
  name: z.string().trim().max(200).optional(),
  description: z.string().trim().max(2000).optional(),
});

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const user = await requireAuth();

    const parsed = listQuerySchema.safeParse(
      Object.fromEntries(req.nextUrl.searchParams),
    );
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters." },
        { status: 400 },
      );
    }

    const limit = parsed.data.limit ?? DEFAULT_PAGE_SIZE;
    const { ownedCursor, sharedCursor } = parsed.data;

    const [ownedRows, sharedRows] = await Promise.all([
      db.project.findMany({
        where: { userId: user.id },
        select: PROJECT_LIST_SELECT,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        ...(ownedCursor ? { cursor: { id: ownedCursor }, skip: 1 } : {}),
      }),
      db.project.findMany({
        where: {
          members: {
            some: {
              userId: user.id,
              role: "COLLABORATOR",
            },
          },
        },
        select: {
          ...PROJECT_LIST_SELECT,
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
        ownerName: user.name || user.email,
      };
    });

    return NextResponse.json({ owned, nextOwnedCursor, shared, nextSharedCursor });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const user = await requireAuth();

    const body = await req.json().catch(() => null);
    const parsed = createProjectSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid project payload." },
        { status: 400 },
      );
    }

    // Plan gate is enforced atomically inside the transaction below to avoid a
    // TOCTOU race; do not pre-count here.
    const name = parsed.data.name?.length
      ? parsed.data.name
      : "Untitled Project";

    // Enforce the plan limit and create atomically. Counting outside a
    // transaction is a TOCTOU race: two concurrent POSTs could both pass the
    // gate and exceed the cap. Locking the user row (SELECT ... FOR UPDATE)
    // serializes a user's concurrent creates so the count reflects committed
    // rows before the gate decision.
    const project = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${user.id} FOR UPDATE`;

      const currentProjectCount = await tx.project.count({
        where: { userId: user.id },
      });
      if (!canCreateProject(user.plan, currentProjectCount)) {
        return null;
      }

      // Use the schema's cuid id strategy (no sequential ids). The slug embeds
      // a suffix from the generated id, so create first, then persist the slug.
      const created = await tx.project.create({
        data: {
          userId: user.id,
          name,
          slug: "",
          description: parsed.data.description || null,
        },
        select: { id: true },
      });

      return tx.project.update({
        where: { id: created.id, userId: user.id },
        data: { slug: buildProjectSlug(name, created.id) },
        select: PROJECT_LIST_SELECT,
      });
    });

    if (!project) {
      return NextResponse.json(
        {
          error: "Project limit reached for your plan.",
          upgradeRequired: true,
        },
        { status: 403 },
      );
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }
}
