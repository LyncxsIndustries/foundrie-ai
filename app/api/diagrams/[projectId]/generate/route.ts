import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectMember } from "@/lib/projects/auth";
import type { generateDiagramsTask } from "@/trigger/generate-diagrams";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await requireAuth();
    const { projectId } = await params;

    await requireProjectMember(projectId, user.id);

    const handle = await tasks.trigger<typeof generateDiagramsTask>(
      "generate-diagrams",
      { projectId, triggeredByUserId: user.id }
    );

    return NextResponse.json(
      { message: "Diagram generation started", runId: handle.id },
      { status: 202 }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to start diagram generation" },
      { status: 500 }
    );
  }
}
