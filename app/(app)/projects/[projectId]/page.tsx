// Project overview (Feature 06).
// The project index surface: summary metadata and phase status. Ownership-scoped
// read; 404 on any ownership failure. Live activity and richer content arrive in
// later phase features.
import { notFound, redirect } from "next/navigation";

import { ProjectHeader } from "@/components/project/project-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  phaseForStatus,
  phasePosition,
  statusLabel,
  PROJECT_PHASE_COUNT,
} from "@/components/project/project-phases";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface ProjectOverviewProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectOverviewPage({
  params,
}: ProjectOverviewProps) {
  const user = await getAuthUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { projectId } = await params;
  const project = await db.project.findFirst({
    where: { id: projectId, userId: user.id },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      diagramCount: true,
      completedDiagramCount: true,
      featureSpecCount: true,
    },
  });
  if (!project) {
    notFound();
  }

  const position = phasePosition(phaseForStatus(project.status));

  return (
    <>
      <ProjectHeader
        projectId={project.id}
        title={project.name}
        description={`Phase ${position} of ${PROJECT_PHASE_COUNT} — ${statusLabel(project.status)}`}
      />
      <div className="grid gap-4 p-6 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Overview</CardTitle>
            <Badge variant="secondary">{statusLabel(project.status)}</Badge>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-text-secondary">
            <p>{project.description || "No description yet."}</p>
            <Separator />
            <dl className="grid grid-cols-2 gap-2 text-xs text-text-muted">
              <div>
                <dt className="text-text-muted">Diagrams</dt>
                <dd className="text-text-secondary">
                  {project.completedDiagramCount}/{project.diagramCount}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Feature specs</dt>
                <dd className="text-text-secondary">
                  {project.featureSpecCount}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-text-secondary">
            <p>Recent session activity.</p>
            <Separator className="my-3" />
            <p className="text-text-muted">No activity yet.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
