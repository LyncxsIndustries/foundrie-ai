"use client";

// New-project action (Feature 06).
// Creates a project via the Feature 04 POST route, then routes to the new
// project's overview. The button disables immediately on click and only
// re-enables on error (idempotency, ui-context.md). Full plan-limit messaging
// and the idempotency hook arrive with their own features; this is the minimal
// navigational entry point the dashboard needs.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus } from "lucide-react";

import { Button } from "@/components/ui/button";

interface NewProjectButtonProps {
  variant?: "default" | "outline";
  label?: string;
}

export function NewProjectButton({
  variant = "default",
  label = "New project",
}: NewProjectButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        // Re-enable only on error so the user can retry.
        setError(data?.error ?? "Could not create the project.");
        setPending(false);
        return;
      }

      const { project } = (await res.json()) as { project: { id: string } };
      router.push(`/projects/${project.id}`);
      router.refresh();
      // Intentionally leave `pending` true through navigation to keep the
      // button disabled until the route changes.
    } catch {
      setError("Could not create the project.");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="lg"
        variant={variant}
        className="min-touch"
        onClick={handleClick}
        disabled={pending}
        aria-busy={pending}
      >
        <FolderPlus />
        {pending ? "Creating…" : label}
      </Button>
      {error ? (
        <p role="alert" className="text-xs text-state-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
