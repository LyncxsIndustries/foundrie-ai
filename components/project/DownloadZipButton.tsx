"use client";

import { useState, useEffect } from "react";
import { Download, Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

interface DownloadZipButtonProps {
  projectId: string;
}

type ButtonState = "idle" | "generating" | "ready" | "error";

interface CachedZipMetadata {
  cached: true;
  fileName: string;
  url: string;
  size: number;
}

interface TriggeredGeneration {
  cached: false;
  runId: string;
}

interface PollResponse {
  status: "generating" | "completed" | "failed";
  fileName?: string;
  url?: string;
  size?: number;
  progress?: number;
  error?: string;
}

export function DownloadZipButton({ projectId }: DownloadZipButtonProps) {
  const [state, setState] = useState<ButtonState>("idle");
  const [runId, setRunId] = useState<string | null>(null);
  const [zipUrl, setZipUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Polling effect
  useEffect(() => {
    if (!runId || state !== "generating") return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/projects/${projectId}/download?runId=${runId}`
        );

        if (!response.ok) {
          throw new Error("Failed to check status");
        }

        const data: PollResponse = await response.json();

        if (data.status === "completed" && data.url && data.fileName) {
          setZipUrl(data.url);
          setFileName(data.fileName);
          setState("ready");
          setProgress(100);
          setRetryCount(0); // Reset on success
          clearInterval(pollInterval);
        } else if (data.status === "failed") {
          setState("error");
          setError(data.error || "Generation failed");
          clearInterval(pollInterval);
        } else {
          setProgress(data.progress || 0);
        }
      } catch (err) {
        setState("error");
        setError("Failed to check generation status");
        clearInterval(pollInterval);
      }
    }, process.env.NODE_ENV === "test" ? 100 : 2000);

    return () => clearInterval(pollInterval);
  }, [runId, projectId, state]);

  const handleDownload = async () => {
    // Disable immediately (idempotency)
    setState("generating");
    setError(null);
    setProgress(0);

    try {
      const response = await fetch(`/api/projects/${projectId}/download`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to prepare download");
      }

      const data: CachedZipMetadata | TriggeredGeneration =
        await response.json();

      if (data.cached) {
        // ZIP is cached, download immediately
        setZipUrl(data.url);
        setFileName(data.fileName);
        setState("ready");
        setProgress(100);
        setRetryCount(0); // Reset on success
        
        // Trigger browser download
        const link = document.createElement("a");
        link.href = data.url;
        link.download = data.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Reset to idle after download
        setTimeout(() => setState("idle"), 2000);
      } else {
        // Generation triggered, start polling
        setRunId(data.runId);
      }
    } catch (err) {
      setState("error");
      setError("Failed to prepare download");
      setRetryCount(prev => prev + 1); // Increment on error
    }
  };

  const handleRetry = () => {
    setState("idle");
    setError(null);
    setRunId(null);
    setProgress(0);
  };

  const triggerBrowserDownload = () => {
    if (!zipUrl || !fileName) return;

    const link = document.createElement("a");
    link.href = zipUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Reset to idle after download
    setTimeout(() => {
      setState("idle");
      setRetryCount(0); // Reset retry count after successful download
    }, 2000);
  };

  if (state === "error") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-lg border border-border-error bg-surface-error/10 p-4">
          <AlertCircle className="h-5 w-5 text-text-error" />
          <div className="flex-1">
            <p className="text-sm font-medium text-text-error">
              {error || "Download failed"}
            </p>
            {retryCount > 0 && (
              <p className="text-xs text-text-tertiary mt-1">
                Retry attempt {retryCount}
              </p>
            )}
          </div>
          <Button onClick={handleRetry} variant="outline" size="sm">
            Retry
          </Button>
        </div>

        {/* Warning after 3 attempts */}
        {retryCount >= 3 && retryCount < 5 && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
            <p className="text-sm text-yellow-800">
              <strong>Multiple retries detected.</strong> If the issue persists, try refreshing
              the page or check your network connection.
            </p>
          </div>
        )}

        {/* Support link after 5 attempts */}
        {retryCount >= 5 && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
            <p className="text-sm text-orange-800 mb-2">
              <strong>Still having trouble?</strong> This might be a server issue.
            </p>
            <a
              href="/support"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-orange-600 hover:text-orange-700 underline"
            >
              Contact Support →
            </a>
          </div>
        )}
      </div>
    );
  }

  if (state === "ready") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border-secondary bg-surface-secondary p-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-text-primary">ZIP ready</p>
          <p className="text-xs text-text-tertiary mt-1">{fileName}</p>
        </div>
        <Button onClick={triggerBrowserDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </div>
    );
  }

  if (state === "generating") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border-secondary bg-surface-secondary p-4">
        <Loader2 className="h-5 w-5 animate-spin text-accent-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium text-text-primary">
            Generating package...
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            {progress > 0
              ? `Progress: ${Math.round(progress)}%`
              : "Building ZIP with context files, diagrams, and specs"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Button onClick={handleDownload} disabled={state !== "idle"}>
      <Download className="mr-2 h-4 w-4" />
      Download ZIP
    </Button>
  );
}
