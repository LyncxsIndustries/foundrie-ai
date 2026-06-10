// Export phase page (Feature 06 + Feature 27 skills integration).
// Shows ZIP package checklist, skills status, and download action.
import { notFound } from "next/navigation";
import { Package } from "lucide-react";

import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { PhasePlaceholder } from "@/components/project/phase-placeholder";
import { ProjectSkillsList } from "@/components/project/ProjectSkillsList";
import { Button } from "@/components/ui/button";

interface ExportPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ExportPage({ params }: ExportPageProps) {
  const user = await getAuthUser();
  if (!user) notFound();

  const { projectId } = await params;

  const project = await db.project.findFirst({
    where: { id: projectId, userId: user.id },
    select: {
      id: true,
      agentSkills: {
        select: { slug: true, name: true },
      },
    },
  });

  if (!project) notFound();

  const hasSkills = project.agentSkills.length > 0;

  if (!hasSkills) {
    return (
      <PhasePlaceholder
        phaseId="export"
        title="Export"
        description="Package checklist and ZIP download."
        icon={<Package className="size-8" />}
        emptyTitle="Generate skills first"
        emptyMessage="Agent skills must be generated before exporting the package."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Export Package</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Review the generated skills before downloading the ZIP.
        </p>
      </div>

      <ProjectSkillsList skills={project.agentSkills} />

      <div className="flex items-center gap-3 rounded-lg border border-border-secondary bg-surface-secondary p-4">
        <Button disabled>
          <Package className="mr-2 h-4 w-4" />
          Download ZIP
        </Button>
        <p className="text-xs text-text-tertiary">
          ZIP builder arrives in Feature 30. Skills are ready.
        </p>
      </div>
    </div>
  );
}
