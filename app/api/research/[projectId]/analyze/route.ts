import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAuth, AuthError } from "@/lib/auth/require-auth";
import { requireProjectMember, ProjectAuthError } from "@/lib/projects/auth";
import { db } from "@/lib/db";
import { analyzeVisualAsset } from "@/lib/research/visual-analysis";
import { analyzeMotionAsset } from "@/lib/research/motion-plan";

type RouteContext = { params: Promise<{ projectId: string }> };

function unauthorized(message: string): Response {
  return NextResponse.json({ error: message }, { status: 401 });
}

function notFound(): Response {
  return NextResponse.json({ error: "Project not found." }, { status: 404 });
}

export async function POST(
  req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const user = await requireAuth();
    const { projectId } = await params;

    await requireProjectMember(projectId, user.id);

    const body = await req.json().catch(() => null);
    if (!body || !body.assetId) {
      return NextResponse.json({ error: "assetId is required" }, { status: 400 });
    }

    const { assetId } = body;

    const asset = await db.researchAsset.findUnique({
      where: { id: assetId, projectId },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    let doc;
    if (asset.assetType === "FRAME_ZIP" || asset.assetType === "FRAME") {
      doc = await analyzeMotionAsset(projectId, assetId, user.plan);
    } else {
      doc = await analyzeVisualAsset(projectId, assetId, user.plan);
    }

    return NextResponse.json({ doc });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    if (error instanceof ProjectAuthError) {
      return notFound();
    }
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed", details: error.message },
      { status: 500 }
    );
  }
}
