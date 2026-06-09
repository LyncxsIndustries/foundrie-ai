import * as React from "react";
import { ResearchDocument } from "@/lib/generated/prisma/client";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MotionPlanViewerProps {
  document: ResearchDocument | null;
  onClose: () => void;
}

export function MotionPlanViewer({ document, onClose }: MotionPlanViewerProps) {
  if (!document) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[500px] bg-surface border-l border-border shadow-2xl flex flex-col z-50">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-lg font-semibold truncate">{document.title}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1 p-6">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground bg-transparent p-0">
            {document.content}
          </pre>
        </div>
      </ScrollArea>
    </div>
  );
}
