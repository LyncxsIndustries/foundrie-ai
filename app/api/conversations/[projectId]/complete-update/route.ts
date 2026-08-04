// Feature 64: Complete an update session (mark done again after resume)
import { NextResponse } from "next/server";
import { completeUpdateSession } from "@/lib/conversations/completion";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectMember } from "@/lib/auth/project-access";
import { captureServerEvent } from "@/lib/posthog-server";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function POST(
  request: Request,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const user = await requireAuth();
    const { projectId } = await context.params;

    // Verify user has access to this project
    await requireProjectMember(projectId, user.id);

    const body = await request.json();
    const { label } = body as { label?: string };

    const result = await completeUpdateSession(projectId, label);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    await captureServerEvent(user.id, "conversation_update_completed", {
      project_id: projectId,
      version: result.version,
      has_label: !!label,
    });

    return NextResponse.json({
      success: true,
      version: result.version,
    }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    console.error("[POST /api/conversations/[projectId]/complete-update] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
