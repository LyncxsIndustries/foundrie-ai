import { NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk";
import type { generateRequirementsTask } from "@/trigger/generate-requirements";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectMember } from "@/lib/projects/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Authenticate the user first.
    const user = await requireAuth();

    // Ensure the user is an authorized member of the project.
    // requireProjectMember throws a ProjectAuthError (404) if unauthorized.
    await requireProjectMember(projectId, user.id);

    // Trigger the durable task asynchronously.
    const handle = await tasks.trigger<typeof generateRequirementsTask>(
      "generate-requirements",
      { projectId }
    );

    return NextResponse.json({ id: handle.id }, { status: 202 });
  } catch (error) {
    if (
      error instanceof Error &&
      "status" in error &&
      (error as any).status === 404
    ) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
    if (
      error instanceof Error &&
      "status" in error &&
      (error as any).status === 401
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
