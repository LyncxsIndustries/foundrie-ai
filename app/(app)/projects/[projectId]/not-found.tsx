import Link from "next/link";
import { FolderSearch } from "lucide-react";

import { SurfaceEmpty } from "@/components/shells/surface-states";
import { Button } from "@/components/ui/button";

// Rendered when the project layout calls notFound() — either the id is unknown
// or it belongs to another user. The message is identical in both cases so the
// surface never confirms another user's project exists.
export default function ProjectNotFound() {
  return (
    <div className="flex min-h-[calc(100svh-3.5rem)] flex-col bg-background">
      <SurfaceEmpty
        icon={<FolderSearch className="size-8" />}
        title="Project not found"
        message="This project doesn't exist or you don't have access to it."
        action={
          <Button asChild variant="outline" size="lg" className="min-touch">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        }
      />
    </div>
  );
}
