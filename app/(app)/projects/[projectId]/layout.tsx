// Project shell layout (Feature 06).
// Resolves the project once (ownership-scoped) and wraps every phase page with
// the workspace shell + 8-phase navigation. Ownership failures return 404 (never
// 403), so the layout never confirms another user's project exists. Phase pages
// render only their main content; the nav and chrome live here.
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";

import { WorkspaceShell } from "@/components/shells/workspace-shell";
import { ProjectPhaseNav } from "@/components/project/ProjectPhaseNav";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { db } from "@/lib/db";

// User-scoped data must never be cached across requests.
export const dynamic = "force-dynamic";

interface ProjectLayoutProps {
  children: ReactNode;
  params: Promise<{ projectId: string }>;
}

export default async function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
  const user = await getAuthUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { projectId } = await params;

  // Ownership and membership-scoped read
  const project = await db.project.findFirst({
    where: {
      id: projectId,
      OR: [{ userId: user.id }, { members: { some: { userId: user.id } } }],
    },
    select: { id: true, status: true },
  });
  if (!project) {
    notFound();
  }

  return (
    <WorkspaceShell
      nav={<ProjectPhaseNav projectId={project.id} status={project.status} />}
      className="min-h-[calc(100svh-3.5rem)]"
    >
      {children}
    </WorkspaceShell>
  );
}
