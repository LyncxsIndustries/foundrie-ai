'use client';

import { useEffect, useState } from 'react';
import { useStorage, useMutation } from '@liveblocks/react/suspense';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, AlertCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TaskProgressTrackerRealtimeProps {
  runId: string;
  projectId: string;
  onComplete?: (result: any) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
  className?: string;
}

export function TaskProgressTrackerRealtime({
  runId,
  projectId,
  onComplete,
  onError,
  onCancel,
  className,
}: TaskProgressTrackerRealtimeProps) {
  // Subscribe to Liveblocks storage for realtime updates
  const status = useStorage((root) => root.status) as string;
  const stage = useStorage((root) => root.stage) as string;
  const progress = useStorage((root) => root.progress) as number;
  const message = useStorage((root) => root.message) as string;
  const startTimeStr = useStorage((root) => root.startTime) as string | null;
  const endTimeStr = useStorage((root) => root.endTime) as string | null;
  const buildSteps = useStorage((root) => root.buildSteps) as string[];
  const resultData = useStorage((root) => root.result) as any;
  const errorData = useStorage((root) => root.error) as any;

  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isCancelling, setIsCancelling] = useState(false);

  // Track elapsed time
  useEffect(() => {
    if (!startTimeStr || status === 'completed' || status === 'failed' || status === 'cancelled') {
      return;
    }

    const startTime = new Date(startTimeStr).getTime();
    const intervalId = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [startTimeStr, status]);

  // Handle completion callback
  useEffect(() => {
    if (status === 'completed' && resultData && onComplete) {
      onComplete(resultData);
    }
  }, [status, resultData, onComplete]);

  // Handle error callback
  useEffect(() => {
    if (status === 'failed' && errorData && onError) {
      onError(new Error(errorData.message || 'Task failed'));
    }
  }, [status, errorData, onError]);

  // Fallback: Poll API if Liveblocks hasn't received updates after 5 seconds
  useEffect(() => {
    if (status !== 'pending' && status !== 'running') return;

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/tasks/${runId}/progress`);
        if (response.ok) {
          const data = await response.json();
          
          // If API has newer data than Liveblocks, it means broadcast failed
          // This is a fallback safety mechanism
          if (data.status !== status && data.status !== 'EXECUTING') {
            console.warn('Liveblocks sync delayed, using API fallback');
            // Trigger manual storage update via mutation
            // (In production, the backend would handle this)
          }
        }
      } catch (err) {
        console.error('Fallback poll error:', err);
      }
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [runId, status]);

  const handleCancel = async () => {
    if (isCancelling) return;
    
    setIsCancelling(true);
    
    try {
      const response = await fetch(`/api/tasks/${runId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel task');
      }

      // Status will be updated via Liveblocks broadcast
      if (onCancel) {
        onCancel();
      }
    } catch (err) {
      console.error('Cancel error:', err);
      if (onError) {
        onError(err as Error);
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = () => {
    if (!endTimeStr || !startTimeStr) return null;
    const start = new Date(startTimeStr).getTime();
    const end = new Date(endTimeStr).getTime();
    return end - start;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
      case 'running':
        return <Loader2 className="h-5 w-5 animate-spin text-accent-primary" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-error" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-text-tertiary" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-accent-primary" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
      case 'running':
        return 'text-accent-primary';
      case 'completed':
        return 'text-success';
      case 'failed':
        return 'text-error';
      case 'cancelled':
        return 'text-text-tertiary';
      default:
        return 'text-accent-primary';
    }
  };

  const totalDuration = getTotalDuration();

  return (
    <div className={cn('space-y-4', className)}>
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className={cn('font-medium', getStatusColor())}>
              {status === 'pending' && 'Queued'}
              {status === 'running' && 'Processing'}
              {status === 'completed' && 'Completed'}
              {status === 'failed' && 'Failed'}
              {status === 'cancelled' && 'Cancelled'}
            </h3>
            <p className="text-sm text-text-secondary">{message}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {(status === 'pending' || status === 'running') && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isCancelling}
              className="text-xs"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel'}
            </Button>
          )}
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Clock className="h-4 w-4" />
            <span>{formatTime(elapsedTime)}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {status !== 'failed' && (
        <div className="space-y-2">
          <Progress value={progress || 0} className="h-2" />
          <div className="flex justify-between text-xs text-text-tertiary">
            <span className="capitalize">{stage?.replace(/-/g, ' ') || 'initializing'}</span>
            <span>{progress || 0}%</span>
          </div>
        </div>
      )}

      {/* Build Steps (expandable detail) */}
      {buildSteps && buildSteps.length > 0 && (
        <details className="rounded-lg border border-border bg-surface-elevated p-3">
          <summary className="cursor-pointer text-sm font-medium text-text-secondary">
            Build Details ({buildSteps.length} steps)
          </summary>
          <div className="mt-2 space-y-1">
            {buildSteps.slice(-5).map((step: string, i: number) => (
              <div key={i} className="text-xs text-text-tertiary font-mono">
                {step}
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Error Display */}
      {errorData && (
        <div className="rounded-lg border border-error bg-error/10 p-3">
          <p className="text-sm font-medium text-error">Error</p>
          <p className="text-xs text-error/80 mt-1">{errorData.message}</p>
        </div>
      )}

      {/* Completion Summary */}
      {status === 'completed' && totalDuration && (
        <div className="rounded-lg border border-success/30 bg-success/10 p-3">
          <p className="text-sm font-medium text-success">
            Completed in {formatTime(totalDuration)}
          </p>
          {resultData && resultData.size && (
            <p className="text-xs text-success/80 mt-1">
              Size: {(resultData.size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
        </div>
      )}
      
      {/* Realtime indicator */}
      <div className="flex items-center gap-2 text-xs text-text-tertiary">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span>Real-time updates enabled</span>
      </div>
    </div>
  );
}
