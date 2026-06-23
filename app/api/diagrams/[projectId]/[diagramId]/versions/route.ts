import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/require-auth";
import { requireProjectMember, ProjectAuthError } from "@/lib/auth/project-access";
import { listDiagramVersions, restoreDiagramVersion, VersioningError } from "@/lib/diagrams/versioning";
import { z } from "zod";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; diagramId: string }> }
) {
  try {
    const { projectId, diagramId } = await params;
    const user = await requireAuth();
    await requireProjectMember(projectId, user.id);

    const versions = await listDiagramVersions(projectId, diagramId);
    return NextResponse.json(versions, { status: 200 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof ProjectAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof VersioningError) {
      return NextResponse.json({ error: err.message }, { status: err.message.includes("not found") ? 404 : 400 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

const restoreSchema = z.object({
  versionId: z.string(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; diagramId: string }> }
) {
  try {
    const { projectId, diagramId } = await params;
    const user = await requireAuth();
    await requireProjectMember(projectId, user.id);

    const body = await req.json();
    const parsed = restoreSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const updatedDiagram = await restoreDiagramVersion(
      projectId,
      diagramId,
      parsed.data.versionId
    );

    return NextResponse.json(updatedDiagram, { status: 200 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof ProjectAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof VersioningError) {
      return NextResponse.json({ error: err.message }, { status: err.message.includes("not found") ? 404 : 400 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
