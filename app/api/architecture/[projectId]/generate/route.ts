import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectMember } from "@/lib/projects/auth";
import type { generateArchitectureTask } from "@/trigger/generate-architecture";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await requireAuth();
    const { projectId } = await context.params;

    await requireProjectMember(projectId, user.id);

    const handle = await tasks.trigger<typeof generateArchitectureTask>(
      "generate-architecture",
      { projectId, triggeredByUserId: user.id }
    );

    return NextResponse.json(
      {
        message: "Architecture generation started",
        runId: handle.id,
      },
      { status: 202 }
    );
  } catch (error: any) {
    if (error.message?.includes("not found") || error.message?.includes("not a member")) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Architecture generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
