import { db } from "@/lib/db";
import { callAI } from "@/lib/ai";

export async function analyzeVisualAsset(projectId: string, assetId: string, plan: "FREE" | "PRO" | "ENTERPRISE" = "FREE") {
  // 1. Fetch asset
  const asset = await db.researchAsset.findUnique({
    where: { id: assetId, projectId },
  });

  if (!asset) {
    throw new Error("Asset not found");
  }

  if (!asset.mimeType?.startsWith("image/")) {
    throw new Error("Asset is not an image");
  }

  // 2. Fetch image bytes from blob URL
  const response = await fetch(asset.storageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from blob storage: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64Data = Buffer.from(arrayBuffer).toString("base64");

  // 3. Call AI
  const systemPrompt = `You are Foundrie's expert UI/UX and Frontend Architect.
Your job is to analyze the provided visual reference (screenshot, inspiration image) and extract concrete design and implementation constraints.

Focus on:
1. Layout structure and visual hierarchy
2. Typography and scale
3. Color scheme and mood
4. Interaction intent (hover states, active states implied by the design)
5. Implementation risks or complex areas

Format your response in Markdown. Do not generate code, only architectural and design guidance.`;

  const userPrompt = `Analyze this design reference.
File: ${asset.fileName}
Size: ${asset.fileSize} bytes`;

  const result = await callAI("visual_asset_analysis", {
    plan,
    systemPrompt,
    userPrompt,
    media: [
      {
        mimeType: asset.mimeType,
        base64Data,
      },
    ],
  });

  if (result.status !== "ok") {
    throw new Error(`AI Analysis queued or failed: ${result.lastError}`);
  }

  // 4. Save analysis as a ResearchDocument
  const doc = await db.researchDocument.create({
    data: {
      projectId,
      sourceType: "AI_ANALYSIS",
      title: `Visual Analysis: ${asset.fileName}`,
      content: result.text + `\n\n*Source Asset: ${asset.storageUrl}*`,
    },
  });

  // 5. Update asset with summary metadata
  const updatedMetadata = {
    ...((asset.metadata as Record<string, unknown>) || {}),
    aiSummaryId: doc.id,
    aiSummaryPreview: result.text.substring(0, 200) + "...",
  };

  await db.researchAsset.update({
    where: { id: asset.id },
    data: { metadata: updatedMetadata },
  });

  return doc;
}
