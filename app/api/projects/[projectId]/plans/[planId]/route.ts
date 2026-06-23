import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/require-auth";
import { requireProjectMember } from "@/lib/auth/project-access";
import {
  approvePlan,
  rejectPlan,
  requestRevision,
  markExecuted,
} from "@/lib/plans/execution-plan";

const updatePlanSchema = z.object({
  action: z.enum(["approve", "reject", "revise", "execute"]),
  revisionNotes: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; planId: string }> }
) {
  try {
    const user = await requireAuth();
    const { projectId, planId } = await params;
    await requireProjectMember(projectId, user.id);

    const body = await req.json();
    const parsed = updatePlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    let result;
    const action = parsed.data.action;
    if (action === "approve") {
      result = await approvePlan(planId, projectId);
    } else if (action === "reject") {
      result = await rejectPlan(planId, projectId);
    } else if (action === "revise") {
      if (!parsed.data.revisionNotes) {
        return NextResponse.json(
          { error: "Validation failed: revisionNotes required for revise action" },
          { status: 400 }
        );
      }
      result = await requestRevision(planId, projectId, parsed.data.revisionNotes);
    } else if (action === "execute") {
      result = await markExecuted(planId, projectId);
    }

    if (result && result.count === 0) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
