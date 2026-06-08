import { db } from "@/lib/db";
import { ResearchUploader } from "@/components/research/ResearchUploader";
import { VisualReferenceGrid } from "@/components/research/VisualReferenceGrid";
import { SurfaceEmpty } from "@/components/shells/surface-states";
import { Library } from "lucide-react";

interface ResearchLibraryProps {
  projectId: string;
}

export async function ResearchLibrary({ projectId }: ResearchLibraryProps) {
  const [assets, documents] = await Promise.all([
    db.researchAsset.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    }),
    db.researchDocument.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const isEmpty = assets.length === 0 && documents.length === 0;

  return (
    <div className="space-y-8">
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
            message="Upload screenshots, inspiration, or documents to build your project's research corpus."
          />
        ) : (
          <VisualReferenceGrid assets={assets} documents={documents} />
        )}
      </section>
    </div>
  );
}
