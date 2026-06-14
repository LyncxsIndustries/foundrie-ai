import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAuth, AuthError } from "@/lib/auth/require-auth";
import { requireProjectMember, ProjectAuthError } from "@/lib/projects/auth";
import { db } from "@/lib/db";

const createDocumentSchema = z.object({
  sourceType: z.string().trim().min(1).max(50),
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1),
});

type RouteContext = { params: Promise<{ projectId: string }> };

function unauthorized(message: string): Response {
  return NextResponse.json({ error: message }, { status: 401 });
}

function notFound(): Response {
  return NextResponse.json({ error: "Project not found." }, { status: 404 });
}

export async function GET(
  _req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const user = await requireAuth();
    const { projectId } = await params;

    await requireProjectMember(projectId, user.id);

    const [assets, documents] = await Promise.all([
      db.researchAsset.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
      }),
      db.researchDocument.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ assets, documents });
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    if (error instanceof ProjectAuthError) {
      return notFound();
    }
    throw error;
  }
}

export async function POST(
  req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const user = await requireAuth();
    const { projectId } = await params;

    await requireProjectMember(projectId, user.id);

    const body = await req.json().catch(() => null);
    const parsed = createDocumentSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid research document payload." },
        { status: 400 },
      );
    }

    const document = await db.researchDocument.create({
      data: {
        projectId,
        sourceType: parsed.data.sourceType,
        title: parsed.data.title,
        content: parsed.data.content,
      },
    });

    return NextResponse.json({ document });
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    if (error instanceof ProjectAuthError) {
      return notFound();
    }
    throw error;
  }
}
