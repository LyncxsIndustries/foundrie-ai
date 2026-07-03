/**
 * TaskProgressTracker Usage Example
 * 
 * This component shows how to integrate real-time task progress tracking
 * into your UI when triggering Trigger.dev tasks.
 */

"use client";

import { useState } from "react";
import { TaskProgressTracker } from "@/components/project/TaskProgressTracker";
import { Button } from "@/components/ui/button";

export function ZIPGenerationExample({ projectId }: { projectId: string }) {
  const [runId, setRunId] = useState<string | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleGenerateZIP = async () => {
    setIsTriggering(true);
    setDownloadUrl(null);

    try {
      // Trigger the ZIP generation task
      const response = await fetch(`/api/projects/${projectId}/generate-zip`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to trigger ZIP generation");
      }

      const data = await response.json();
      setRunId(data.runId); // Trigger.dev run ID
    } catch (error) {
      console.error("Failed to trigger ZIP generation:", error);
      alert("Failed to start ZIP generation");
    } finally {
      setIsTriggering(false);
    }
  };

  const handleComplete = (result: any) => {
    console.log("ZIP generation completed:", result);
    if (result.url) {
      setDownloadUrl(result.url);
    }
  };

  const handleError = (error: Error) => {
    console.error("ZIP generation failed:", error);
    alert(`ZIP generation failed: ${error.message}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Export Project</h2>
        <Button
          onClick={handleGenerateZIP}
          disabled={isTriggering || runId !== null}
        >
          {isTriggering ? "Starting..." : "Generate ZIP"}
        </Button>
      </div>

      {runId && (
        <TaskProgressTracker
          runId={runId}
          onComplete={handleComplete}
          onError={handleError}
          className="border border-border rounded-lg p-6"
        />
      )}

      {downloadUrl && (
        <div className="rounded-lg border border-success bg-success/10 p-6">
          <h3 className="font-medium text-success mb-2">ZIP Ready!</h3>
          <Button asChild>
            <a href={downloadUrl} download>
              Download ZIP
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Alternative: Using TaskProgressTracker in a modal/dialog
 */
export function ZIPGenerationModal({
  projectId,
  runId,
  onClose,
}: {
  projectId: string;
  runId: string;
  onClose: () => void;
}) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleComplete = (result: any) => {
    setDownloadUrl(result.url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-elevated rounded-lg p-6 max-w-2xl w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Generating ZIP Package</h2>

        <TaskProgressTracker
          runId={runId}
          onComplete={handleComplete}
          onError={(error) => {
            alert(`Failed: ${error.message}`);
            onClose();
          }}
        />

        {downloadUrl && (
          <div className="mt-6 flex gap-3">
            <Button asChild className="flex-1">
              <a href={downloadUrl} download>
                Download ZIP
              </a>
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
