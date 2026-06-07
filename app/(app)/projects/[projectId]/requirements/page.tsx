import {
  WorkspaceShell,
  SurfaceHeader,
} from "@/components/shells/workspace-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

const SECTIONS = [
  { title: "Functional Requirements", status: "Draft" },
  { title: "Non-Functional Requirements", status: "Draft" },
  { title: "Hidden Requirements", status: "Pending" },
] as const;

/**
 * Document review shell: editable sections with status. Real requirements
 * content and persistence arrive in later features.
 */
export default function RequirementsReviewPage() {
  return (
    <WorkspaceShell
      nav={<div className="p-4 text-sm text-text-muted">Navigation</div>}
    >
      <SurfaceHeader
        title="Requirements"
        description="Review and edit the surfaced requirements before architecture."
        actions={
          <Button size="lg" className="min-touch">
            Save changes
          </Button>
        }
      />
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-6">
          {SECTIONS.map((section) => (
            <Card key={section.title}>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>{section.title}</CardTitle>
                <Badge variant="secondary">{section.status}</Badge>
              </CardHeader>
              <CardContent>
                <Textarea
                  className="min-h-28"
                  placeholder="Requirement details render here once generated."
                  aria-label={section.title}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </WorkspaceShell>
  );
}
