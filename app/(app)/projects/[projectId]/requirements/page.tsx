// Requirements phase page (Feature 12).
// Server component fetches requirements and renders the editable review UI.
// Only loads the requirements row, not full conversation history.
import { redirect } from "next/navigation";
import { SurfaceHeader } from "@/components/shells/workspace-shell";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { SurfaceEmpty } from "@/components/shells/surface-states";
import { RequirementsReview } from "@/components/project/RequirementsReview";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { db } from "@/lib/db";
import {
  phasePosition,
  PROJECT_PHASE_COUNT,
} from "@/components/project/project-phases";

type Props = {
  params: Promise<{ projectId: string }>;
};

export default async function RequirementsReviewPage({ params }: Props) {
  const user = await getAuthUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { projectId } = await params;

  const requirements = await db.requirements.findFirst({
    where: {
      projectId,
      project: { userId: user.id },
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const prefix = `Phase ${phasePosition("requirements")} of ${PROJECT_PHASE_COUNT}`;

  return (
    <>
      <SurfaceHeader
        title="Requirements"
        description={`${prefix} — Review and edit the surfaced requirements before architecture.`}
      />
      <ScrollArea className="flex-1">
        <div className="p-6">
          {!requirements ? (
            <SurfaceEmpty
              title="No requirements generated"
              message="Generate requirements from your discovery conversation first."
              action={
                <Button size="lg" disabled>
                  Generate requirements
                </Button>
              }
            />
          ) : (
            <RequirementsReview
              projectId={projectId}
              initialData={{
                id: requirements.id,
                content: requirements.content as any,
                updatedAt: requirements.updatedAt.toISOString(),
              }}
            />
          )}
        </div>
      </ScrollArea>
    </>
  );
}
