"use client";

import { ReactNode } from "react";
import { RoomProvider, ClientSideSuspense } from "@liveblocks/react";
import { SurfaceLoading } from "@/components/shells/surface-states";

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
      initialPresence={{}}
      initialStorage={{}}
    >
      <ClientSideSuspense fallback={<SurfaceLoading />}>
        {children}
      </ClientSideSuspense>
    </RoomProvider>
  );
}
