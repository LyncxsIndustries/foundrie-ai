// Architecture phase page (Feature 06).
// Placeholder for the architecture proposal and ADRs. The full-viewport canvas
// and approval surface arrive in the diagram features.
import { Boxes } from "lucide-react";

import { PhasePlaceholder } from "@/components/project/phase-placeholder";

export default function ArchitecturePage() {
  return (
    <PhasePlaceholder
      phaseId="architecture"
      title="Architecture"
      description="Proposed stack and trade-offs."
      icon={<Boxes className="size-8" />}
      emptyTitle="No architecture yet"
      emptyMessage="The architecture proposal and decision records will appear here once they ship."
    />
  );
}
