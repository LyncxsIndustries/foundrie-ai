"use client";

import { useOthersConnectionIds, useOther } from "@liveblocks/react";
import { getUserColor, getUserInitials } from "@/lib/liveblocks/presence";

function Cursor({ connectionId }: { connectionId: number }) {
  const other = useOther(connectionId, (user) => ({
    cursor: user.presence.cursor,
    name: user.info?.name,
  }));

  if (!other?.cursor) return null;

  const color = getUserColor(connectionId);
  const initials = getUserInitials(other.name);

  return (
    <div
      style={{
        position: "absolute",
        left: other.cursor.x,
        top: other.cursor.y,
        pointerEvents: "none",
        zIndex: 1000,
      }}
    >
      <svg width="24" height="36" viewBox="0 0 24 36" fill="none">
        <path
          d="M0.928955 0.928955L0.928955 26.9033L7.45507 20.3771L11.9164 31.0652L16.4879 29.0938L11.9164 18.2598L20.3771 18.2598L0.928955 0.928955Z"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>
      <div
        className="absolute left-6 top-0 rounded px-2 py-1 text-xs font-medium text-white shadow-lg"
        style={{ backgroundColor: color }}
      >
        {initials}
      </div>
    </div>
  );
}

export function PresenceLayer() {
  const connectionIds = useOthersConnectionIds();

  return (
    <>
      {connectionIds.map((id) => (
        <Cursor key={id} connectionId={id} />
      ))}
    </>
  );
}
