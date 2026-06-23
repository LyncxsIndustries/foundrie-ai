"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2 } from "lucide-react";

export default function NewProjectPage() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: description.slice(0, 100).trim() || "New Project",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const data = await response.json();
      router.push(`/projects/${data.id}/discovery`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-24">
      <div className="text-center">
        <div className="mb-2 text-sm text-text-secondary">Phase 1 of 8</div>
        <h1 className="text-3xl font-bold text-text-primary md:text-4xl">
          What are you building?
        </h1>
        <p className="mt-4 text-text-secondary">
          Describe your project idea in a few sentences. We'll guide you through
          discovery and architecture.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-12">
        <div className="space-y-4">
          <div>
            <Label htmlFor="description">Project Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="E.g., A real-time collaborative whiteboard for remote teams with built-in video chat and persistent storage..."
              rows={6}
              className="mt-2"
              disabled={isCreating}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="group w-full"
            disabled={!description.trim() || isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating project...
              </>
            ) : (
              <>
                Start Discovery
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
