"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ResearchAsset, ResearchDocument } from "@/lib/generated/prisma/client";
import { FileText, FileArchive, File, ExternalLink, Wand2, Loader2, Eye } from "lucide-react";
import { Card, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MotionPlanViewer } from "./MotionPlanViewer";

interface VisualReferenceGridProps {
  assets: ResearchAsset[];
  documents: ResearchDocument[];
}

export function VisualReferenceGrid({ assets, documents }: VisualReferenceGridProps) {
  const [selectedDocument, setSelectedDocument] = useState<ResearchDocument | null>(null);

  // Combine and sort by date descending
  const combined = [
    ...assets.map((a) => ({ ...a, kind: "asset" as const })),
    ...documents.map((d) => ({ ...d, kind: "document" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (combined.length === 0) {
    return null; // The parent page can show an empty state.
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {combined.map((item) => {
          if (item.kind === "asset") {
            return (
              <AssetCard
                key={item.id}
                asset={item as ResearchAsset}
                documents={documents}
                onViewDocument={setSelectedDocument}
              />
            );
          } else {
            return (
              <DocumentCard
                key={item.id}
                document={item as ResearchDocument}
                onViewDocument={setSelectedDocument}
              />
            );
          }
        })}
      </div>
      <MotionPlanViewer
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
      />
    </>
  );
}

function AssetCard({
  asset,
  documents,
  onViewDocument,
}: {
  asset: ResearchAsset;
  documents: ResearchDocument[];
  onViewDocument: (doc: ResearchDocument) => void;
}) {
  const isImage = asset.mimeType?.startsWith("image/");
  const isZip = asset.assetType === "FRAME_ZIP" || asset.mimeType?.includes("zip");
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const router = useRouter();

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch(`/api/research/${asset.projectId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: asset.id }),
      });
      if (!res.ok) throw new Error("Failed to analyze");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Please ensure AI keys are configured and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const metadata = asset.metadata as Record<string, any>;
  const aiSummaryId = metadata?.aiSummaryId;
  const hasAnalysis = !!aiSummaryId;
  const analysisDoc = documents.find((d) => d.id === aiSummaryId);

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
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
      <CardFooter className="p-3 flex flex-col items-start gap-2">
        <p className="text-sm font-medium truncate w-full" title={asset.fileName}>
          {asset.fileName}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground w-full justify-between">
          <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0">
            {asset.assetType.replace("_", " ")}
          </Badge>
          {asset.fileSize && <span>{(asset.fileSize / 1024 / 1024).toFixed(1)} MB</span>}
        </div>
        
        {hasAnalysis && analysisDoc ? (
          <Button
            variant="secondary"
            size="sm"
            className="w-full text-xs h-7 mt-1"
            onClick={() => onViewDocument(analysisDoc)}
          >
            <Eye className="h-3 w-3 mr-1.5" /> View Analysis
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs h-7 mt-1"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
            ) : (
              <Wand2 className="h-3 w-3 mr-1.5" />
            )}
            {isAnalyzing ? "Analyzing..." : "Analyze"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function DocumentCard({
  document,
  onViewDocument,
}: {
  document: ResearchDocument;
  onViewDocument: (doc: ResearchDocument) => void;
}) {
  return (
    <Card className="overflow-hidden flex flex-col group cursor-pointer" onClick={() => onViewDocument(document)}>
      <div className="aspect-square bg-surface flex flex-col p-4 border-b border-border hover:bg-muted/50 transition-colors">
        <FileText className="h-8 w-8 text-primary/50 mb-4" />
        <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed font-mono">
          {document.content}
        </p>
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
