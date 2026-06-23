"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { ProjectMemberRole } from "@/lib/generated/prisma/enums";

interface Member {
  id: string;
  user: { name: string | null; email: string };
  role: ProjectMemberRole;
  joinedAt: Date;
}

interface MemberAvatarsProps {
  projectId: string;
  onOpenModal: () => void;
}

export function MemberAvatars({ projectId, onOpenModal }: MemberAvatarsProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/members`)
      .then((res) => res.json())
      .then((data) => {
        setMembers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <button
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-surface-elevated"
        disabled
      >
        <Users className="h-4 w-4" />
      </button>
    );
  }

  const displayMembers = members.slice(0, 4);
  const overflow = members.length > 4 ? members.length - 4 : 0;

  return (
    <button
      onClick={onOpenModal}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-surface-elevated transition-colors"
      aria-label="View project members"
    >
      <Users className="h-4 w-4" />
      <span className="text-text-secondary">
        {members.length} {members.length === 1 ? "member" : "members"}
      </span>
      {overflow > 0 && (
        <span className="text-xs text-text-tertiary">+{overflow}</span>
      )}
    </button>
  );
}
