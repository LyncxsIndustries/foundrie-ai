// Requirements phase page (Feature 06).
// Document review shell: editable sections with status. The project layout
// provides the workspace shell + phase nav, so this renders only the surface
// header and main content. Real requirements content and persistence arrive in
// later features.
import { SurfaceHeader } from "@/components/shells/workspace-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  phasePosition,
  PROJECT_PHASE_COUNT,
} from "@/components/project/project-phases";

const SECTIONS = [
  { title: "Functional Requirements", status: "Draft" },
  { title: "Non-Functional Requirements", status: "Draft" },
  { title: "Hidden Requirements", status: "Pending" },
] as const;

export default function RequirementsReviewPage() {
  const prefix = `Phase ${phasePosition("requirements")} of ${PROJECT_PHASE_COUNT}`;
  return (
    <>
      <SurfaceHeader
        title="Requirements"
        description={`${prefix} — Review and edit the surfaced requirements before architecture.`}
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
    </>
  );
}
