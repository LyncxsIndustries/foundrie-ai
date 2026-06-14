import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAuth, AuthError } from "@/lib/auth/require-auth";
import { requireProjectMember, ProjectAuthError } from "@/lib/projects/auth";
import { db } from "@/lib/db";
import { ResearchAssetType } from "@/lib/generated/prisma/client";

const payloadSchema = z.object({
  assetType: z.nativeEnum(ResearchAssetType),
});

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
  const body = (await req.json()) as HandleUploadBody;

  try {
    const user = await requireAuth();
    const { projectId } = await params;

    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // 1. Authorize: user must own the project
        await requireProjectMember(projectId, user.id);

        // 2. Validate payload
        if (!clientPayload) {
          throw new Error("Missing clientPayload");
        }
        const parsed = payloadSchema.safeParse(JSON.parse(clientPayload));
        if (!parsed.success) {
          throw new Error("Invalid assetType");
        }
        const { assetType } = parsed.data;

        // 3. Reject raw animation files completely
        const lowerName = pathname.toLowerCase();
        if (
          lowerName.endsWith(".mp4") ||
          lowerName.endsWith(".mov") ||
          lowerName.endsWith(".webm") ||
          lowerName.endsWith(".gif")
        ) {
          throw new Error("Raw animation uploads are rejected. Please upload a frame ZIP instead.");
        }

        // Return token configuration
        return {
          maximumSizeInBytes: 50 * 1024 * 1024, // 50MB limit
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/svg+xml",
            "application/zip",
            "application/x-zip-compressed",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
            "text/markdown",
            "text/plain",
          ],
          tokenPayload: JSON.stringify({
            projectId,
            userId: user.id,
            assetType,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          if (!tokenPayload) throw new Error("Missing tokenPayload");
          const { projectId: tProjectId, assetType } = JSON.parse(tokenPayload);

          await db.researchAsset.create({
            data: {
              projectId: tProjectId,
              assetType: assetType as ResearchAssetType,
              fileName: blob.pathname,
              storageUrl: blob.url,
              mimeType: blob.contentType,
            },
          });
        } catch (error) {
          // If DB write fails, log it. In a real system, you might want to cleanup the blob.
          console.error("Failed to save ResearchAsset record:", error);
          throw error;
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    if (error instanceof ProjectAuthError) {
      return notFound();
    }
    const message = (error as Error).message;
    return NextResponse.json(
      { error: message },
      { status: message === "Project not found." ? 404 : 400 },
    );
  }
}
