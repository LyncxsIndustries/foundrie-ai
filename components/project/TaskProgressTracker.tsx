"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, AlertCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TaskProgress {
  stage: string;
  progress: number;
  message: string;
  startTime?: string;
  endTime?: string;
  totalDurationMs?: number;
  buildSteps?: string[];
}

interface TaskProgressTrackerProps {
  runId: string;
  projectId: string; // Added for cancel authorization
  onComplete?: (result: any) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
  className?: string;
}

export function TaskProgressTracker({
  runId,
  projectId,
  onComplete,
  onError,
  onCancel,
  className,
}: TaskProgressTrackerProps) {
  const [status, setStatus] = useState<"pending" | "running" | "completed" | "failed" | "cancelled">("pending");
  const [progress, setProgress] = useState<TaskProgress>({
    stage: "initializing",
    progress: 0,
    message: "Initializing...",
  });
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let startTime = Date.now();

    const pollProgress = async () => {
      try {
        const response = await fetch(`/api/tasks/${runId}/progress`);
        if (!response.ok) {
          throw new Error("Failed to fetch progress");
        }

        const data = await response.json();
        
        // Update progress from metadata
        if (data.metadata) {
          setProgress({
            stage: data.metadata.stage || "running",
            progress: data.metadata.progress || 0,
            message: data.metadata.message || "Processing...",
            startTime: data.metadata.startTime,
            endTime: data.metadata.endTime,
            totalDurationMs: data.metadata.totalDurationMs,
            buildSteps: data.metadata.buildSteps || [],
          });
        }

        // Update status
        if (data.status === "COMPLETED") {
          setStatus("completed");
          setResult(data.output);
          if (onComplete) {
            onComplete(data.output);
          }
          clearInterval(intervalId);
        } else if (data.status === "FAILED" || data.status === "CRASHED") {
          setStatus("failed");
          const err = new Error(data.error?.message || "Task failed");
          setError(err);
          if (onError) {
            onError(err);
          }
          clearInterval(intervalId);
        } else {
          setStatus("running");
        }
      } catch (err) {
        console.error("Progress poll error:", err);
        setError(err as Error);
        setStatus("failed");
        if (onError) {
          onError(err as Error);
        }
        clearInterval(intervalId);
      }
    };

    // Poll every 500ms for real-time feel
    intervalId = setInterval(pollProgress, 500);
    pollProgress(); // Initial call

    // Update elapsed time every second
    const timeIntervalId = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);

    return () => {
      clearInterval(intervalId);
      clearInterval(timeIntervalId);
    };
  }, [runId, onComplete, onError]);

  const handleCancel = async () => {
    if (isCancelling) return;
    
    setIsCancelling(true);
    
    try {
      const response = await fetch(`/api/tasks/${runId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel task");
      }

      setStatus("cancelled");
      setProgress((prev) => ({
        ...prev,
        message: "Task cancelled by user",
      }));

      if (onCancel) {
        onCancel();
      }
    } catch (err) {
      console.error("Cancel error:", err);
      setError(err as Error);
    } finally {
      setIsCancelling(false);
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getStatusIcon = () => {
    switch (status) {
      case "pending":
      case "running":
        return <Loader2 className="h-5 w-5 animate-spin text-accent-primary" />;
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-error" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-text-tertiary" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "pending":
      case "running":
        return "text-accent-primary";
      case "completed":
        return "text-success";
      case "failed":
        return "text-error";
      case "cancelled":
        return "text-text-tertiary";
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className={cn("font-medium", getStatusColor())}>
              {status === "pending" && "Queued"}
              {status === "running" && "Processing"}
              {status === "completed" && "Completed"}
              {status === "failed" && "Failed"}
              {status === "cancelled" && "Cancelled"}
            </h3>
            <p className="text-sm text-text-secondary">{progress.message}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {(status === "pending" || status === "running") && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isCancelling}
              className="text-xs"
            >
              {isCancelling ? "Cancelling..." : "Cancel"}
            </Button>
          )}
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Clock className="h-4 w-4" />
            <span>{formatTime(elapsedTime)}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {status !== "failed" && (
        <div className="space-y-2">
          <Progress value={progress.progress} className="h-2" />
          <div className="flex justify-between text-xs text-text-tertiary">
            <span className="capitalize">{progress.stage.replace(/-/g, " ")}</span>
            <span>{progress.progress}%</span>
          </div>
        </div>
      )}

      {/* Build Steps (expandable detail) */}
      {progress.buildSteps && progress.buildSteps.length > 0 && (
        <details className="rounded-lg border border-border bg-surface-elevated p-3">
          <summary className="cursor-pointer text-sm font-medium text-text-secondary">
            Build Details ({progress.buildSteps.length} steps)
          </summary>
          <div className="mt-2 space-y-1">
            {progress.buildSteps.slice(-5).map((step, i) => (
              <div key={i} className="text-xs text-text-tertiary font-mono">
                {step}
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-error bg-error/10 p-3">
          <p className="text-sm font-medium text-error">Error</p>
          <p className="text-xs text-error/80 mt-1">{error.message}</p>
        </div>
      )}

      {/* Completion Summary */}
      {status === "completed" && progress.totalDurationMs && (
        <div className="rounded-lg border border-success/30 bg-success/10 p-3">
          <p className="text-sm font-medium text-success">
            Completed in {formatTime(progress.totalDurationMs)}
          </p>
          {result && result.size && (
            <p className="text-xs text-success/80 mt-1">
              Size: {(result.size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
        </div>
      )}
    </div>
  );
}
