// Dashboard surface (Feature 06).
// Server component: resolves the session user and fetches the first page of
// their projects via the indexed, cursor-paginated, select-only list path. No
// heavy child collections are loaded. Renders project cards or the empty state.
import { redirect } from "next/navigation";
import { FolderPlus } from "lucide-react";

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

  const { projects } = await listDashboardProjects({ userId: user.id });

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
      {projects.length === 0 ? (
        <SurfaceEmpty
          icon={<FolderPlus className="size-8" />}
          title="No projects yet"
          message="Start a new project to begin discovery and shape your architecture."
          action={<NewProjectButton variant="outline" />}
        />
      ) : (
        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </WorkspaceShell>
  );
}
