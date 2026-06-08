// Export phase page (Feature 06).
// Placeholder for the ZIP package checklist and download action. ZIP assembly is
// the terminal phase and arrives in its own feature.
import { Package } from "lucide-react";

import { PhasePlaceholder } from "@/components/project/phase-placeholder";

export default function ExportPage() {
  return (
    <PhasePlaceholder
      phaseId="export"
      title="Export"
      description="Package checklist and ZIP download."
      icon={<Package className="size-8" />}
      emptyTitle="Nothing to export yet"
      emptyMessage="The package checklist and ZIP download will appear here once generation completes."
    />
  );
}
