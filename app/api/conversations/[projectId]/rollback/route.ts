// Feature 64: Rollback conversation to a specific version
import { NextResponse } from "next/server";
import { rollbackToVersion } from "@/lib/conversations/completion";
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
    const { targetVersion } = body as { targetVersion?: number };

    if (typeof targetVersion !== "number" || targetVersion < 1) {
      return NextResponse.json(
        { error: "Invalid target version" },
        { status: 400 }
      );
    }

    const result = await rollbackToVersion(projectId, targetVersion);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    await captureServerEvent(user.id, "conversation_rolled_back", {
      project_id: projectId,
      target_version: targetVersion,
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
    console.error("[POST /api/conversations/[projectId]/rollback] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
