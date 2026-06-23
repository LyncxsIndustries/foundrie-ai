"use client";

import { useState } from "react";
import { CheckIcon, XIcon, RefreshCwIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ExecutionPlan {
  id: string;
  projectId: string;
  taskType: string;
  status: "PROPOSED" | "APPROVED" | "REVISION_REQUESTED" | "REJECTED" | "EXECUTED";
  content: string;
  revisionNotes?: string | null;
  createdAt: string | Date;
}

interface ExecutionPlanPanelProps {
  plan: ExecutionPlan;
  onPlanUpdated: () => void;
  className?: string;
}

export function ExecutionPlanPanel({
  plan,
  onPlanUpdated,
  className,
}: ExecutionPlanPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviseInput, setShowReviseInput] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const handleAction = async (action: "approve" | "reject" | "revise" | "execute", notes?: string) => {
    try {
      setIsSubmitting(true);
      setMessage(null);
      const res = await fetch(`/api/projects/${plan.projectId}/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, revisionNotes: notes }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update plan");
      }

      setMessage({ text: `Plan updated successfully`, type: "success" });
      if (action === "revise") {
        setShowReviseInput(false);
        setRevisionNotes("");
      }
      onPlanUpdated();
    } catch (error: any) {
      setMessage({ text: error.message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-4 p-4 border border-border-default bg-bg-surface rounded-md", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">
          Execution Plan: {plan.taskType}
        </h3>
        <div className="px-2 py-1 text-xs font-medium bg-bg-elevated text-text-secondary rounded">
          {plan.status}
        </div>
      </div>
      
      <div className="prose prose-invert max-w-none text-sm text-text-secondary bg-bg-canvas p-4 rounded border border-border-default overflow-y-auto max-h-[400px]">
        <ReactMarkdown>{plan.content}</ReactMarkdown>
      </div>

      {message && (
        <div className={cn("p-2 text-sm rounded", message.type === "error" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400")}>
          {message.text}
        </div>
      )}

      {plan.status === "PROPOSED" && (
        <div className="flex flex-col gap-4 mt-2">
          {showReviseInput ? (
            <div className="flex flex-col gap-2">
              <Textarea
                placeholder="What should be changed?"
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                disabled={isSubmitting}
                className="min-h-[100px]"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowReviseInput(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleAction("revise", revisionNotes)}
                  disabled={isSubmitting || !revisionNotes.trim()}
                >
                  {isSubmitting ? <Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Submit Revision Request
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                onClick={() => handleAction("approve")}
                disabled={isSubmitting}
                className="bg-state-success hover:bg-state-success/90 text-black"
              >
                {isSubmitting ? <Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> : <CheckIcon className="w-4 h-4 mr-2" />}
                Approve
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowReviseInput(true)}
                disabled={isSubmitting}
              >
                <RefreshCwIcon className="w-4 h-4 mr-2" />
                Request Revision
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleAction("reject")}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> : <XIcon className="w-4 h-4 mr-2" />}
                Reject
              </Button>
            </div>
          )}
        </div>
      )}
      {plan.status === "APPROVED" && (
        <div className="flex flex-col gap-4 mt-2">
          <Button
            variant="default"
            onClick={() => handleAction("execute")}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> : <CheckIcon className="w-4 h-4 mr-2" />}
            Mark Executed
          </Button>
        </div>
      )}
    </div>
  );
}
