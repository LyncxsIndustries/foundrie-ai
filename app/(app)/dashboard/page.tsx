// Dashboard surface (Feature 06).
// Server component: resolves the session user and fetches the first page of
// their projects via the indexed, cursor-paginated, select-only list path. No
// heavy child collections are loaded. Renders project cards or the empty state.
import { redirect } from "next/navigation";
import { FolderPlus, Users } from "lucide-react";

import {
  WorkspaceShell,
  SurfaceHeader,
} from "@/components/shells/workspace-shell";
import { SurfaceEmpty } from "@/components/shells/surface-states";
import { WorkspaceNav } from "@/components/app-shell/workspace-nav";
import { ProjectCard } from "@/components/project/project-card";
import { NewProjectButton } from "@/components/project/new-project-button";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { listDashboardProjects } from "@/lib/projects/list";

// User-scoped data must never be cached across requests.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getAuthUser();
  // proxy.ts protects this route; a missing local row means the webhook has not
  // synced yet. Send the user back through sign-in rather than rendering a
  // half-authenticated shell.
  if (!user) {
    redirect("/sign-in");
  }

  const { owned, shared } = await listDashboardProjects({ userId: user.id });
  const hasProjects = owned.length > 0 || shared.length > 0;

  return (
    <WorkspaceShell
      nav={<WorkspaceNav />}
      className="min-h-[calc(100svh-3.5rem)]"
    >
      <SurfaceHeader
        title="Projects"
        description="Your architectural workspaces."
        actions={<NewProjectButton />}
      />
      {!hasProjects ? (
        <SurfaceEmpty
          icon={<FolderPlus className="size-8" />}
          title="No projects yet"
          message="Start a new project to begin discovery and shape your architecture."
          action={<NewProjectButton variant="outline" />}
        />
      ) : (
        <div className="flex flex-col gap-8 p-6">
          {owned.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold tracking-tight">My Projects</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {owned.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          )}

          {shared.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="size-5 text-text-muted" />
                <h2 className="text-lg font-semibold tracking-tight">Shared With Me</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {shared.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </WorkspaceShell>
  );
}
