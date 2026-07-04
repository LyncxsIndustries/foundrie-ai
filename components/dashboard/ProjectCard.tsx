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
      className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div
        ref={cardRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          willChange: 'transform',
        }}
      >
        <Card className="h-full glass-medium transition-shadow duration-300 hover:shadow-high border-border-subtle">
          <CardHeader className="flex-row items-start justify-between gap-3">
            <CardTitle className="min-w-0 truncate text-text-primary">
              {project.name}
            </CardTitle>
            <div className="flex shrink-0 items-center gap-2">
              {project.ownerName && (
                <Badge variant="outline" className="border-border">
                  Shared
                </Badge>
              )}
              <Badge variant="secondary" className="bg-surface-elevated">
                {statusLabel(project.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="line-clamp-2 min-h-10 text-sm text-text-secondary">
              {project.description || 'No description yet.'}
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
            <div className="flex items-center justify-between text-xs text-text-muted mt-2">
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
