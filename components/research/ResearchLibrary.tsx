import { db } from "@/lib/db";
import { ResearchUploader } from "@/components/research/ResearchUploader";
import { VisualReferenceGrid } from "@/components/research/VisualReferenceGrid";
import { ResearchSourceList } from "@/components/research/ResearchSourceList";
import { ResearchSynthesisActions } from "@/components/research/ResearchSynthesisActions";
import { SurfaceEmpty } from "@/components/shells/surface-states";
import { Library } from "lucide-react";

interface ResearchLibraryProps {
  projectId: string;
}

export async function ResearchLibrary({ projectId }: ResearchLibraryProps) {
  const [assets, documents, sources] = await Promise.all([
    db.researchAsset.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    }),
    db.researchDocument.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    }),
    db.researchSource.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const isEmpty = assets.length === 0 && documents.length === 0 && sources.length === 0;

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex items-center justify-end">
        <ResearchSynthesisActions projectId={projectId} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Uploader Section */}
          <section>
            <ResearchUploader projectId={projectId} />
          </section>

          {/* Grid Section */}
          <section>
            {isEmpty ? (
              <SurfaceEmpty
                icon={<Library className="h-10 w-10 text-muted-foreground" />}
                title="No research assets yet"
                message="Upload screenshots, inspiration, add links, or run synthesis to build your project's research corpus."
              />
            ) : (
              <VisualReferenceGrid assets={assets} documents={documents} />
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="md:col-span-1 border-l border-border pl-8">
          <ResearchSourceList projectId={projectId} sources={sources} />
        </div>
      </div>
    </div>
  );
}
