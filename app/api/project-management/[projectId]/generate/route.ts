/**
 * Project Management Documents Generation Route (Feature 48)
 * POST /api/project-management/[projectId]/generate
 *
 * Generates the four project-management export documents:
 * - SCOPE.md
 * - TIMELINE.md
 * - PRICING.md
 * - CHANGE_LOG.md
 *
 * Owner-only. Non-owner access returns 404.
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { generateProjectManagementDocs } from "@/lib/generation/project-management-docs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Authenticate the user first.
    const user = await requireAuth();

    // generateProjectManagementDocs calls requireProjectOwner internally,
    // which returns 404 for non-owners.
    const result = await generateProjectManagementDocs(projectId, user.id);

    return NextResponse.json({
      scopeMd: result.scopeMd,
      timelineMd: result.timelineMd,
      pricingMd: result.pricingMd,
      changelogMd: result.changelogMd,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    // Auth errors from requireAuth
    if (errorMessage === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ownership/not found errors (includes ProjectAuthError)
    if (
      errorMessage.includes("not found") ||
      errorMessage.includes("Project not found")
    ) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // AI rotation exhaustion
    if (errorMessage.includes("exhausted providers")) {
      return NextResponse.json(
        {
          error:
            "AI generation temporarily unavailable. Please try again later.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate project management documents" },
      { status: 500 }
    );
  }
}
