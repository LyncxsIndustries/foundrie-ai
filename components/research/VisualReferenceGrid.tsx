import { ResearchAsset, ResearchDocument } from "@/lib/generated/prisma/client";
import { FileText, FileArchive, File, ExternalLink } from "lucide-react";
import { Card, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VisualReferenceGridProps {
  assets: ResearchAsset[];
  documents: ResearchDocument[];
}

export function VisualReferenceGrid({ assets, documents }: VisualReferenceGridProps) {
  // Combine and sort by date descending
  const combined = [
    ...assets.map((a) => ({ ...a, kind: "asset" as const })),
    ...documents.map((d) => ({ ...d, kind: "document" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (combined.length === 0) {
    return null; // The parent page can show an empty state.
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {combined.map((item) => {
        if (item.kind === "asset") {
          return <AssetCard key={item.id} asset={item as ResearchAsset} />;
        } else {
          return <DocumentCard key={item.id} document={item as ResearchDocument} />;
        }
      })}
    </div>
  );
}

function AssetCard({ asset }: { asset: ResearchAsset }) {
  const isImage = asset.mimeType?.startsWith("image/");
  const isZip = asset.assetType === "FRAME_ZIP" || asset.mimeType?.includes("zip");

  return (
    <Card className="overflow-hidden flex flex-col group">
      <div className="aspect-square bg-muted relative flex items-center justify-center border-b border-border">
        {isImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={asset.storageUrl}
            alt={asset.fileName}
            className="w-full h-full object-cover"
          />
        ) : isZip ? (
          <FileArchive className="h-12 w-12 text-muted-foreground" />
        ) : (
          <File className="h-12 w-12 text-muted-foreground" />
        )}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <a
            href={asset.storageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-background/80 backdrop-blur-sm p-1.5 rounded-md hover:bg-background text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
      <CardFooter className="p-3 flex flex-col items-start gap-1">
        <p className="text-sm font-medium truncate w-full" title={asset.fileName}>
          {asset.fileName}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground w-full justify-between">
          <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0">
            {asset.assetType.replace("_", " ")}
          </Badge>
          {asset.fileSize && <span>{(asset.fileSize / 1024 / 1024).toFixed(1)} MB</span>}
        </div>
      </CardFooter>
    </Card>
  );
}

function DocumentCard({ document }: { document: ResearchDocument }) {
  return (
    <Card className="overflow-hidden flex flex-col group">
      <div className="aspect-square bg-surface flex items-center justify-center border-b border-border">
        <FileText className="h-12 w-12 text-primary/50" />
      </div>
      <CardFooter className="p-3 flex flex-col items-start gap-1">
        <p className="text-sm font-medium truncate w-full" title={document.title}>
          {document.title}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground w-full justify-between">
          <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0">
            {document.sourceType}
          </Badge>
        </div>
      </CardFooter>
    </Card>
  );
}
