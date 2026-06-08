// Single-project API (Feature 04).
// Every read and mutation is scoped to the authenticated user's id. Ownership
// failures return 404 (not 403) so the API never confirms that another user's
// project exists. projectId comes from the route; userId comes only from the
// session.
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAuth, AuthError } from "@/lib/auth/require-auth";
import { db } from "@/lib/db";

const PROJECT_DETAIL_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  status: true,
  diagramCount: true,
  completedDiagramCount: true,
  featureSpecCount: true,
  lastZipUrl: true,
  lastZipFileName: true,
  lastZipGeneratedAt: true,
  updatedAt: true,
  createdAt: true,
} as const;

// At least one field must be present; name cannot be blanked to empty.
const updateProjectSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No updatable fields provided.",
  });

type RouteContext = { params: Promise<{ projectId: string }> };

const NOT_FOUND = NextResponse.json(
  { error: "Project not found." },
  { status: 404 },
);

function unauthorized(message: string): Response {
  return NextResponse.json({ error: message }, { status: 401 });
}

export async function GET(
  _req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const user = await requireAuth();
    const { projectId } = await params;

    const project = await db.project.findFirst({
      where: { id: projectId, userId: user.id },
      select: PROJECT_DETAIL_SELECT,
    });

    // findFirst returns null both when the id is unknown and when it belongs to
    // another user; either way the answer is 404.
    if (!project) {
      return NOT_FOUND;
    }

    return NextResponse.json({ project });
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    throw error;
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const user = await requireAuth();
    const { projectId } = await params;

    const body = await req.json().catch(() => null);
    const parsed = updateProjectSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid project payload." },
        { status: 400 },
      );
    }

    // Owner-scoped update: updateMany returns count 0 when the project is not
    // the user's, which we map to 404 rather than leaking existence with a 403.
    const result = await db.project.updateMany({
      where: { id: projectId, userId: user.id },
      data: parsed.data,
    });
    if (result.count === 0) {
      return NOT_FOUND;
    }

    const project = await db.project.findFirst({
      where: { id: projectId, userId: user.id },
      select: PROJECT_DETAIL_SELECT,
    });

    return NextResponse.json({ project });
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    throw error;
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const user = await requireAuth();
    const { projectId } = await params;

    // Scoped delete: cannot remove another user's project; count 0 -> 404.
    const result = await db.project.deleteMany({
      where: { id: projectId, userId: user.id },
    });
    if (result.count === 0) {
      return NOT_FOUND;
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    throw error;
  }
}
