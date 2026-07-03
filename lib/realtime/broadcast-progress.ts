import { Liveblocks } from '@liveblocks/node';

// Initialize Liveblocks client
const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

interface ProgressUpdate {
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  stage: string;
  progress: number;
  message: string;
  startTime?: string;
  endTime?: string;
  buildSteps?: string[];
  result?: any;
  error?: { message: string };
}

/**
 * Broadcast task progress update to Liveblocks room for real-time UI updates
 * 
 * @param runId - Trigger.dev run ID
 * @param update - Progress update data
 */
export async function broadcastTaskProgress(
  runId: string,
  update: Partial<ProgressUpdate>
) {
  const roomId = `task-progress-${runId}`;

  try {
    // Update room storage with new progress data
    await liveblocks.updateStorageDocument({
      roomId,
      data: update,
    });

    console.log(`[Liveblocks] Broadcasted progress for task ${runId}:`, update);
  } catch (error) {
    console.error(`[Liveblocks] Failed to broadcast progress for task ${runId}:`, error);
    // Non-fatal: fallback to polling will handle this
  }
}

/**
 * Initialize task progress room with starting state
 * 
 * @param runId - Trigger.dev run ID
 */
export async function initializeTaskProgressRoom(runId: string) {
  await broadcastTaskProgress(runId, {
    status: 'running',
    stage: 'initializing',
    progress: 0,
    message: 'Task started',
    startTime: new Date().toISOString(),
  });
}

/**
 * Mark task as completed and broadcast final state
 * 
 * @param runId - Trigger.dev run ID
 * @param result - Task output
 * @param startTime - Task start timestamp
 */
export async function completeTaskProgress(
  runId: string,
  result: any,
  startTime?: string
) {
  await broadcastTaskProgress(runId, {
    status: 'completed',
    stage: 'completed',
    progress: 100,
    message: 'Task completed successfully',
    endTime: new Date().toISOString(),
    startTime,
    result,
  });
}

/**
 * Mark task as failed and broadcast error state
 * 
 * @param runId - Trigger.dev run ID
 * @param error - Error details
 * @param startTime - Task start timestamp
 */
export async function failTaskProgress(
  runId: string,
  error: Error,
  startTime?: string
) {
  await broadcastTaskProgress(runId, {
    status: 'failed',
    stage: 'failed',
    progress: 0,
    message: error.message || 'Task failed',
    endTime: new Date().toISOString(),
    startTime,
    error: { message: error.message },
  });
}

/**
 * Mark task as cancelled and broadcast cancelled state
 * 
 * @param runId - Trigger.dev run ID
 * @param startTime - Task start timestamp
 */
export async function cancelTaskProgress(
  runId: string,
  startTime?: string
) {
  await broadcastTaskProgress(runId, {
    status: 'cancelled',
    stage: 'cancelled',
    progress: 0,
    message: 'Task cancelled by user',
    endTime: new Date().toISOString(),
    startTime,
  });
}

/**
 * Update task progress stage and percentage
 * 
 * @param runId - Trigger.dev run ID
 * @param stage - Current stage name
 * @param progress - Progress percentage (0-100)
 * @param message - Status message
 * @param buildSteps - Optional build step logs
 */
export async function updateTaskProgress(
  runId: string,
  stage: string,
  progress: number,
  message: string,
  buildSteps?: string[]
) {
  await broadcastTaskProgress(runId, {
    status: 'running',
    stage,
    progress: Math.min(100, Math.max(0, progress)),
    message,
    buildSteps,
  });
}
