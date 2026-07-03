import { task, logger, metadata } from "@trigger.dev/sdk";
import type { GenerateZipPayload, GenerateZipResult } from "./types";

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

    // Dynamic imports to reduce cold start time
    const [{ db }, { buildProjectZip }, { put }] = await Promise.all([
      import("@/lib/db"),
      import("@/lib/zip/build-project-zip"),
      import("@vercel/blob"),
    ]);

    logger.info("Starting ZIP generation", { projectId, userId });
    
    // Initialize progress tracking
    metadata
      .set("stage", "initializing")
      .set("progress", 0)
      .set("message", "Initializing ZIP generation...")
      .set("startTime", new Date().toISOString());

    // Fetch project with ownership check
    metadata
      .set("stage", "fetching-project")
      .set("progress", 5)
      .set("message", "Checking project access...");
      
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
      metadata.set("stage", "error").set("message", "Access denied");
      throw new Error("Project not found or access denied");
    }

    // Check 10-minute cache
    metadata
      .set("stage", "checking-cache")
      .set("progress", 10)
      .set("message", "Checking for cached ZIP...");
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
        
        metadata
          .set("stage", "cache-hit")
          .set("progress", 100)
          .set("message", "Using cached ZIP (< 10 min old)");

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

    // Build ZIP with progress tracking
    const startTime = Date.now();
    logger.info("Building ZIP", { projectId });
    
    metadata
      .set("stage", "building-zip")
      .set("progress", 20)
      .set("message", "Fetching project data...");

    const zipBuffer = await buildProjectZip(projectId, {
      onProgress: (step: string, percent: number) => {
        // Map build steps to 20-80% progress range
        const mappedProgress = 20 + Math.floor(percent * 0.6);
        metadata
          .set("progress", mappedProgress)
          .set("message", step)
          .append("buildSteps", `${percent}%: ${step}`);
        
        logger.info("ZIP build progress", { projectId, step, percent });
      },
    });
    
    const buildDuration = Date.now() - startTime;

    logger.info("ZIP built", {
      projectId,
      buildDurationMs: buildDuration,
      sizeBytes: zipBuffer.length,
    });
    
    metadata
      .set("stage", "uploading")
      .set("progress", 85)
      .set("message", `Uploading ZIP (${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB)...`);

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
    
    metadata
      .set("stage", "finalizing")
      .set("progress", 95)
      .set("message", "Saving ZIP metadata...");

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
    
    metadata
      .set("stage", "complete")
      .set("progress", 100)
      .set("message", "ZIP ready for download")
      .set("endTime", new Date().toISOString())
      .set("totalDurationMs", Date.now() - startTime);

    return {
      fileName,
      url: blob.url,
      size: zipBuffer.length,
    };
  },
});
