// Research phase page (Feature 06).
// Placeholder for the research library (uploads, sources, references, synthesis).
// The research ingestion surface arrives in Feature 07.
import { Library } from "lucide-react";

import { PhasePlaceholder } from "@/components/project/phase-placeholder";

export default function ResearchPage() {
  return (
    <PhasePlaceholder
      phaseId="research"
      title="Research"
      description="Sources, references, and synthesized findings."
      icon={<Library className="size-8" />}
      emptyTitle="No research yet"
      emptyMessage="Uploaded assets, sources, and synthesized research will appear here."
    />
  );
}
