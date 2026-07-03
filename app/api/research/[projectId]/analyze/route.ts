import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAuth, AuthError } from "@/lib/auth/require-auth";
import { requireProjectMember, ProjectAuthError } from "@/lib/projects/auth";
import { db } from "@/lib/db";
import { analyzeVisualAsset } from "@/lib/research/visual-analysis";
import { analyzeMotionAsset } from "@/lib/research/motion-plan";

type RouteContext = { params: Promise<{ projectId: string }> };

const AnalyzeRequestSchema = z.object({
  fileIds: z.array(z.string()).min(1, "At least one file ID is required"),
  analysisType: z.enum(["vision", "ocr", "full"]).optional().default("full"),
});

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
    
    // Support both old single assetId format and new batch fileIds format
    let fileIds: string[];
    if (body?.assetId) {
      // Legacy single asset format
      fileIds = [body.assetId];
    } else if (body?.fileIds) {
      // New batch format
      const validationResult = AnalyzeRequestSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Invalid request", details: validationResult.error.issues },
          { status: 400 }
        );
      }
      fileIds = validationResult.data.fileIds;
    } else {
      return NextResponse.json(
        { error: "assetId or fileIds is required" },
        { status: 400 }
      );
    }

    // Fetch all assets
    const assets = await db.researchAsset.findMany({
      where: {
        id: { in: fileIds },
        projectId,
      },
    });

    if (assets.length === 0) {
      return NextResponse.json({ error: "No assets found" }, { status: 404 });
    }

    // Process each asset
    const results = await Promise.allSettled(
      assets.map(async (asset) => {
        try {
          let doc;
          if (asset.assetType === "FRAME_ZIP" || asset.assetType === "FRAME") {
            doc = await analyzeMotionAsset(projectId, asset.id, user.plan);
          } else {
            doc = await analyzeVisualAsset(projectId, asset.id, user.plan);
          }

          // Update the asset with AI description
          if (doc && doc.content) {
            // Extract first 500 chars as description
            const description = doc.content.substring(0, 500);
            
            await db.researchAsset.update({
              where: { id: asset.id },
              data: {
                aiDescription: description,
                extractedText: doc.content,
              },
            });
          }

          return {
            fileId: asset.id,
            aiDescription: doc?.content ? doc.content.substring(0, 500) : null,
            extractedText: doc?.content || null,
            status: "success" as const,
          };
        } catch (error: any) {
          return {
            fileId: asset.id,
            aiDescription: null,
            extractedText: null,
            status: "error" as const,
            error: error.message || "Analysis failed",
          };
        }
      })
    );

    // Map results
    const analysisResults = results.map((result) =>
      result.status === "fulfilled" ? result.value : result.reason
    );

    // Legacy format for single asset (backward compatibility)
    if (body?.assetId) {
      const singleResult = analysisResults[0];
      if (singleResult.status === "error") {
        return NextResponse.json(
          { error: "Analysis failed", details: singleResult.error },
          { status: 500 }
        );
      }
      return NextResponse.json({ doc: singleResult });
    }

    // New batch format
    return NextResponse.json({ results: analysisResults });
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
