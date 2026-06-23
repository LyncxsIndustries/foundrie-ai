import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectMember } from "@/lib/auth/project-access";
import { getSessionCheckpoint, discardSession } from "@/lib/session/checkpoint";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await requireAuth();
    const resolvedParams = await params;
    await requireProjectMember(resolvedParams.projectId, user.id);

    const checkpoint = await getSessionCheckpoint(resolvedParams.projectId);
    
    return NextResponse.json(checkpoint);
  } catch (error: any) {
    if (error.status === 401) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    if (error.status === 404) {
      return new NextResponse("Project not found or unauthorized", { status: 404 });
    }
    console.error("Failed to get session checkpoint:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await requireAuth();
    const resolvedParams = await params;
    await requireProjectMember(resolvedParams.projectId, user.id);

    await discardSession(resolvedParams.projectId);
    
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error.status === 401) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    if (error.status === 404) {
      return new NextResponse("Project not found or unauthorized", { status: 404 });
    }
    console.error("Failed to discard session:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
