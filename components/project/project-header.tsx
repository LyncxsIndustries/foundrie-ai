"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberAvatars } from "./member-avatars";
import { ShareModal } from "./share-modal";
import { ProjectMemberRole } from "@/lib/generated/prisma/enums";

interface ProjectHeaderProps {
  projectId: string;
  userRole: ProjectMemberRole | null;
}

export function ProjectHeader({ projectId, userRole }: ProjectHeaderProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const isOwner = userRole === ProjectMemberRole.OWNER;

  return (
    <>
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-surface">
        <div className="flex items-center gap-4">
          <MemberAvatars projectId={projectId} onOpenModal={() => setModalOpen(true)} />
        </div>
        {isOwner && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setModalOpen(true)}
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        )}
      </div>

      {userRole && (
        <ShareModal
          projectId={projectId}
          userRole={userRole}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
      )}
    </>
  );
}
