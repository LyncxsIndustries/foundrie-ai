/**
 * Project Docs Package Generation Route (Feature 49)
 * POST /api/docs/[projectId]/generate
 *
 * Generates the docs/ folder package:
 * - PRODUCTION-CHECKLIST.md
 * - QUALITY-GATE.md
 * - LOGGING.md
 * - SECURITY.md
 * - PRIVACY.md
 * - TOOLING.md
 * - CONTRIBUTING.md
 * - docs/adr/ADR-NNNN-*.md
 * - docs/security/RED-TEAM.md (for agentic projects)
 *
 * Owner-only. Non-owner access returns 404.
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { generateProjectDocs } from "@/lib/generation/project-docs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Authenticate the user first.
    const user = await requireAuth();

    // generateProjectDocs calls requireProjectOwner internally,
    // which returns 404 for non-owners.
    const result = await generateProjectDocs(projectId, user.id);

    return NextResponse.json(result);
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
      { error: "Failed to generate project documents" },
      { status: 500 }
    );
  }
}
