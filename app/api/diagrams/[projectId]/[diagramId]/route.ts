import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth, AuthError } from "@/lib/auth/require-auth";
import { requireProjectMember, ProjectAuthError } from "@/lib/projects/auth";
import { getDiagramWithData, saveDiagramData } from "@/lib/diagrams/storage";
import { DiagramStatus } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ projectId: string; diagramId: string }>;
};

const updateSchema = z.object({
  reactFlowData: z
    .object({
      nodes: z.array(z.unknown()),
      edges: z.array(z.unknown()),
    })
    .optional(),
  status: z.nativeEnum(DiagramStatus).optional(),
  errorMessage: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const user = await requireAuth();
    const { projectId, diagramId } = await params;

    await requireProjectMember(projectId, user.id);

    const diagram = await getDiagramWithData(diagramId);

    if (!diagram || diagram.projectId !== projectId) {
      return NextResponse.json({ error: "Diagram not found" }, { status: 404 });
    }

    return NextResponse.json(diagram);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ProjectAuthError) {
      return NextResponse.json({ error: "Diagram not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const user = await requireAuth();
    const { projectId, diagramId } = await params;

    await requireProjectMember(projectId, user.id);

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const { reactFlowData, status, errorMessage } = parsed.data;

    // Verify diagram belongs to project
    const diagram = await db.diagram.findUnique({
      where: { id: diagramId },
      select: { projectId: true },
    });

    if (!diagram || diagram.projectId !== projectId) {
      return NextResponse.json({ error: "Diagram not found" }, { status: 404 });
    }

    // Use updateMany pattern for ownership-scoped update
    const updateData: Record<string, unknown> = {};
    if (reactFlowData) {
      updateData.reactFlowData = reactFlowData;
    }
    if (status) {
      updateData.status = status;
    }
    if (errorMessage !== undefined) {
      updateData.errorMessage = errorMessage;
    }

    const result = await db.diagram.updateMany({
      where: {
        id: diagramId,
        projectId,
      },
      data: updateData,
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Diagram not found" }, { status: 404 });
    }

    const updated = await getDiagramWithData(diagramId);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ProjectAuthError) {
      return NextResponse.json({ error: "Diagram not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
