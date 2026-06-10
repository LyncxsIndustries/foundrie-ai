"use client";

import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";

type DiagramStatus = "QUEUED" | "GENERATING" | "RENDERING" | "CAPTURING" | "DONE" | "ERROR";

interface Diagram {
  id: string;
  diagramTypeId: string;
  category: string;
  name: string;
  status: DiagramStatus;
  orderInCategory: number;
  errorMessage?: string | null;
}

interface GenerationProgressProps {
  diagrams: Diagram[];
}

const statusIcons = {
  QUEUED: Clock,
  GENERATING: Loader2,
  RENDERING: Loader2,
  CAPTURING: Loader2,
  DONE: CheckCircle2,
  ERROR: XCircle,
};

const statusColors = {
  QUEUED: "text-muted-foreground",
  GENERATING: "text-accent-primary animate-spin",
  RENDERING: "text-accent-primary animate-spin",
  CAPTURING: "text-accent-primary animate-spin",
  DONE: "text-success",
  ERROR: "text-destructive",
};

export function GenerationProgress({ diagrams }: GenerationProgressProps) {
  const diagramsByCategory = diagrams.reduce(
    (acc, diagram) => {
      if (!acc[diagram.category]) {
        acc[diagram.category] = [];
      }
      acc[diagram.category].push(diagram);
      return acc;
    },
    {} as Record<string, Diagram[]>
  );

  const categories = Object.keys(diagramsByCategory).sort();

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category} className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/70">
            {category}
          </h3>
          <div className="space-y-1">
            {diagramsByCategory[category].map((diagram) => {
              const Icon = statusIcons[diagram.status];
              const colorClass = statusColors[diagram.status];

              return (
                <div
                  key={diagram.id}
                  className="flex items-center gap-3 rounded-md border border-border bg-surface-secondary p-3"
                >
                  <Icon className={`h-5 w-5 ${colorClass}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{diagram.name}</p>
                    {diagram.errorMessage && (
                      <p className="text-xs text-destructive">{diagram.errorMessage}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">
                    {diagram.status.toLowerCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
