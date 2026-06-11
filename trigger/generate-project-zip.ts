import { task, logger } from "@trigger.dev/sdk";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { buildProjectZip } from "@/lib/zip/build-project-zip";

interface GenerateZipPayload {
  projectId: string;
  userId: string;
}

interface GenerateZipResult {
  fileName: string;
  url: string;
  size: number;
}

const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export const generateProjectZip = task({
  id: "generate-project-zip",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10_000,
  },
  maxDuration: 300, // 5 minutes for large ZIPs
  run: async (payload: GenerateZipPayload): Promise<GenerateZipResult> => {
    const { projectId, userId } = payload;

    logger.info("Starting ZIP generation", { projectId, userId });

    // Fetch project with ownership check
    const project = await db.project.findFirst({
      where: { id: projectId, userId },
      select: {
        id: true,
        slug: true,
        lastZipUrl: true,
        lastZipFileName: true,
        lastZipGeneratedAt: true,
      },
    });

    if (!project) {
      logger.error("Project not found or access denied", { projectId, userId });
      throw new Error("Project not found or access denied");
    }

    // Check 10-minute cache
    if (
      project.lastZipGeneratedAt &&
      project.lastZipUrl &&
      project.lastZipFileName
    ) {
      const cacheAge = Date.now() - project.lastZipGeneratedAt.getTime();
      if (cacheAge < CACHE_DURATION_MS) {
        logger.info("Returning cached ZIP", {
          projectId,
          cacheAgeMs: cacheAge,
          fileName: project.lastZipFileName,
        });

        // Fetch size from blob metadata
        const response = await fetch(project.lastZipUrl, { method: "HEAD" });
        const size = parseInt(response.headers.get("content-length") || "0", 10);

        return {
          fileName: project.lastZipFileName,
          url: project.lastZipUrl,
          size,
        };
      }
    }

    // Build ZIP
    const startTime = Date.now();
    logger.info("Building ZIP", { projectId });

    const zipBuffer = await buildProjectZip(projectId);
    const buildDuration = Date.now() - startTime;

    logger.info("ZIP built", {
      projectId,
      buildDurationMs: buildDuration,
      sizeBytes: zipBuffer.length,
    });

    // Generate filename with timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .replace("T", "_")
      .slice(0, 19);
    const fileName = `${project.slug}_${timestamp}.zip`;

    // Upload to Vercel Blob
    const uploadStartTime = Date.now();
    const blob = await put(fileName, zipBuffer, {
      access: "public",
      contentType: "application/zip",
    });
    const uploadDuration = Date.now() - uploadStartTime;

    logger.info("ZIP uploaded", {
      projectId,
      uploadDurationMs: uploadDuration,
      url: blob.url,
    });

    // Update project metadata
    await db.project.update({
      where: { id: projectId },
      data: {
        lastZipUrl: blob.url,
        lastZipFileName: fileName,
        lastZipGeneratedAt: new Date(),
      },
    });

    logger.info("ZIP generation complete", {
      projectId,
      fileName,
      totalDurationMs: Date.now() - startTime,
    });

    return {
      fileName,
      url: blob.url,
      size: zipBuffer.length,
    };
  },
});
