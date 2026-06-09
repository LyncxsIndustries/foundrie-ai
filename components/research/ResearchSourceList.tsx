"use client";

import { useState, useCallback, useTransition } from "react";
import {
  Globe,
  Plus,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";

interface ResearchSource {
  id: string;
  url: string;
  provider: string;
  status: string;
  extractedContent?: string | null;
  createdAt: Date;
}

interface ResearchSourceListProps {
  projectId: string;
  sources: ResearchSource[];
}

const PROVIDER_OPTIONS = [
  { value: "MANUAL", label: "Manual (no extraction)" },
  { value: "TAVILY", label: "Tavily (search + extract)" },
  { value: "OBSCURA", label: "Obscura (JS-rendered scrape)" },
] as const;

function getStatusIcon(status: string) {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    case "FAILED":
      return <XCircle className="h-4 w-4 text-red-400" />;
    case "PROCESSING":
      return <Loader2 className="h-4 w-4 text-amber-400 animate-spin" />;
    default:
      return <Globe className="h-4 w-4 text-muted-foreground" />;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "COMPLETED":
      return "Extracted";
    case "FAILED":
      return "Failed";
    case "PROCESSING":
      return "Processing…";
    case "PENDING":
      return "Pending";
    default:
      return status;
  }
}

export function ResearchSourceList({
  projectId,
  sources: initialSources,
}: ResearchSourceListProps) {
  const [sources, setSources] = useState<ResearchSource[]>(initialSources);
  const [showAddForm, setShowAddForm] = useState(false);
  const [url, setUrl] = useState("");
  const [provider, setProvider] = useState<string>("TAVILY");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const addLink = useCallback(async () => {
    if (!url.trim()) return;
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/research/${projectId}/links`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: url.trim(), provider }),
          },
        );
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to add link");
          return;
        }

        setSources((prev) => [data.source, ...prev]);
        setUrl("");
        setShowAddForm(false);

        if (data.extractionError) {
          setError(`Link saved but extraction failed: ${data.extractionError}`);
        }
      } catch (err: any) {
        setError(err.message || "Network error");
      }
    });
  }, [url, provider, projectId]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            Web Sources
          </h3>
          <span className="text-xs text-muted-foreground">
            ({sources.length})
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 rounded-md bg-surface-raised px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-overlay"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Link
        </button>
      </div>

      {/* Add Link Form */}
      {showAddForm && (
        <div className="rounded-lg border border-border bg-surface-raised p-4 space-y-3">
          <div className="space-y-2">
            <label
              htmlFor="research-link-url"
              className="text-xs font-medium text-muted-foreground"
            >
              URL
            </label>
            <input
              id="research-link-url"
              type="url"
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="research-link-provider"
              className="text-xs font-medium text-muted-foreground"
            >
              Extraction Method
            </label>
            <select
              id="research-link-provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {PROVIDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addLink}
              disabled={isPending || !url.trim()}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {isPending ? "Extracting…" : "Add & Extract"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setError(null);
              }}
              className="rounded-md px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>
      )}

      {/* Source List */}
      {sources.length === 0 && !showAddForm ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          No web sources yet. Add links to gather research from the web.
        </p>
      ) : (
        <ul className="space-y-2">
          {sources.map((source) => (
            <li
              key={source.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-surface-raised p-3 transition-colors hover:bg-surface-overlay"
            >
              {getStatusIcon(source.status)}
              <div className="flex-1 min-w-0">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-foreground hover:text-accent truncate block"
                >
                  {source.url}
                  <ExternalLink className="inline-block ml-1 h-3 w-3 opacity-60" />
                </a>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {source.provider}
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    {getStatusLabel(source.status)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
