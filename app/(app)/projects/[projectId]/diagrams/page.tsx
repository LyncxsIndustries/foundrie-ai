import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Workflow } from "lucide-react";

/**
 * Diagram workspace placeholder. The canvas fills the viewport with a flush,
 * infinite dotted background; floating panels overlay it without a card-like
 * wrapper (ui-context.md canvas rules). The real React Flow canvas arrives in
 * Features 16–17.
 */
export default function DiagramWorkspacePage() {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-bg-canvas">
      {/* Infinite dotted grid, flush with the app background. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(var(--border-default)_1px,transparent_1px)] bg-size-[24px_24px]"
      />

      {/* Floating header panel. */}
      <div className="absolute left-4 top-4 flex items-center gap-3 rounded-lg border border-border bg-bg-elevated/90 px-4 py-2 backdrop-blur">
        <Workflow className="size-4 text-accent-ai" />
        <span className="text-sm font-medium text-text-primary">
          Diagram Workspace
        </span>
        <Badge variant="secondary">Placeholder</Badge>
      </div>

      {/* Floating generation/controls panel. */}
      <div className="absolute bottom-4 right-4 w-72 rounded-lg border border-border bg-bg-elevated/90 p-4 backdrop-blur">
        <p className="text-sm font-medium text-text-primary">Generation</p>
        <p className="mt-1 text-sm text-text-secondary">
          Diagram generation progress and controls appear here.
        </p>
        <Button
          variant="outline"
          size="lg"
          className="mt-3 min-touch w-full"
          disabled
        >
          Generate diagrams
        </Button>
      </div>
    </div>
  );
}
