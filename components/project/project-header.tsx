import { SurfaceHeader } from "@/components/shells/workspace-shell";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { getProjectRole } from "@/lib/auth/project-access";
import { db } from "@/lib/db";
import { ProjectMemberRole } from "@/lib/generated/prisma/enums";
import { ShareModal } from "@/components/project/share-modal";
import { MemberAvatars } from "@/components/project/member-avatars";
import { Button } from "@/components/ui/button";
import { Share } from "lucide-react";

interface ProjectHeaderProps {
  projectId: string;
  title: string;
  description?: string;
}

export async function ProjectHeader({ projectId, title, description }: ProjectHeaderProps) {
  const user = await getAuthUser();
  if (!user) return <SurfaceHeader title={title} description={description} />;

  const role = await getProjectRole(projectId, user.id);
  if (!role) return <SurfaceHeader title={title} description={description} />;

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: "asc" }
      }
    }
  });

  if (!project) return <SurfaceHeader title={title} description={description} />;

  const membersList = [
    {
      id: project.user.id, // User ID for OWNER
      user: project.user,
      role: ProjectMemberRole.OWNER,
      joinedAt: project.createdAt,
    },
    ...project.members.map(m => ({
      id: m.id, // ProjectMember ID for COLLABORATOR
      user: m.user,
      role: m.role,
      joinedAt: m.joinedAt,
    }))
  ];

  const avatars = membersList.map(m => ({
    id: m.id,
    name: m.user.name,
    email: m.user.email
  }));

  return (
    <SurfaceHeader
      title={title}
      description={description}
      actions={
        <div className="flex items-center gap-2">
          <ShareModal projectId={projectId} role={role} members={membersList}>
            <button
              className="flex items-center rounded-full transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="View members"
            >
              <MemberAvatars members={avatars} />
            </button>
          </ShareModal>
          {role === ProjectMemberRole.OWNER && (
            <ShareModal projectId={projectId} role={role} members={membersList}>
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Share className="size-4 mr-2" />
                Share
              </Button>
            </ShareModal>
          )}
        </div>
      }
    />
  );
}
