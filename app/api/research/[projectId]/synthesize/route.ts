import { NextResponse, type NextRequest } from "next/server";

import { requireAuth, AuthError } from "@/lib/auth/require-auth";
import { requireProjectOwner, ProjectAuthError } from "@/lib/projects/auth";
import { synthesizeResearch } from "@/lib/research/synthesize-research";

type RouteContext = { params: Promise<{ projectId: string }> };

function unauthorized(message: string): Response {
  return NextResponse.json({ error: message }, { status: 401 });
}

function notFound(): Response {
  return NextResponse.json({ error: "Project not found." }, { status: 404 });
}

/**
 * POST /api/research/[projectId]/synthesize
 *
 * Triggers research synthesis for a project. Gathers all research materials
 * (assets, documents, web sources) and produces or updates the
 * PROJECT_RESEARCH.md document via the AI rotation engine.
 */
export async function POST(
  req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const user = await requireAuth();
    const { projectId } = await params;

    await requireProjectOwner(projectId, user.id);

    const doc = await synthesizeResearch(projectId, user.plan);

    return NextResponse.json({ doc });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    if (error instanceof ProjectAuthError) {
      return notFound();
    }
    return NextResponse.json(
      { error: error.message || "Synthesis failed" },
      { status: 500 },
    );
  }
}
