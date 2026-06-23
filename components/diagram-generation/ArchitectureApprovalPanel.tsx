"use client";

import { useState } from "react";
import { ShieldCheckIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DiagramSummary {
  id: string;
  name: string;
  version: number;
  status: string;
}

interface ArchitectureApprovalPanelProps {
  projectId: string;
  diagrams: DiagramSummary[];
  isApproved: boolean;
  onApproved: () => void;
  className?: string;
}

export function ArchitectureApprovalPanel({
  projectId,
  diagrams,
  isApproved,
  onApproved,
  className,
}: ArchitectureApprovalPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  const allDone = diagrams.every((d) => d.status === "DONE");

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      setMessage(null);

      const res = await fetch(`/api/diagrams/${projectId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to approve architecture");
      }

      setMessage({ text: "Architecture approved.", type: "success" });
      onApproved();
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Unknown error";
      setMessage({ text: msg, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-4 p-4 border border-border-default bg-bg-surface rounded-md",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <ShieldCheckIcon className="w-5 h-5" />
          Architecture Approval Gate
        </h3>
        <div
          className={cn(
            "px-2 py-1 text-xs font-medium rounded",
            isApproved
              ? "bg-state-success/20 text-state-success"
              : "bg-bg-elevated text-text-secondary"
          )}
        >
          {isApproved ? "APPROVED" : "PENDING"}
        </div>
      </div>

      <div className="text-sm text-text-secondary">
        {isApproved ? (
          <p>
            The architecture has been approved. Feature spec generation may
            proceed.
          </p>
        ) : allDone ? (
          <p>
            All diagrams are complete. Review them on the canvas and approve
            the architecture to unlock feature spec generation.
          </p>
        ) : (
          <p>
            Diagrams must all be in DONE status before the architecture can be
            approved. Complete diagram generation first.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1 text-xs text-text-secondary bg-bg-canvas p-3 rounded border border-border-default max-h-[200px] overflow-y-auto">
        {diagrams.map((d) => (
          <div key={d.id} className="flex items-center justify-between">
            <span>{d.name}</span>
            <span className="flex items-center gap-2">
              <span className="text-text-muted">v{d.version}</span>
              <span
                className={cn(
                  "px-1 rounded",
                  d.status === "DONE"
                    ? "bg-state-success/20 text-state-success"
                    : d.status === "ERROR"
                      ? "bg-state-error/20 text-state-error"
                      : "bg-bg-elevated text-text-muted"
                )}
              >
                {d.status}
              </span>
            </span>
          </div>
        ))}
        {diagrams.length === 0 && (
          <span className="text-text-muted">No diagrams generated yet.</span>
        )}
      </div>

      {message && (
        <div
          className={cn(
            "p-2 text-sm rounded",
            message.type === "error"
              ? "bg-state-error/20 text-state-error"
              : "bg-state-success/20 text-state-success"
          )}
        >
          {message.text}
        </div>
      )}

      {!isApproved && (
        <Button
          variant="default"
          onClick={handleApprove}
          disabled={isSubmitting || !allDone || diagrams.length === 0}
          className="bg-state-success hover:bg-state-success/90 text-black"
        >
          {isSubmitting ? (
            <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ShieldCheckIcon className="w-4 h-4 mr-2" />
          )}
          Approve Architecture
        </Button>
      )}
    </div>
  );
}
