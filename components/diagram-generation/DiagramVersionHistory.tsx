"use client";

import { useState, useEffect, useCallback } from "react";
import { HistoryIcon, RotateCcwIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DiagramVersionEntry {
  id: string;
  diagramId: string;
  version: number;
  pngStorageUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
}

interface DiagramVersionHistoryProps {
  projectId: string;
  diagramId: string;
  currentVersion: number;
  onRestored: () => void;
  className?: string;
}

export function DiagramVersionHistory({
  projectId,
  diagramId,
  currentVersion,
  onRestored,
  className,
}: DiagramVersionHistoryProps) {
  const [versions, setVersions] = useState<DiagramVersionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  const fetchVersions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/diagrams/${projectId}/${diagramId}/versions`
      );
      if (!res.ok) throw new Error("Failed to load versions");
      const data = await res.json();
      setVersions(data);
    } catch {
      setMessage({ text: "Failed to load version history.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [projectId, diagramId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleRestore = async (versionId: string) => {
    if (!window.confirm("Are you sure you want to restore this version? This will overwrite the current diagram and mark dependent feature specs for re-review.")) {
      return;
    }

    try {
      setRestoringId(versionId);
      setMessage(null);

      const res = await fetch(
        `/api/diagrams/${projectId}/${diagramId}/versions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ versionId }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to restore version");
      }

      setMessage({ text: "Version restored.", type: "success" });
      await fetchVersions();
      onRestored();
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Unknown error";
      setMessage({ text: msg, type: "error" });
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 p-4 border border-border-default bg-bg-surface rounded-md",
        className
      )}
    >
      <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
        <HistoryIcon className="w-4 h-4" />
        Version History
        <span className="text-text-muted font-normal">
          (current: v{currentVersion})
        </span>
      </h4>

      {message && (
        <div
          className={cn(
            "p-2 text-xs rounded",
            message.type === "error"
              ? "bg-state-error/20 text-state-error"
              : "bg-state-success/20 text-state-success"
          )}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2Icon className="w-4 h-4 animate-spin text-text-muted" />
        </div>
      ) : versions.length === 0 ? (
        <p className="text-xs text-text-muted py-2">
          No prior versions recorded.
        </p>
      ) : (
        <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto">
          {versions.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between text-xs p-2 rounded bg-bg-canvas border border-border-default"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-text-primary font-medium">
                  Version {v.version}
                </span>
                <span className="text-text-muted">
                  {new Date(v.createdAt).toLocaleString()}
                </span>
                {v.errorMessage && (
                  <span className="text-state-error">{v.errorMessage}</span>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleRestore(v.id)}
                disabled={restoringId !== null}
              >
                {restoringId === v.id ? (
                  <Loader2Icon className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <RotateCcwIcon className="w-3 h-3 mr-1" />
                )}
                Restore
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
