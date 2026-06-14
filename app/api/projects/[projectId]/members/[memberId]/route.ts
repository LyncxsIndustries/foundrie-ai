import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectMember, ProjectAuthError } from "@/lib/auth/project-access";
import { ProjectMemberRole } from "@/lib/generated/prisma/client";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; memberId: string }> }
) {
  try {
    const { projectId, memberId } = await params;
    const authUser = await requireAuth();

    // 1. Ensure the user has at least some access to this project
    const access = await requireProjectMember(projectId, authUser.id);

    // 2. Fetch the target project to check who the owner is
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });

    if (!project) {
      throw new ProjectAuthError();
    }

    // 3. Check if they are trying to remove the owner. 
    // We used project.userId as the owner's pseudo-memberId.
    if (memberId === project.userId) {
      return NextResponse.json(
        { message: "Cannot remove the project owner." },
        { status: 400 }
      );
    }

    // 4. Fetch the target member row
    const targetMember = await db.projectMember.findFirst({
      where: { id: memberId, projectId },
    });

    if (!targetMember) {
      return NextResponse.json(
        { message: "Member not found." },
        { status: 404 }
      );
    }

    // 5. Authorize the deletion
    // Owner can remove anyone; Collaborator can only remove themselves
    if (access.role === ProjectMemberRole.OWNER) {
      // Allowed
    } else if (access.role === ProjectMemberRole.COLLABORATOR) {
      if (targetMember.userId !== authUser.id) {
        return NextResponse.json(
          { message: "Non-owners cannot remove other Collaborators." },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 403 }
      );
    }

    // 6. Execute safe scoped deletion
    await db.projectMember.deleteMany({
      where: {
        id: memberId,
        projectId,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    if (error instanceof ProjectAuthError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status || 404 }
      );
    }
    if (error.name === "AuthError") {
      return NextResponse.json(
        { message: error.message },
        { status: error.status || 401 }
      );
    }

    console.error("Remove member error:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
