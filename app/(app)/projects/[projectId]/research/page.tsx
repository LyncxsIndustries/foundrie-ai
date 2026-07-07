import { SurfaceHeader } from "@/components/shells/workspace-shell";
import { ResearchLibrary } from "@/components/research/ResearchLibrary";
import {
  phasePosition,
  PROJECT_PHASE_COUNT,
} from "@/components/project/project-phases";

type RouteContext = { params: Promise<{ projectId: string }> };

export default async function ResearchPage({ params }: RouteContext) {
  const { projectId } = await params;
  const prefix = `Phase ${phasePosition("research")} of ${PROJECT_PHASE_COUNT}`;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <SurfaceHeader 
        title="Research" 
        description={`${prefix} — Visual references and domain docs.`} 
      />
      <div className="flex-1 min-h-0 overflow-hidden">
        <ResearchLibrary projectId={projectId} />
      </div>
    </div>
  );
}
