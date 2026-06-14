import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectOwner, ProjectAuthError } from "@/lib/auth/project-access";
import { ProjectMemberRole } from "@/lib/generated/prisma/client";

const InviteCollaboratorSchema = z.object({
  email: z.string().email("Invalid email address."),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const authUser = await requireAuth();
    await requireProjectOwner(projectId, authUser.id);

    const body = await request.json();
    const result = InviteCollaboratorSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: result.error.issues?.[0]?.message || "Invalid request body." },
        { status: 400 }
      );
    }

    const { email } = result.data;

    const targetUser = await db.user.findUnique({
      where: { email },
    });

    if (!targetUser) {
      return NextResponse.json(
        { message: "User not found. They must sign up first." },
        { status: 404 }
      );
    }

    if (targetUser.id === authUser.id) {
      return NextResponse.json(
        { message: "Cannot invite yourself." },
        { status: 400 }
      );
    }

    const existingMember = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { message: "User is already a member." },
        { status: 409 }
      );
    }

    const membership = await db.projectMember.create({
      data: {
        projectId,
        userId: targetUser.id,
        role: ProjectMemberRole.COLLABORATOR,
        invitedByUserId: authUser.id,
        joinedAt: new Date(),
      },
    });

    return NextResponse.json(membership, { status: 201 });
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

    console.error("Invite member error:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
