// Phase page placeholder (Feature 06).
// Each project phase surface renders the shell header plus an empty state until
// its own feature ships the real content (Features 10+). Keeps the workspace
// feel — header + structured empty body, not a marketing page.
//
// The "Phase N of 8" prefix is derived from the phase id via `phasePosition`
// (the single source of truth), never hardcoded, so the header can't drift from
// the nav order.
import type { ReactNode } from "react";

import { SurfaceEmpty } from "@/components/shells/surface-states";
import { ProjectHeader } from "@/components/project/project-header";
import {
  phasePosition,
  PROJECT_PHASE_COUNT,
  type ProjectPhaseId,
} from "@/components/project/project-phases";

interface PhasePlaceholderProps {
  projectId: string;
  /** The phase this surface represents; drives the derived "Phase N of 8" label. */
  phaseId: ProjectPhaseId;
  title: string;
  /** Body of the description, appended after the derived phase prefix. */
  description: string;
  emptyTitle: string;
  emptyMessage: string;
  icon: ReactNode;
}

export function PhasePlaceholder({
  projectId,
  phaseId,
  title,
  description,
  emptyTitle,
  emptyMessage,
  icon,
}: PhasePlaceholderProps) {
  const prefix = `Phase ${phasePosition(phaseId)} of ${PROJECT_PHASE_COUNT}`;
  return (
    <>
      <ProjectHeader projectId={projectId} title={title} description={`${prefix} — ${description}`} />
      <SurfaceEmpty icon={icon} title={emptyTitle} message={emptyMessage} />
    </>
  );
}
