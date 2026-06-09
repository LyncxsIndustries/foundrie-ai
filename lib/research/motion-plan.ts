import { db } from "@/lib/db";
import { callAI } from "@/lib/ai";

export async function analyzeMotionAsset(projectId: string, assetId: string, plan: "FREE" | "PRO" | "ENTERPRISE" = "FREE") {
  // 1. Fetch asset
  const asset = await db.researchAsset.findUnique({
    where: { id: assetId, projectId },
  });

  if (!asset) {
    throw new Error("Asset not found");
  }

  // Motion plans might be requested for frame ZIPs or images that imply motion
  // We'll pass the asset to the vision model if it's an image.
  // If it's a ZIP, we'd ideally extract frames. Since we're in a stateless route,
  // extracting a ZIP and passing all frames to AI is complex.
  // For the scope of Feature 08, if it's a ZIP, we will generate a motion strategy
  // without the actual vision context, just based on filename and metadata.
  // If it's a GIF or a single frame implying motion, we pass the image.

  let media;
  if (asset.mimeType?.startsWith("image/")) {
    const response = await fetch(asset.storageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from blob storage: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");
    media = [
      {
        mimeType: asset.mimeType,
        base64Data,
      },
    ];
  }

  // 3. Call AI
  const systemPrompt = `You are Foundrie's expert Motion Designer and Frontend Animation Architect.
Your job is to produce a concrete motion implementation plan based on the provided reference.

The plan MUST include:
1. Timeline sequence and key scenes
2. Recommended GSAP / ScrollTrigger code patterns and properties to animate
3. Preloading strategies (especially if this is a frame-by-frame sequence)
4. Performance budgets, pinned sections, and responsive fallback strategies
5. Accessibility notes (e.g. prefers-reduced-motion)

Format your response in Markdown. Keep it actionable and technical.`;

  const userPrompt = `Provide a motion implementation plan for this asset.
File: ${asset.fileName}
Type: ${asset.assetType}
Size: ${asset.fileSize} bytes
${media ? "Please analyze the attached visual reference to extract motion intent." : "This is an archive/ZIP of frames. Propose a general scroll-sequence or frame-by-frame motion strategy for this type of asset."}`;

  const result = await callAI("motion_analysis", {
    plan,
    systemPrompt,
    userPrompt,
    media,
  });

  if (result.status !== "ok") {
    throw new Error(`AI Analysis queued or failed: ${result.lastError}`);
  }

  // 4. Save analysis as a ResearchDocument
  const doc = await db.researchDocument.create({
    data: {
      projectId,
      sourceType: "AI_MOTION_PLAN",
      title: `Motion Plan: ${asset.fileName}`,
      content: result.text + `\n\n*Source Asset: ${asset.storageUrl}*`,
    },
  });

  // 5. Update asset with summary metadata
  const updatedMetadata = {
    ...((asset.metadata as Record<string, unknown>) || {}),
    aiSummaryId: doc.id,
    aiMotionPreview: result.text.substring(0, 200) + "...",
  };

  await db.researchAsset.update({
    where: { id: asset.id },
    data: { metadata: updatedMetadata },
  });

  return doc;
}
