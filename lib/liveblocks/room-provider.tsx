"use client";

import { ReactNode } from "react";
import { RoomProvider, ClientSideSuspense } from "@liveblocks/react";
import { SurfaceLoading } from "@/components/shells/surface-states";
import { DEFAULT_PRESENCE } from "./presence";

interface LiveblocksRoomProviderProps {
  projectId: string;
  children: ReactNode;
}

export function LiveblocksRoomProvider({
  projectId,
  children,
}: LiveblocksRoomProviderProps) {
  return (
    <RoomProvider
      id={`project:${projectId}`}
      initialPresence={DEFAULT_PRESENCE}
      initialStorage={{}}
    >
      <ClientSideSuspense fallback={<SurfaceLoading />}>
        {children}
      </ClientSideSuspense>
    </RoomProvider>
  );
}
