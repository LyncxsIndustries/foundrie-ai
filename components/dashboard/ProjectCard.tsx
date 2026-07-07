'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  phaseForStatus,
  phasePosition,
  statusLabel,
  PROJECT_PHASE_COUNT,
} from '@/components/project/project-phases';
import { hoverLift } from '@/lib/animations/dashboard';
import type { ProjectStatus } from '@/lib/generated/prisma/enums';

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
    ownerName?: string;
  };
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function ProjectCard({ project }: ProjectCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const phaseId = phaseForStatus(project.status);
  const position = phasePosition(phaseId);

  const handleMouseEnter = () => {
    if (cardRef.current) {
      hoverLift(cardRef.current, true);
    }
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      hoverLift(cardRef.current, false);
    }
  };

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div
        ref={cardRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          willChange: 'transform',
        }}
      >
        <Card className="h-full bg-bg-elevated border border-border transition-all duration-300 hover:shadow-2xl hover:border-accent/30 hover:scale-[1.02]">
          <CardHeader className="flex-row items-start justify-between gap-3 border-b border-border pb-4">
            <CardTitle className="min-w-0 truncate text-2xl font-extrabold text-accent">
              {project.name}
            </CardTitle>
            <div className="flex shrink-0 items-center gap-2">
              {project.ownerName && (
                <Badge variant="outline" className="border-border text-text-secondary">
                  Shared
                </Badge>
              )}
              <Badge className="bg-accent/15 text-accent border border-accent/30">
                {statusLabel(project.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <p className="line-clamp-2 min-h-10 text-sm text-text-secondary">
              {project.description || 'No description yet.'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-bg-surface p-3 rounded-lg border border-border">
                <p className="text-xs text-text-muted uppercase tracking-wide">Progress</p>
                <p className="text-sm font-bold text-text-primary mt-1">
                  Phase {position} of {PROJECT_PHASE_COUNT}
                </p>
              </div>
              <div className="bg-bg-surface p-3 rounded-lg border border-border">
                <p className="text-xs text-text-muted uppercase tracking-wide">Diagrams</p>
                <p className="text-sm font-bold text-text-primary mt-1">
                  {project.completedDiagramCount}/{project.diagramCount}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-text-muted">
              <p>Updated {dateFormatter.format(project.updatedAt)}</p>
              {project.ownerName && (
                <p className="truncate ml-2">Shared by {project.ownerName}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Link>
  );
}
