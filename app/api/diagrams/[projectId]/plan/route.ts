import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectMember } from "@/lib/projects/auth";
import { planDiagramJobs } from "@/lib/diagrams/plan-diagram-jobs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // 1. Authenticate user
    const user = await requireAuth();

    // 2. Verify project access
    const { projectId } = await params;
    const isMember = await requireProjectMember(projectId, user.id);

    if (!isMember) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 3. Plan diagrams
    const result = await planDiagramJobs(projectId, user.plan);

    return NextResponse.json({
      message: "Diagram planning completed",
      diagramCount: result.diagrams.length,
      rationale: result.rationale,
      diagrams: result.diagrams.map((d) => ({
        id: d.id,
        diagramTypeId: d.diagramTypeId,
        category: d.category,
        name: d.name,
        orderInCategory: d.orderInCategory,
        status: d.status,
      })),
    });
  } catch (error) {
    console.error("Diagram planning error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to plan diagrams" },
      { status: 500 }
    );
  }
}
