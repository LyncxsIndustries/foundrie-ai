import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireProjectMember } from "@/lib/auth/project-access";
import {
  executeBulkOperation,
  BulkOperation,
} from "@/lib/media/bulk-operations";
import { VALID_CATEGORIES, MediaCategory } from "@/lib/media/categories";

const BulkOperationSchema = z.object({
  operation: z.enum(["update-category", "add-tags", "analyze", "delete"]),
  fileIds: z.array(z.string()).min(1, "At least one file ID is required"),
  data: z
    .object({
      category: z.enum(VALID_CATEGORIES as [string, ...string[]]).optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    // Auth check
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await context.params;

    // Project membership check (returns 404 on failure per spec)
    try {
      await requireProjectMember(projectId, user.id);
    } catch {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = BulkOperationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { operation, fileIds, data } = validationResult.data;

    // Execute bulk operation
    const result = await executeBulkOperation({
      projectId,
      fileIds,
      userId: user.id,
      operation: operation as BulkOperation,
      data: data as { category?: MediaCategory; tags?: string[] },
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Bulk operation failed",
          errors: result.errors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updatedCount: result.updatedCount,
    });
  } catch (error) {
    console.error("[BULK_OPERATION_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
