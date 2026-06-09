"use client";

import { useState, useTransition } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ResearchSynthesisActionsProps {
  projectId: string;
}

export function ResearchSynthesisActions({ projectId }: ResearchSynthesisActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const synthesize = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/research/${projectId}/synthesize`, {
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Synthesis failed");
          return;
        }
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Network error");
      }
    });
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={synthesize}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {isPending ? "Synthesizing…" : "Synthesize Research"}
      </button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
