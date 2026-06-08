// Discovery phase page (Feature 06).
// Placeholder surface for the Socratic discovery interview. The streaming chat
// and structured requirements summary arrive in their own feature.
import { MessagesSquare } from "lucide-react";

import { PhasePlaceholder } from "@/components/project/phase-placeholder";

export default function DiscoveryPage() {
  return (
    <PhasePlaceholder
      phaseId="discovery"
      title="Discovery"
      description="Problem, users, and core flows."
      icon={<MessagesSquare className="size-8" />}
      emptyTitle="Discovery not started"
      emptyMessage="The Socratic discovery interview will appear here once it ships."
    />
  );
}
