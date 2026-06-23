/**
 * Requirements Export Documents Generation Route (Feature 47)
 * POST /api/requirements/[projectId]/export-docs
 * 
 * Generates the three requirements export documents:
 * - discovery-notes.md
 * - requirements-analysis.md
 * - architecture-decisions.md
 * 
 * Owner-only. Non-owner access returns 404.
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { generateRequirementsDocs } from "@/lib/generation/requirements-docs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Authenticate the user first.
    const user = await requireAuth();

    // generateRequirementsDocs calls requireProjectOwner internally,
    // which returns 404 for non-owners.
    const result = await generateRequirementsDocs(projectId, user.id);

    return NextResponse.json({
      discoveryNotes: result.discoveryNotes,
      reqAnalysis: result.reqAnalysis,
      archDecisions: result.archDecisions,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

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
        { error: "AI generation temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate requirements documents" },
      { status: 500 }
    );
  }
}
