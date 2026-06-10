/**
 * Context File Generation Route
 * POST /api/context-files/[projectId]/generate
 * Generates context files (starting with PROJECT_OVERVIEW)
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AuthError, requireAuth } from "@/lib/auth/require-auth";
import { ProjectAuthError, requireProjectMember } from "@/lib/projects/auth";
import { generateProjectOverview } from "@/lib/generation/project-overview";
import { ContextFileType } from "@/lib/generated/prisma/enums";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Auth check
    const user = await requireAuth();
    await requireProjectMember(projectId, user.id);

    // Get fileType from body
    const body = await request.json();
    const { fileType } = body as { fileType?: string };

    if (!fileType) {
      return NextResponse.json(
        { error: "fileType is required" },
        { status: 400 }
      );
    }

    // Validate fileType
    if (!Object.values(ContextFileType).includes(fileType as ContextFileType)) {
      return NextResponse.json(
        { error: `Invalid fileType: ${fileType}` },
        { status: 400 }
      );
    }

    let content: string;

    // Generate based on fileType
    switch (fileType) {
      case "PROJECT_OVERVIEW":
        content = await generateProjectOverview(projectId);
        break;
      default:
        return NextResponse.json(
          { error: `Generation not implemented for fileType: ${fileType}` },
          { status: 501 }
        );
    }

    // Upsert to database
    const contextFile = await db.contextFile.upsert({
      where: {
        projectId_fileType: {
          projectId,
          fileType: fileType as ContextFileType,
        },
      },
      create: {
        projectId,
        fileType: fileType as ContextFileType,
        content,
      },
      update: {
        content,
      },
    });

    return NextResponse.json({
      id: contextFile.id,
      fileType: contextFile.fileType,
      content: contextFile.content,
      createdAt: contextFile.createdAt,
      updatedAt: contextFile.updatedAt,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Auth errors from requireAuth return exact "Unauthorized" message
    if (errorMessage === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ownership/not found errors (includes ProjectAuthError)
    if (errorMessage.includes("not found") || errorMessage.includes("Project not found")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    console.error("Context file generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate context file" },
      { status: 500 }
    );
  }
}
