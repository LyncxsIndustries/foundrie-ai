/**
 * Feature 26 - Feature Specs Generation
 * POST /api/feature-specs/[projectId]/generate
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/require-auth";
import {
  requireProjectMember,
  ProjectAuthError,
} from "@/lib/projects/auth";
import { generateFeatureSpecs } from "@/lib/generation/feature-specs";
import { logEvent } from "@/lib/ai/log";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  try {
    // Auth
    const user = await requireAuth();
    await requireProjectMember(projectId, user.id);

    // Generate
    const specs = await generateFeatureSpecs(projectId);

    return NextResponse.json({ specs }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    if (error instanceof ProjectAuthError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    logEvent("error", {
      event: "ai_outcome",
      task: "feature_specs_generation",
      modelKey: "unified-rotation",
      status: "queued",
      attempts: 0,
      durationMs: 0,
    });

    return NextResponse.json(
      { error: "Generation failed" },
      { status: 500 },
    );
  }
}
