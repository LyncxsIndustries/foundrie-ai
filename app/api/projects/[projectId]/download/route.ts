import { NextRequest, NextResponse } from "next/server";
import { tasks, runs } from "@trigger.dev/sdk";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectMember } from "@/lib/projects/auth";
import type { generateProjectZip } from "@/trigger/generate-project-zip";

const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

interface DownloadRouteParams {
  params: Promise<{ projectId: string }>;
}

// POST - Return cached metadata or trigger generation
export async function POST(
  request: NextRequest,
  { params }: DownloadRouteParams
) {
  try {
    const user = await requireAuth();
    const { projectId } = await params;

    await requireProjectMember(projectId, user.id);

    const project = await db.project.findFirst({
      where: { id: projectId },
      select: {
        id: true,
        lastZipUrl: true,
        lastZipFileName: true,
        lastZipGeneratedAt: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Check 10-minute cache
    if (
      project.lastZipGeneratedAt &&
      project.lastZipUrl &&
      project.lastZipFileName
    ) {
      const cacheAge = Date.now() - project.lastZipGeneratedAt.getTime();
      if (cacheAge < CACHE_DURATION_MS) {
        // Fetch size from blob metadata
        const response = await fetch(project.lastZipUrl, { method: "HEAD" });
        const size = parseInt(
          response.headers.get("content-length") || "0",
          10
        );

        return NextResponse.json({
          cached: true,
          fileName: project.lastZipFileName,
          url: project.lastZipUrl,
          size,
        });
      }
    }

    // Trigger generation
    const handle = await tasks.trigger<typeof generateProjectZip>(
      "generate-project-zip",
      {
        projectId: project.id,
        userId: user.id,
      }
    );

    return NextResponse.json(
      {
        cached: false,
        runId: handle.id,
      },
      { status: 202 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to prepare download" },
      { status: 500 }
    );
  }
}

// GET - Poll run status by runId query parameter
export async function GET(
  request: NextRequest,
  { params }: DownloadRouteParams
) {
  try {
    const user = await requireAuth();
    const { projectId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const runId = searchParams.get("runId");

    if (!runId) {
      return NextResponse.json(
        { error: "runId query parameter is required" },
        { status: 400 }
      );
    }

    await requireProjectMember(projectId, user.id);

    // Retrieve run status from Trigger.dev
    const run = await runs.retrieve(runId);

    // Return status and output when complete
    if (run.status === "COMPLETED" && run.output) {
      return NextResponse.json({
        status: "completed",
        fileName: run.output.fileName,
        url: run.output.url,
        size: run.output.size,
      });
    }

    if (run.status === "FAILED" || run.status === "CANCELED") {
      return NextResponse.json({
        status: "failed",
        error: run.status === "FAILED" ? "Generation failed" : "Generation was canceled",
      });
    }

    // Still in progress
    return NextResponse.json({
      status: "generating",
      progress: run.metadata?.progress || 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}
