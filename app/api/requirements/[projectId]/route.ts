// Requirements review API (Feature 12).
// GET/PATCH with ownership checks. Returns only the requirements content,
// not the full conversation history.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, AuthError } from "@/lib/auth/require-auth";
import { requireProjectMember, ProjectAuthError } from "@/lib/projects/auth";
import { db } from "@/lib/db";

const requirementsContentSchema = z.object({
  functional: z.array(z.string()).optional(),
  nonFunctional: z.array(z.string()).optional(),
  hidden: z.array(z.string()).optional(),
  scale: z.record(z.string(), z.string()).optional(),
  security: z.array(z.string()).optional(),
  adrs: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        decision: z.string(),
        rationale: z.string(),
        date: z.string(),
      })
    )
    .optional(),
});

type RouteParams = { params: Promise<{ projectId: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { projectId } = await params;

    await requireProjectMember(projectId, user.id);

    const requirements = await db.requirements.findFirst({
      where: {
        projectId,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!requirements) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(requirements);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof ProjectAuthError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { projectId } = await params;

    await requireProjectMember(projectId, user.id);

    const body = await req.json();
    const validatedContent = requirementsContentSchema.parse(body.content);

    const updated = await db.requirements.updateMany({
      where: {
        projectId,
      },
      data: {
        content: validatedContent,
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const requirements = await db.requirements.findFirst({
      where: { projectId },
      select: {
        id: true,
        content: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(requirements);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof ProjectAuthError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
