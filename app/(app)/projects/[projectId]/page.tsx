import {
  WorkspaceShell,
  SurfaceHeader,
} from "@/components/shells/workspace-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const PHASES = [
  "Discovery",
  "Requirements",
  "Architecture",
  "Diagram Generation",
  "Spec Generation",
  "Complete",
] as const;

/**
 * Project shell: left phase navigation, main content, optional right inspector.
 * Phase data and live content arrive in later features.
 */
export default function ProjectShellPage() {
  return (
    <WorkspaceShell
      nav={
        <nav className="flex flex-col gap-1 p-4">
          <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-text-muted">
            Phases
          </p>
          {PHASES.map((phase, index) => (
            <div
              key={phase}
              className="flex min-touch items-center justify-between rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-bg-elevated"
            >
              <span>{phase}</span>
              {index === 0 ? <Badge variant="secondary">Active</Badge> : null}
            </div>
          ))}
        </nav>
      }
      inspector={
        <div className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Inspector
          </p>
          <p className="mt-2 text-sm text-text-secondary">
            Context-specific details appear here.
          </p>
        </div>
      }
    >
      <SurfaceHeader title="Project" description="Phase 1 of 8 — Discovery" />
      <div className="grid gap-4 p-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-text-secondary">
            Project metadata and phase status render here.
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
    </WorkspaceShell>
  );
}
