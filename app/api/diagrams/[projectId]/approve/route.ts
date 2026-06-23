import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth/require-auth";
import { requireProjectMember, ProjectAuthError } from "@/lib/auth/project-access";
import { ExecutionPlanStatus } from "@/lib/generated/prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const user = await requireAuth();
    await requireProjectMember(projectId, user.id);

    // Collect current diagram version snapshot for the approval record
    const diagrams = await db.diagram.findMany({
      where: { projectId },
      select: { id: true, name: true, version: true, status: true },
    });

    if (diagrams.length === 0) {
      return NextResponse.json({ error: "No diagrams found for approval" }, { status: 400 });
    }

    if (!diagrams.every(d => d.status === "DONE")) {
      return NextResponse.json({ error: "All diagrams must be in DONE status to approve" }, { status: 400 });
    }

    const content = JSON.stringify(
      {
        message: "Architecture approved for current diagram versions.",
        diagramVersions: diagrams.map((d) => ({
          diagramId: d.id,
          name: d.name,
          version: d.version,
          status: d.status,
        })),
      },
      null,
      2
    );

    const plan = await db.executionPlan.create({
      data: {
        projectId,
        taskType: "ARCHITECTURE_APPROVAL",
        status: ExecutionPlanStatus.APPROVED,
        content,
        approvedAt: new Date(),
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof ProjectAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
