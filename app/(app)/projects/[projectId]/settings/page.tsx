import { notFound, redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { db } from "@/lib/db";
import { ProjectSettings } from "@/components/project/ProjectSettings";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function SettingsPage({ params }: PageProps) {
  const user = await getAuthUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { projectId } = await params;

  const project = await db.project.findFirst({
    where: { id: projectId, userId: user.id },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      lastZipUrl: true,
      lastZipFileName: true,
      lastZipGeneratedAt: true,
      updatedAt: true,
    },
  });

  if (!project) {
    notFound();
  }

  return <ProjectSettings project={project} />;
}
