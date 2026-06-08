// Specs phase page (Feature 06).
// Placeholder for the generated feature specs. Specs are written only after the
// diagram-first gate is cleared; the review surface arrives in its own feature.
import { FileText } from "lucide-react";

import { PhasePlaceholder } from "@/components/project/phase-placeholder";

export default function SpecsPage() {
  return (
    <PhasePlaceholder
      phaseId="specs"
      title="Specs"
      description="Ordered feature specifications."
      icon={<FileText className="size-8" />}
      emptyTitle="No specs yet"
      emptyMessage="Feature specs are generated from approved diagrams and will appear here."
    />
  );
}
