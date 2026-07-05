// Dashboard surface (Feature 56: Premium Dashboard UI Redesign).
// Server component: resolves the session user and fetches projects via the
// indexed, cursor-paginated, select-only list path. Renders premium dashboard
// with Lynx Theme Pro aesthetic, GSAP animations, glass morphism, and magnetic
// interactions.
import { redirect } from 'next/navigation';
import { FolderPlus, Sparkles } from 'lucide-react';
import {
  WorkspaceShell,
} from '@/components/shells/workspace-shell';
import { WorkspaceNav } from '@/components/app-shell/workspace-nav';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { SectionHeader } from '@/components/dashboard/SectionHeader';
import { NewProjectButton } from '@/components/dashboard/NewProjectButton';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { getAuthUser } from '@/lib/auth/get-auth-user';
import { listDashboardProjects } from '@/lib/projects/list';

// User-scoped data must never be cached across requests.
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getAuthUser();
  // proxy.ts protects this route; a missing local row means the webhook has not
  // synced yet. Send the user back through sign-in rather than rendering a
  // half-authenticated shell.
  if (!user) {
    redirect('/sign-in');
  }

  const { owned, shared } = await listDashboardProjects({ userId: user.id });
  const hasProjects = owned.length > 0 || shared.length > 0;

  return (
    <WorkspaceShell
      nav={<WorkspaceNav />}
      className="min-h-[calc(100svh-3.5rem)]"
    >
      <div className="bg-background">
        {/* Hero Section */}
        <section className="px-6 py-12 border-b border-border-subtle">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-5xl font-black text-primary mb-2">
                Your Projects
              </h1>
              <p className="text-lg text-text-secondary">
                Build the future, one project at a time.
              </p>
            </div>
            {hasProjects && (
              <div className="hidden md:block">
                <NewProjectButton />
              </div>
            )}
          </div>
        </section>

        {!hasProjects ? (
          <EmptyState
            icon={<Sparkles className="size-12" />}
            title="No projects yet"
            message="Start a new project to begin discovery and shape your architecture."
            action={<NewProjectButton variant="outline" />}
          />
        ) : (
          <div className="flex flex-col gap-12 p-6 pb-24">
            {/* My Projects Section */}
            {owned.length > 0 && (
              <section>
                <SectionHeader title="My Projects" count={owned.length} />
                <DashboardGrid projects={owned} />
              </section>
            )}

            {/* Shared With Me Section */}
            {shared.length > 0 && (
              <section>
                <SectionHeader title="Shared With Me" count={shared.length} />
                <DashboardGrid projects={shared} />
              </section>
            )}
          </div>
        )}

        {/* Floating New Project Button (Mobile) */}
        {hasProjects && (
          <div className="fixed bottom-6 right-6 md:hidden">
            <NewProjectButton />
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}

