'use client';

import { useRef, useEffect } from 'react';
import { ProjectCard } from './ProjectCard';
import { gridReveal } from '@/lib/animations/dashboard';
import type { ProjectStatus } from '@/lib/generated/prisma/enums';

interface DashboardGridProps {
  projects: Array<{
    id: string;
    name: string;
    description: string | null;
    status: ProjectStatus;
    diagramCount: number;
    completedDiagramCount: number;
    featureSpecCount: number;
    updatedAt: Date;
    ownerName?: string;
  }>;
}

export function DashboardGrid({ projects }: DashboardGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gridRef.current && projects.length > 0) {
      const cards = gridRef.current.querySelectorAll('.project-card-item');
      gridReveal(Array.from(cards), {
        delay: 0.1,
        stagger: 0.08,
      });
    }
  }, [projects.length]);

  if (projects.length === 0) {
    return null;
  }

  return (
    <div
      ref={gridRef}
      className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    >
      {projects.map((project) => (
        <div key={project.id} className="project-card-item">
          <ProjectCard project={project} />
        </div>
      ))}
    </div>
  );
}
