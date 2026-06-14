import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAuth, AuthError } from "@/lib/auth/require-auth";
import { requireProjectMember, ProjectAuthError } from "@/lib/projects/auth";
import { db } from "@/lib/db";
import { extractWithTavily } from "@/lib/research/providers/tavily";
import { extractWithObscura } from "@/lib/research/providers/obscura";
import { ResearchSourceProvider } from "@/lib/generated/prisma/client";

const bodySchema = z.object({
  url: z.string().url("A valid URL is required."),
  /** Which provider to use for extraction. Defaults to MANUAL (no extraction). */
  provider: z
    .nativeEnum(ResearchSourceProvider)
    .optional()
    .default("MANUAL"),
});

type RouteContext = { params: Promise<{ projectId: string }> };

function unauthorized(message: string): Response {
  return NextResponse.json({ error: message }, { status: 401 });
}

function notFound(): Response {
  return NextResponse.json({ error: "Project not found." }, { status: 404 });
}

/**
 * POST /api/research/[projectId]/links
 *
 * Adds a URL-based research source to the project. When a provider is
 * specified and its credentials are configured, the source is immediately
 * extracted; otherwise it is stored as MANUAL/PENDING.
 */
export async function POST(
  req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const user = await requireAuth();
    const { projectId } = await params;

    await requireProjectMember(projectId, user.id);

    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input." },
        { status: 400 },
      );
    }

    const { url, provider } = parsed.data;

    // Create the source record in PENDING state
    const source = await db.researchSource.create({
      data: {
        projectId,
        url,
        provider,
        status: "PENDING",
      },
    });

    // Attempt extraction if a non-MANUAL provider is specified
    if (provider !== "MANUAL" && provider !== "UPLOAD_DERIVED") {
      try {
        const extracted = await extractSource(provider, url);

        // Update the source with extracted content
        await db.researchSource.update({
          where: { id: source.id },
          data: {
            extractedContent: truncateContent(extracted.content),
            status: "COMPLETED",
          },
        });

        // Create a research document from the extraction
        await db.researchDocument.create({
          data: {
            projectId,
            sourceType: `WEB_${provider}`,
            title: extracted.title,
            content:
              extracted.content +
              `\n\n*Source: [${url}](${url}) — extracted via ${provider}*`,
          },
        });

        return NextResponse.json({
          source: { ...source, status: "COMPLETED" },
          extracted: true,
        });
      } catch (extractionError: unknown) {
        // Extraction failed — mark the source as FAILED but still return 200
        // so the link is saved. The user can retry later.
        await db.researchSource.update({
          where: { id: source.id },
          data: { status: "FAILED" },
        });

        return NextResponse.json({
          source: { ...source, status: "FAILED" },
          extracted: false,
          extractionError:
            extractionError instanceof Error
              ? extractionError.message
              : String(extractionError),
        });
      }
    }

    return NextResponse.json({ source, extracted: false });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return unauthorized(error.message);
    }
    if (error instanceof ProjectAuthError) {
      return notFound();
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Route extraction to the appropriate provider adapter.
 */
async function extractSource(
  provider: ResearchSourceProvider,
  url: string,
): Promise<{ title: string; content: string }> {
  switch (provider) {
    case "TAVILY": {
      if (!process.env.TAVILY_API_KEY) {
        throw new Error("Tavily API key is not configured.");
      }
      return extractWithTavily(url);
    }
    case "OBSCURA": {
      return extractWithObscura(url);
    }
    case "CONTEXT7": {
      // Context7 is handled differently — it takes a libraryId + query, not a
      // raw URL. For URL-based link addition, Context7 is not applicable.
      throw new Error("Context7 requires a library ID, not a URL.");
    }
    default:
      throw new Error(`Provider ${provider} does not support URL extraction.`);
  }
}

/**
 * Truncate extracted content to avoid storing full copyrighted pages.
 * We keep the first ~8000 characters which is enough for synthesis.
 */
function truncateContent(content: string): string {
  const MAX_CHARS = 8000;
  if (content.length <= MAX_CHARS) return content;
  return content.substring(0, MAX_CHARS) + "\n\n[…content truncated for attribution compliance]";
}
