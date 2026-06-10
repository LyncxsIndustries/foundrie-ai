"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Play, CheckCircle } from "lucide-react";

interface GenerationControlsProps {
  projectId: string;
  onGenerate: () => void;
  onApprove?: () => void;
  showApprovalButton: boolean;
  isGenerating: boolean;
}

export function GenerationControls({
  projectId,
  onGenerate,
  onApprove,
  showApprovalButton,
  isGenerating,
}: GenerationControlsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/diagrams/${projectId}/generate`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start generation");
      }

      onGenerate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!onApprove) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/diagrams/${projectId}/approve-system-context`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve");
      }

      onApprove();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Button
          onClick={handleGenerate}
          disabled={loading || isGenerating}
          size="lg"
        >
          {loading || isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Generate Diagrams
            </>
          )}
        </Button>

        {showApprovalButton && (
          <Button
            onClick={handleApprove}
            disabled={loading}
            variant="default"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve System Context & Continue
              </>
            )}
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
