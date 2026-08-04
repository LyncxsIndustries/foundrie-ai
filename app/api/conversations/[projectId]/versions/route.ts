// Feature 64: Get all available conversation versions
import { NextResponse } from "next/server";
import { getConversationVersions } from "@/lib/conversations/completion";
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

    const versions = await getConversationVersions(projectId);

    if (!versions) {
      return NextResponse.json(
        {
          currentVersion: 1,
          activeVersionId: null,
          versions: [],
        },
        { status: 200 }
      );
    }

    return NextResponse.json(versions, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    console.error("[GET /api/conversations/[projectId]/versions] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
