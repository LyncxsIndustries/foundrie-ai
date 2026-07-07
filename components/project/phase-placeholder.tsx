// Phase page placeholder (Feature 06).
// Each project phase surface renders the shell header plus an empty state until
// its own feature ships the real content (Features 10+). Keeps the workspace
// feel — header + structured empty body, not a marketing page.
//
// The "Phase N of 8" prefix is derived from the phase id via `phasePosition`
// (the single source of truth), never hardcoded, so the header can't drift from
// the nav order.
import type { ReactNode } from "react";

import { SurfaceHeader } from "@/components/shells/workspace-shell";
import { SurfaceEmpty } from "@/components/shells/surface-states";
import {
  phasePosition,
  PROJECT_PHASE_COUNT,
  type ProjectPhaseId,
} from "@/components/project/project-phases";

interface PhasePlaceholderProps {
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
  phaseId,
  title,
  description,
  emptyTitle,
  emptyMessage,
  icon,
}: PhasePlaceholderProps) {
  const prefix = `Phase ${phasePosition(phaseId)} of ${PROJECT_PHASE_COUNT}`;
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <SurfaceHeader title={title} description={`${prefix} — ${description}`} />
      <div className="flex-1 min-h-0 overflow-hidden">
        <SurfaceEmpty icon={icon} title={emptyTitle} message={emptyMessage} />
      </div>
    </div>
  );
}
