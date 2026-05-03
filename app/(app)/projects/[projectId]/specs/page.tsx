import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SpecsPage() {
  return (
    <div className="flex h-full">
      {/* Spec List Sidebar */}
      <div className="w-64 border-r border-border bg-surface shrink-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-2">
            <h3 className="font-semibold text-sm mb-4 text-muted-foreground">Generated Specs</h3>
            <Button variant="secondary" className="w-full justify-start font-mono text-xs">
              01-auth.md
            </Button>
            <Button variant="ghost" className="w-full justify-start font-mono text-xs text-muted">
              02-database.md
            </Button>
          </div>
        </ScrollArea>
      </div>

      {/* Spec Viewer */}
      <div className="flex-1 bg-base p-8 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <Card className="bg-elevated border-border">
            <CardContent className="p-8 prose prose-invert max-w-none">
              <h1>01-auth.md</h1>
              <p className="text-muted-foreground">Select a spec from the sidebar to view its contents.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
