import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectMember } from "@/lib/projects/auth";
import { generateProjectSkills } from "@/lib/skills/generate-project-skills";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await requireAuth();
    const { projectId } = await params;
    await requireProjectMember(projectId, user.id);

    const skills = await generateProjectSkills(projectId, user.id);

    return NextResponse.json({ skills }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthenticated") {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Project not found") {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Skill generation failed" }, { status: 500 });
  }
}
