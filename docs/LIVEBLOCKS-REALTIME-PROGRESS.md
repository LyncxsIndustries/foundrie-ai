# Liveblocks Real-time Task Progress

This implementation replaces HTTP polling with Liveblocks real-time broadcasting for instant task progress updates.

## Architecture

### Components

1. **TaskProgressRoomProvider** - Liveblocks room provider that wraps progress UI
   - Creates a unique room per task (`task-progress-{runId}`)
   - Initializes storage with default progress state
   - Throttles updates to 60fps (16ms)

2. **TaskProgressTrackerRealtime** - Real-time progress component
   - Subscribes to Liveblocks storage for instant updates
   - Displays progress, status, elapsed time, build steps
   - Includes 5-second fallback polling as safety mechanism
   - Shows "Real-time updates enabled" indicator

3. **broadcast-progress.ts** - Backend helpers for broadcasting
   - `broadcastTaskProgress()` - Update room storage
   - `initializeTaskProgressRoom()` - Start task tracking
   - `completeTaskProgress()` - Mark task complete
   - `failTaskProgress()` - Mark task failed
   - `cancelTaskProgress()` - Mark task cancelled
   - `updateTaskProgress()` - Update stage and progress %

### Data Flow

```
Trigger.dev Task
  ↓ (progress updates)
Backend Helper (broadcast-progress.ts)
  ↓ (Liveblocks SDK)
Liveblocks Server
  ↓ (WebSocket broadcast)
TaskProgressTrackerRealtime
  ↓ (useStorage hook)
UI Updates (instant, no polling)
```

## Usage

### Wrap Progress Tracker in Room Provider

```tsx
import { TaskProgressRoomProvider } from '@/components/project/TaskProgressRoomProvider';
import { TaskProgressTrackerRealtime } from '@/components/project/TaskProgressTrackerRealtime';

function DownloadPage() {
  const [runId, setRunId] = useState<string | null>(null);

  return (
    <>
      {runId && (
        <TaskProgressRoomProvider runId={runId}>
          <TaskProgressTrackerRealtime
            runId={runId}
            projectId={projectId}
            onComplete={(result) => console.log('Done:', result)}
            onError={(err) => console.error('Failed:', err)}
            onCancel={() => console.log('Cancelled')}
          />
        </TaskProgressRoomProvider>
      )}
    </>
  );
}
```

### Broadcast Progress from Trigger.dev Task

```ts
import { task } from '@trigger.dev/sdk';
import { 
  initializeTaskProgressRoom,
  updateTaskProgress,
  completeTaskProgress,
  failTaskProgress 
} from '@/lib/realtime/broadcast-progress';

export const buildZipTask = task({
  id: 'build-project-zip',
  run: async (payload, { ctx }) => {
    const runId = ctx.run.id;
    
    try {
      // Initialize room
      await initializeTaskProgressRoom(runId);
      
      // Update progress at each stage
      await updateTaskProgress(runId, 'building-context', 25, 'Building context files...');
      const context = await buildContext();
      
      await updateTaskProgress(runId, 'building-specs', 50, 'Building feature specs...');
      const specs = await buildSpecs();
      
      await updateTaskProgress(runId, 'compressing-zip', 75, 'Compressing ZIP...');
      const zipBuffer = await createZip(context, specs);
      
      await updateTaskProgress(runId, 'uploading', 90, 'Uploading to storage...');
      const url = await uploadToVercelBlob(zipBuffer);
      
      // Mark complete
      await completeTaskProgress(runId, { url, size: zipBuffer.length }, startTime);
      
      return { url, size: zipBuffer.length };
    } catch (error) {
      await failTaskProgress(runId, error as Error, startTime);
      throw error;
    }
  },
});
```

## Environment Variables

Required environment variables:

```env
# Liveblocks (already configured for canvas)
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_prod_...
LIVEBLOCKS_SECRET_KEY=sk_prod_...
```

## Fallback Safety

The implementation includes a 5-second fallback polling mechanism:

- If Liveblocks hasn't received updates after 5 seconds, the component polls the API once
- This ensures progress updates even if WebSocket connection fails
- Fallback is non-intrusive and only activates when needed

## Migration from Polling

### Old Component (Polling)
```tsx
<TaskProgressTracker
  runId={runId}
  projectId={projectId}
  onComplete={handleComplete}
/>
```

### New Component (Realtime)
```tsx
<TaskProgressRoomProvider runId={runId}>
  <TaskProgressTrackerRealtime
    runId={runId}
    projectId={projectId}
    onComplete={handleComplete}
  />
</TaskProgressRoomProvider>
```

## Benefits

1. **Instant Updates** - No 500ms polling delay, updates appear immediately
2. **Reduced Server Load** - No repeated API requests, single WebSocket connection
3. **Better UX** - Smooth progress bar animations, instant status changes
4. **Scalability** - Liveblocks handles thousands of concurrent connections
5. **Reliability** - Fallback polling as safety mechanism

## Files

- `components/project/TaskProgressRoomProvider.tsx` - Room provider wrapper
- `components/project/TaskProgressTrackerRealtime.tsx` - Real-time progress component
- `components/project/TaskProgressTracker.tsx` - Legacy polling component (keep for fallback)
- `lib/realtime/broadcast-progress.ts` - Backend broadcast helpers
- `app/api/tasks/[runId]/cancel/route.ts` - Updated with Liveblocks broadcast

## Testing

1. Start a ZIP generation task
2. Verify "Real-time updates enabled" indicator appears
3. Watch progress bar update smoothly without polling jank
4. Cancel task and verify instant UI update
5. Disable WebSocket (DevTools > Network > Throttling > Offline)
6. Verify fallback polling activates after 5 seconds

## Future Enhancements

- Add presence indicators showing who's watching progress
- Show multiple tasks in a dashboard with live updates
- Add progress replay feature for debugging
- Add collaborative task monitoring for team projects
