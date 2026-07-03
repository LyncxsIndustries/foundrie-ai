import { NextRequest, NextResponse } from "next/server";
import { runs } from "@trigger.dev/sdk/v3";
import { requireAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/tasks/[runId]/progress
 * 
 * Poll task progress from Trigger.dev run metadata
 * Returns real-time progress updates including stage, percentage, and messages
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    // Require authentication
    await requireAuth();
    
    const { runId } = await params;
    
    if (!runId) {
      return NextResponse.json(
        { error: "Run ID is required" },
        { status: 400 }
      );
    }

    // Retrieve run status from Trigger.dev
    const run = await runs.retrieve(runId);
    
    if (!run) {
      return NextResponse.json(
        { error: "Run not found" },
        { status: 404 }
      );
    }

    // Extract progress from metadata
    const response = {
      status: run.status,
      metadata: run.metadata || {},
      output: run.output,
      error: run.error,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
      finishedAt: run.finishedAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Task progress fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch task progress" },
      { status: 500 }
    );
  }
}
