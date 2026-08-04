// Feature 64: Resume a done conversation for project updates
import { NextResponse } from "next/server";
import { resumeConversationForUpdate } from "@/lib/conversations/completion";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectMember } from "@/lib/auth/project-access";
import { captureServerEvent } from "@/lib/posthog-server";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function POST(
  _request: Request,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const user = await requireAuth();
    const { projectId } = await context.params;

    // Verify user has access to this project
    await requireProjectMember(projectId, user.id);

    const result = await resumeConversationForUpdate(projectId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    await captureServerEvent(user.id, "conversation_resumed_for_update", {
      project_id: projectId,
      new_version: result.newVersion,
    });

    return NextResponse.json({
      success: true,
      newVersion: result.newVersion,
    }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    console.error("[POST /api/conversations/[projectId]/resume] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
