// Feature 64: Get conversation completion status and versions
import { NextResponse } from "next/server";
import { getConversationStatus } from "@/lib/conversations/completion";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectMember } from "@/lib/auth/project-access";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const user = await requireAuth();
    const { projectId } = await context.params;

    // Verify user has access to this project
    await requireProjectMember(projectId, user.id);

    const status = await getConversationStatus(projectId);

    if (!status) {
      return NextResponse.json(
        { 
          exists: false,
          isDone: false,
          messageCount: 0,
          currentVersion: 1,
          hasSnapshots: false,
          isViewingSnapshot: false,
          snapshots: [],
        },
        { status: 200 }
      );
    }

    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    console.error("[GET /api/conversations/[projectId]/status] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
