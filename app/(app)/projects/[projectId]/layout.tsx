import { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function ProjectLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      {/* Project Header */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
        <div>
          <h1 className="text-xl font-bold">E-Commerce Platform</h1>
          <p className="text-sm text-muted">Project ID: proj_12345</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            PHASE: ARCHITECTURE
          </Badge>
        </div>
      </div>

      {/* Phase Navigation */}
      <div className="border-b border-border bg-base px-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="h-12 w-full justify-start rounded-none border-b-0 bg-transparent p-0">
            <TabsTrigger value="overview" className="h-12 rounded-none border-b-2 border-transparent px-4 py-2 font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none">
              Overview & Discovery
            </TabsTrigger>
            <TabsTrigger value="requirements" className="h-12 rounded-none border-b-2 border-transparent px-4 py-2 font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none">
              Requirements
            </TabsTrigger>
            <TabsTrigger value="diagrams" className="h-12 rounded-none border-b-2 border-transparent px-4 py-2 font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none">
              Diagrams
            </TabsTrigger>
            <TabsTrigger value="specs" className="h-12 rounded-none border-b-2 border-transparent px-4 py-2 font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none">
              Feature Specs
            </TabsTrigger>
            <TabsTrigger value="export" className="h-12 rounded-none border-b-2 border-transparent px-4 py-2 font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none">
              Export Package
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}
