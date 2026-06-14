import { NextResponse, type NextRequest } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/require-auth";
import { requireProjectMember, ProjectAuthError } from "@/lib/projects/auth";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ projectId: string }> };

function notFound(): Response {
  return NextResponse.json({ error: "Project not found." }, { status: 404 });
}

function unauthorized(message: string): Response {
  return NextResponse.json({ error: message }, { status: 401 });
}

export async function POST(
  _req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const user = await requireAuth();
    const { projectId } = await params;

    await requireProjectMember(projectId, user.id);

    const result = await db.project.updateMany({
      where: { id: projectId },
      data: {
        lastZipUrl: null,
        lastZipFileName: null,
        lastZipGeneratedAt: null,
      },
    });

    if (result.count === 0) {
      return notFound();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ProjectAuthError) {
      return notFound();
    }
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    throw error;
  }
}
