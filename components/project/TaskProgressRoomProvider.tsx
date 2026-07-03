'use client';

import { ReactNode } from 'react';
import { LiveblocksProvider } from '@liveblocks/react';
import { RoomProvider } from '@liveblocks/react/suspense';

interface TaskProgressRoomProviderProps {
  runId: string;
  children: ReactNode;
}

/**
 * Liveblocks room provider for real-time task progress updates
 * Wraps task progress UI to enable instant progress broadcasting
 */
export function TaskProgressRoomProvider({
  runId,
  children,
}: TaskProgressRoomProviderProps) {
  // Use runId as room identifier
  const roomId = `task-progress-${runId}`;

  return (
    <LiveblocksProvider
      publicApiKey={process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!}
      throttle={16} // 60fps updates
    >
      <RoomProvider
        id={roomId}
        initialPresence={{}}
        initialStorage={{
          status: 'pending',
          stage: 'initializing',
          progress: 0,
          message: 'Initializing...',
          startTime: null,
          endTime: null,
          buildSteps: [],
        }}
      >
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  );
}
