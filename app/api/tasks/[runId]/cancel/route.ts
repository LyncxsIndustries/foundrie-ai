import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectMember } from "@/lib/auth/project-access";
import { cancelTaskProgress } from "@/lib/realtime/broadcast-progress";

export const dynamic = "force-dynamic";

/**
 * POST /api/tasks/[runId]/cancel
 *
 * Cancel a running Trigger.dev task
 * Returns 200 on successful cancellation request
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    // Require authentication
    const user = await requireAuth();
    
    const { runId } = await params;
    
    if (!runId) {
      return NextResponse.json(
        { error: "Run ID is required" },
        { status: 400 }
      );
    }

    // Get the project ID from request body to verify membership
    const body = await req.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Verify user is a project member (owner or collaborator)
    await requireProjectMember(projectId, user.id);

    // Cancel the task
    await tasks.cancel(runId);

    // Broadcast cancelled state to Liveblocks for real-time UI update
    await cancelTaskProgress(runId);

    return NextResponse.json({ 
      success: true,
      message: "Task cancellation requested" 
    });
  } catch (error) {
    console.error("Task cancellation error:", error);
    
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Task not found or already completed" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to cancel task" },
      { status: 500 }
    );
  }
}
