// Export phase page (Feature 06 + Feature 27 skills + Feature 32 download).
// Shows ZIP package checklist, skills status, and download action.
import { notFound } from "next/navigation";
import { Package, FileText, Image, Code, GitBranch } from "lucide-react";

import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { PhasePlaceholder } from "@/components/project/phase-placeholder";
import { ProjectSkillsList } from "@/components/project/ProjectSkillsList";
import { DownloadZipButton } from "@/components/project/DownloadZipButton";

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
      name: true,
      agentSkills: {
        select: { slug: true, name: true },
      },
      contextFiles: {
        select: { fileType: true },
      },
      featureSpecs: {
        select: { id: true },
      },
      diagrams: {
        where: { status: "DONE" },
        select: { id: true },
      },
    },
  });

  if (!project) notFound();

  const hasSkills = project.agentSkills.length > 0;
  const hasContextFiles = project.contextFiles.length > 0;
  const hasFeatureSpecs = project.featureSpecs.length > 0;
  const hasDiagrams = project.diagrams.length > 0;

  if (!hasSkills) {
    return (
      <PhasePlaceholder
        projectId={projectId}
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
        <h1 className="text-2xl font-semibold text-text-primary">
          Export Package
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Download the complete implementation-ready project package.
        </p>
      </div>

      {/* Package Contents Checklist */}
      <div className="rounded-lg border border-border-secondary bg-surface-secondary p-6">
        <h2 className="text-lg font-medium text-text-primary mb-4">
          Package Contents
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-accent-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-text-primary">
                Context Files
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                {hasContextFiles
                  ? `${project.contextFiles.length} context files`
                  : "Not generated"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Image className="h-5 w-5 text-accent-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-text-primary">Diagrams</p>
              <p className="text-xs text-text-tertiary mt-1">
                {hasDiagrams
                  ? `${project.diagrams.length} diagrams`
                  : "Not generated"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <GitBranch className="h-5 w-5 text-accent-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-text-primary">
                Feature Specs
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                {hasFeatureSpecs
                  ? `${project.featureSpecs.length} feature specs`
                  : "Not generated"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Code className="h-5 w-5 text-accent-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-text-primary">
                Agent Skills
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                {project.agentSkills.length} skills
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Skills List */}
      <div>
        <h2 className="text-lg font-medium text-text-primary mb-4">
          Provisioned Skills
        </h2>
        <ProjectSkillsList skills={project.agentSkills} />
      </div>

      {/* Download Button */}
      <div>
        <h2 className="text-lg font-medium text-text-primary mb-4">
          Download Package
        </h2>
        <DownloadZipButton projectId={projectId} />
      </div>
    </div>
  );
}
