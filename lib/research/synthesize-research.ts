import { db } from "@/lib/db";
import { callAI } from "@/lib/ai";
import type { Plan } from "@/lib/ai";

/**
 * Synthesize a project-level `research/PROJECT_RESEARCH.md` document from all
 * research materials: uploaded assets, AI analyses, web extractions, and
 * conversation notes.
 *
 * Creates or updates the single PROJECT_RESEARCH document for the project.
 */
export async function synthesizeResearch(
  projectId: string,
  plan: Plan,
): Promise<{ id: string }> {
  // 1. Gather all research materials
  const [assets, documents, sources] = await Promise.all([
    db.researchAsset.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fileName: true,
        assetType: true,
        mimeType: true,
        metadata: true,
        createdAt: true,
      },
    }),
    db.researchDocument.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        sourceType: true,
        content: true,
        createdAt: true,
      },
    }),
    db.researchSource.findMany({
      where: { projectId, status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        url: true,
        provider: true,
        extractedContent: true,
        createdAt: true,
      },
    }),
  ]);

  // 2. Build the context for the AI
  const contextParts: string[] = [];

  if (assets.length > 0) {
    contextParts.push("## Uploaded Assets\n");
    for (const asset of assets) {
      const meta = (asset.metadata as Record<string, unknown>) || {};
      const preview =
        (meta.aiSummaryPreview as string) ||
        (meta.aiMotionPreview as string) ||
        "(no analysis yet)";
      contextParts.push(
        `- **${asset.fileName}** (${asset.assetType}, ${asset.mimeType}): ${preview}`,
      );
    }
    contextParts.push("");
  }

  if (documents.length > 0) {
    contextParts.push("## Research Documents\n");
    for (const doc of documents) {
      // Truncate each document to keep the prompt within limits
      const content =
        doc.content.length > 2000
          ? doc.content.substring(0, 2000) + "…"
          : doc.content;
      contextParts.push(`### ${doc.title} (${doc.sourceType})\n${content}\n`);
    }
  }

  if (sources.length > 0) {
    contextParts.push("## Web Sources\n");
    for (const source of sources) {
      const content = source.extractedContent
        ? source.extractedContent.length > 1500
          ? source.extractedContent.substring(0, 1500) + "…"
          : source.extractedContent
        : "(no content)";
      contextParts.push(
        `### ${source.url} (${source.provider})\n${content}\n`,
      );
    }
  }

  if (contextParts.length === 0) {
    throw new Error(
      "No research materials found. Add assets, documents, or links first.",
    );
  }

  // 3. Call the AI to synthesize
  const result = await callAI("research_synthesis", {
    plan,
    systemPrompt: `You are Foundrie's research synthesizer. Given a project's research materials — uploaded visual assets, AI analyses, web-sourced extractions, and documentation — produce a structured PROJECT_RESEARCH.md that:

1. Opens with a one-paragraph executive summary of the research landscape.
2. Groups findings by theme (design patterns, technology choices, competitive landscape, user expectations, motion/animation references).
3. For each theme, cites the specific sources (by file name or URL).
4. Closes with a "Key Decisions & Open Questions" section listing the most important trade-offs and unknowns surfaced by the research.

Use Markdown formatting. Be thorough but concise. Do NOT copy full source text — summarize and cite. Preserve source attribution throughout.`,
    userPrompt: `Here are all the research materials for this project:\n\n${contextParts.join("\n")}`,
    maxTokens: 4096,
    temperature: 0.3,
  });

  if (result.status !== "ok") {
    throw new Error(
      `Research synthesis queued or failed: ${result.lastError}`,
    );
  }

  // 4. Upsert the PROJECT_RESEARCH document
  const existing = await db.researchDocument.findFirst({
    where: { projectId, sourceType: "PROJECT_RESEARCH" },
  });

  if (existing) {
    await db.researchDocument.update({
      where: { id: existing.id },
      data: {
        content: result.text,
        title: "PROJECT_RESEARCH.md",
      },
    });
    return { id: existing.id };
  }

  const doc = await db.researchDocument.create({
    data: {
      projectId,
      sourceType: "PROJECT_RESEARCH",
      title: "PROJECT_RESEARCH.md",
      content: result.text,
    },
  });

  return { id: doc.id };
}
