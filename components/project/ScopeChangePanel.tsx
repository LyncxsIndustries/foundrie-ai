"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ImpactAnalysisReport } from "@/lib/scope/impact-analysis";

export function ScopeChangePanel({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [isComputing, setIsComputing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [report, setReport] = useState<ImpactAnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCompute = async () => {
    if (!description.trim()) return;
    setIsComputing(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/scope-changes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "COMPUTE", changeDescription: description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to compute impact");
      setReport(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsComputing(false);
    }
  };

  const handleAction = async (action: "APPROVE" | "REJECT") => {
    if (!report) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/scope-changes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          changeDescription: description,
          report,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action.toLowerCase()}`);
      
      // Reset after successful action
      setReport(null);
      setDescription("");
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 bg-zinc-900/50 border border-zinc-800 p-6 rounded-lg">
      <div>
        <h3 className="text-lg font-medium text-zinc-100">Scope Change Request</h3>
        <p className="text-sm text-zinc-400 mt-1">
          Describe the feature you want to add, remove, or redesign. We will calculate the impact on the existing project plan before applying it.
        </p>
      </div>

      <div className="space-y-4">
        <Textarea
          placeholder="e.g., Let's add a user referral system..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[120px] bg-zinc-950 border-zinc-800 focus-visible:ring-emerald-500/50"
          disabled={isComputing || isSubmitting || report !== null}
        />

        {error && <div className="text-sm text-red-500">{error}</div>}

        {!report ? (
          <Button
            onClick={handleCompute}
            disabled={!description.trim() || isComputing}
            className="w-full sm:w-auto"
          >
            {isComputing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Analyze Impact
          </Button>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 space-y-4">
              <h4 className="font-medium text-emerald-400">Impact Analysis Report</h4>
              
              <div className="text-sm text-zinc-300">
                {report.impactSummary}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                <div>
                  <div className="text-xs text-zinc-500 uppercase font-semibold">Change Type</div>
                  <div className="text-lg text-zinc-100">{report.changeType}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 uppercase font-semibold">Timeline Delta</div>
                  <div className="text-lg text-zinc-100">+{report.timelineDeltaDays} Days</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 uppercase font-semibold">Cost Delta</div>
                  <div className="text-lg text-zinc-100">${report.costDeltaUsd}</div>
                </div>
              </div>

              {(report.affectedCompletedFeatures.length > 0 || report.affectedPendingFeatures.length > 0 || report.newFeaturesNeeded.length > 0) && (
                <div className="pt-4 border-t border-zinc-800 space-y-3">
                  {report.affectedCompletedFeatures.length > 0 && (
                    <div>
                      <div className="text-xs text-zinc-500 uppercase font-semibold mb-1">Completed Features Needing Revision</div>
                      <ul className="text-sm text-zinc-300 list-disc list-inside">
                        {report.affectedCompletedFeatures.map(slug => <li key={slug}>{slug}</li>)}
                      </ul>
                    </div>
                  )}
                  {report.affectedPendingFeatures.length > 0 && (
                    <div>
                      <div className="text-xs text-zinc-500 uppercase font-semibold mb-1">Pending Features Affected</div>
                      <ul className="text-sm text-zinc-300 list-disc list-inside">
                        {report.affectedPendingFeatures.map(slug => <li key={slug}>{slug}</li>)}
                      </ul>
                    </div>
                  )}
                  {report.affectedInProgressFeatures.length > 0 && (
                    <div>
                      <div className="text-xs text-zinc-500 uppercase font-semibold mb-1">In-Progress Features Affected</div>
                      <ul className="text-sm text-zinc-300 list-disc list-inside">
                        {report.affectedInProgressFeatures.map(slug => <li key={slug}>{slug}</li>)}
                      </ul>
                    </div>
                  )}
                  {report.newFeaturesNeeded.length > 0 && (
                    <div>
                      <div className="text-xs text-zinc-500 uppercase font-semibold mb-1">New Features Required</div>
                      <ul className="text-sm text-zinc-300 list-disc list-inside">
                        {report.newFeaturesNeeded.map(f => <li key={f.title}>{f.title}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => handleAction("APPROVE")}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Approve & Apply
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAction("REJECT")}
                disabled={isSubmitting}
                className="border-zinc-700 hover:bg-zinc-800"
              >
                Reject
              </Button>
              <Button
                variant="ghost"
                onClick={() => setReport(null)}
                disabled={isSubmitting}
                className="text-zinc-400 hover:text-zinc-300"
              >
                Edit Description
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected scope change error";
}
