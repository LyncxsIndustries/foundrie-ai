// Project phase model for the workspace navigation (Feature 06).
//
// project-overview.md defines an 8-phase product flow (Overview through Export),
// while the Prisma `ProjectStatus` enum tracks only the six *application* phases
// the backend persists. This module is the single source of truth for the 8 nav
// phases and the mapping from a stored `ProjectStatus` to the phase a project is
// currently working through, so the dashboard and `ProjectPhaseNav` stay in sync
// without duplicating the list.
import type { ProjectStatus } from "@/lib/generated/prisma/enums";

/** Stable identifiers for the 8 product phases, in flow order. */
export type ProjectPhaseId =
  | "overview"
  | "discovery"
  | "requirements"
  | "architecture"
  | "diagrams"
  | "specs"
  | "research"
  | "export";

export interface ProjectPhase {
  id: ProjectPhaseId;
  /** Human label shown in the nav. */
  label: string;
  /** Route segment appended to `/projects/{id}`; the overview is the index. */
  segment: string;
  /**
   * Marks the diagram-first gate phase. The diagram suite must be generated and
   * approved before specs are written (project-overview.md, Hard Rule 6), so the
   * nav highlights this phase to make the gate visible.
   */
  isGate?: boolean;
}

/**
 * The 8 phases in flow order. `overview` has an empty segment because it is the
 * project index route (`/projects/{id}`).
 */
export const PROJECT_PHASES: readonly ProjectPhase[] = [
  { id: "overview", label: "Overview", segment: "" },
  { id: "discovery", label: "Discovery", segment: "discovery" },
  { id: "requirements", label: "Requirements", segment: "requirements" },
  { id: "architecture", label: "Architecture", segment: "architecture" },
  { id: "diagrams", label: "Diagrams", segment: "diagrams", isGate: true },
  { id: "specs", label: "Specs", segment: "specs" },
  { id: "research", label: "Research", segment: "research" },
  { id: "export", label: "Export", segment: "export" },
] as const;

/**
 * Map a persisted `ProjectStatus` to the phase the project is actively in. The
 * stored enum has no dedicated Overview/Research/Export states; those are
 * navigational surfaces, so a project's "current" phase resolves to one of the
 * six tracked phases. `COMPLETE` resolves to Export, the terminal surface.
 */
const STATUS_TO_PHASE: Record<ProjectStatus, ProjectPhaseId> = {
  DISCOVERY: "discovery",
  REQUIREMENTS: "requirements",
  ARCHITECTURE: "architecture",
  DIAGRAM_GENERATION: "diagrams",
  SPEC_GENERATION: "specs",
  COMPLETE: "export",
};

export function phaseForStatus(status: ProjectStatus): ProjectPhaseId {
  return STATUS_TO_PHASE[status];
}

/** Short, human-friendly label for a stored status (used on dashboard cards). */
const STATUS_LABEL: Record<ProjectStatus, string> = {
  DISCOVERY: "Discovery",
  REQUIREMENTS: "Requirements",
  ARCHITECTURE: "Architecture",
  DIAGRAM_GENERATION: "Diagram Generation",
  SPEC_GENERATION: "Spec Generation",
  COMPLETE: "Complete",
};

export function statusLabel(status: ProjectStatus): string {
  return STATUS_LABEL[status];
}

/** 1-based position of a phase in the flow, for "Phase N of 8" indicators. */
export function phasePosition(id: ProjectPhaseId): number {
  const index = PROJECT_PHASES.findIndex((phase) => phase.id === id);
  if (index === -1) {
    throw new Error(`Unknown project phase: ${id}`);
  }
  return index + 1;
}

export const PROJECT_PHASE_COUNT = PROJECT_PHASES.length;

/** Build the href for a phase within a given project. */
export function phaseHref(projectId: string, phase: ProjectPhase): string {
  const base = `/projects/${projectId}`;
  return phase.segment ? `${base}/${phase.segment}` : base;
}
