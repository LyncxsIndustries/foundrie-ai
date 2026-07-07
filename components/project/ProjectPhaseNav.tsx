"use client";

// 8-phase project navigation (Feature 06).
// Renders the project's phase rail and marks the active phase from the current
// pathname. The diagram phase is flagged as the diagram-first gate so the hard
// stop before spec generation is always visible (project-overview.md).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  PROJECT_PHASES,
  PROJECT_PHASE_COUNT,
  phaseHref,
  phaseForStatus,
  type ProjectPhaseId,
} from "@/components/project/project-phases";
import type { ProjectStatus } from "@/lib/generated/prisma/enums";

interface ProjectPhaseNavProps {
  projectId: string;
  /** Persisted status, used to mark how far the project has progressed. */
  status: ProjectStatus;
  className?: string;
}

/**
 * Resolve the active phase from the URL. The overview route has no trailing
 * segment, so anything that is not a known phase segment falls back to overview.
 */
function activePhaseFromPath(
  pathname: string,
  projectId: string,
): ProjectPhaseId {
  const base = `/projects/${projectId}`;
  const rest = pathname.startsWith(base)
    ? pathname.slice(base.length).replace(/^\//, "").split("/")[0]
    : "";
  const match = PROJECT_PHASES.find((phase) => phase.segment === rest);
  return match?.id ?? "overview";
}

export function ProjectPhaseNav({
  projectId,
  status,
  className,
}: ProjectPhaseNavProps) {
  const pathname = usePathname();
  const activeId = activePhaseFromPath(pathname ?? "", projectId);
  const currentId = phaseForStatus(status);
  const currentIndex = PROJECT_PHASES.findIndex((p) => p.id === currentId);

  return (
    <nav
      aria-label="Project phases"
      className={cn("flex flex-col gap-1 p-4 h-full overflow-hidden", className)}
    >
      <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-text-muted flex-shrink-0">
        Phases
      </p>
      <ol className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto">
        {PROJECT_PHASES.map((phase, index) => {
          const isActive = phase.id === activeId;
          const isCurrent = phase.id === currentId;
          const isDone = index < currentIndex;

          return (
            <li key={phase.id} className="flex-shrink-0">
              <Link
                href={phaseHref(projectId, phase)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-touch items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "bg-bg-elevated text-text-primary"
                    : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary",
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full text-[0.625rem] font-medium",
                      isDone
                        ? "bg-accent-primary-dim text-accent-primary"
                        : isCurrent
                          ? "bg-accent-primary text-bg-base"
                          : "bg-bg-subtle text-text-muted",
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="truncate">{phase.label}</span>
                </span>
                {phase.isGate ? (
                  <span
                    className="flex items-center gap-1 text-xs text-diagram-yellow"
                    title="Diagram-first gate: diagrams must be approved before specs"
                  >
                    <Lock aria-hidden className="size-3" />
                    <span className="sr-only">Diagram-first gate</span>
                    Gate
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 px-2 text-xs text-text-muted flex-shrink-0">
        {PROJECT_PHASE_COUNT} phases
      </p>
    </nav>
  );
}
