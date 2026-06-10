import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectOwner } from "@/lib/projects/auth";
import type { generateDiagramsTask } from "@/trigger/generate-diagrams";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await requireAuth();
    const { projectId } = await params;

    await requireProjectOwner(projectId, user.id);

    // Re-trigger the task to continue with remaining diagrams
    const handle = await tasks.trigger<typeof generateDiagramsTask>(
      "generate-diagrams",
      { projectId }
    );

    return NextResponse.json(
      { message: "System Context approved, continuing generation", runId: handle.id },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to approve System Context" },
      { status: 500 }
    );
  }
}
