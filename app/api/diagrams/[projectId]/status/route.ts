import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectMember } from "@/lib/projects/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await requireAuth();
    const { projectId } = await params;

    await requireProjectMember(projectId, user.id);

    const diagrams = await db.diagram.findMany({
      where: { projectId },
      select: {
        id: true,
        diagramTypeId: true,
        category: true,
        name: true,
        status: true,
        orderInCategory: true,
        errorMessage: true,
        startedAt: true,
        completedAt: true,
      },
      orderBy: [{ category: "asc" }, { orderInCategory: "asc" }],
    });

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { status: true, completedDiagramCount: true, diagramCount: true },
    });

    return NextResponse.json({
      diagrams,
      projectStatus: project?.status,
      completedCount: project?.completedDiagramCount || 0,
      totalCount: project?.diagramCount || 0,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch diagram status" },
      { status: 500 }
    );
  }
}
