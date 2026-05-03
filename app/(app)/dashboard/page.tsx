import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="p-6 md:p-10 lg:p-12 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder Project Card */}
        <Card className="bg-elevated border-border transition-colors hover:border-border-strong cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-xl">E-Commerce Platform</CardTitle>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                ARCHITECTURE
              </Badge>
            </div>
            <CardDescription className="text-muted">Updated 2 days ago</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 text-sm text-secondary-foreground">
              <div className="flex items-center gap-1">
                <span className="font-medium text-foreground">3</span> diagrams
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium text-foreground">12</span> specs
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Empty State Card (Just for structural preview) */}
        <Card className="border-dashed border-border bg-transparent flex flex-col items-center justify-center p-6 text-center h-40">
          <div className="text-sm text-muted-foreground mb-4">Create your first project</div>
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" /> Create
          </Button>
        </Card>
      </div>
    </div>
  );
}
