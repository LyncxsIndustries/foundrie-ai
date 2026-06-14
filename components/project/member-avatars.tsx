import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MemberAvatarProps {
  id: string;
  name: string | null;
  email: string;
}

interface MemberAvatarsProps {
  members: MemberAvatarProps[];
}

export function MemberAvatars({ members }: MemberAvatarsProps) {
  const maxDisplay = 3;
  const displayMembers = members.slice(0, maxDisplay);
  const overflow = members.length - maxDisplay;

  if (members.length === 0) return null;

  return (
    <div className="flex -space-x-2 mr-2">
      {displayMembers.map((m, i) => (
        <Avatar
          key={m.id}
          className="size-8 border-2 border-background"
          style={{ zIndex: 10 - i }}
        >
          <AvatarFallback className="bg-bg-surface text-xs font-medium text-text-secondary">
            {m.name ? m.name.charAt(0).toUpperCase() : m.email.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ))}
      {overflow > 0 && (
        <div
          className="flex size-8 items-center justify-center rounded-full border-2 border-background bg-bg-surface text-xs font-medium text-text-secondary"
          style={{ zIndex: 0 }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
