// Dashboard project card (Feature 06).
// Renders a single project's summary using only denormalized fields from the
// dashboard list query. Links to the project overview. No child collections are
// loaded or counted here.
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  phaseForStatus,
  phasePosition,
  statusLabel,
  PROJECT_PHASE_COUNT,
} from "@/components/project/project-phases";
import type { ProjectStatus } from "@/lib/generated/prisma/enums";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    status: ProjectStatus;
    diagramCount: number;
    completedDiagramCount: number;
    featureSpecCount: number;
    updatedAt: Date;
  };
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function ProjectCard({ project }: ProjectCardProps) {
  const phaseId = phaseForStatus(project.status);
  const position = phasePosition(phaseId);

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full transition-colors hover:border-border-strong">
        <CardHeader className="flex-row items-start justify-between gap-3">
          <CardTitle className="min-w-0 truncate">{project.name}</CardTitle>
          <Badge variant="secondary" className="shrink-0">
            {statusLabel(project.status)}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="line-clamp-2 min-h-10 text-sm text-text-secondary">
            {project.description || "No description yet."}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
            <span>
              Phase {position} of {PROJECT_PHASE_COUNT}
            </span>
            <span>
              {project.completedDiagramCount}/{project.diagramCount} diagrams
            </span>
            <span>{project.featureSpecCount} specs</span>
          </div>
          <p className="text-xs text-text-muted">
            Updated {dateFormatter.format(project.updatedAt)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
