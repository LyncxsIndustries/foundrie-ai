import {
  WorkspaceShell,
  SurfaceHeader,
} from "@/components/shells/workspace-shell";
import { SurfaceEmpty } from "@/components/shells/surface-states";
import { Button } from "@/components/ui/button";
import { FolderPlus } from "lucide-react";

/**
 * Dashboard shell: project list and phase status. Real project data arrives in
 * later features; this renders the structural frame and empty state.
 */
export default function DashboardPage() {
  return (
    <WorkspaceShell
      nav={<div className="p-4 text-sm text-text-muted">Navigation</div>}
    >
      <SurfaceHeader
        title="Projects"
        description="Your architectural workspaces."
        actions={
          <Button size="lg" className="min-touch">
            <FolderPlus />
            New project
          </Button>
        }
      />
      <SurfaceEmpty
        icon={<FolderPlus className="size-8" />}
        title="No projects yet"
        message="Start a new project to begin discovery and shape your architecture."
        action={
          <Button variant="outline" size="lg" className="min-touch">
            <FolderPlus />
            New project
          </Button>
        }
      />
    </WorkspaceShell>
  );
}
