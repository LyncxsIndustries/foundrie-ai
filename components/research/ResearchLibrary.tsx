"use client";

import { useState, useEffect } from "react";
import { ResearchUploader } from "@/components/research/ResearchUploader";
import { MediaGallery } from "@/components/research/MediaGallery";
import { ResearchSynthesisActions } from "@/components/research/ResearchSynthesisActions";

interface ResearchLibraryProps {
  projectId: string;
}

interface MediaFile {
  id: string;
  fileName: string;
  storageUrl: string;
  mimeType?: string | null;
  category?: string | null;
  tags?: string[];
  aiDescription?: string | null;
  fileSize?: number | null;
  createdAt: Date;
}

export function ResearchLibrary({ projectId }: ResearchLibraryProps) {
  const [assets, setAssets] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Fetch assets
      const assetsRes = await fetch(`/api/research/${projectId}/assets`);
      if (assetsRes.ok) {
        const assetsData = await assetsRes.json();
        setAssets(assetsData.assets || []);
      }
    } catch (error) {
      console.error("Error fetching research data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-end">
        <ResearchSynthesisActions projectId={projectId} />
      </div>

      {/* Uploader Section */}
      <section>
        <ResearchUploader projectId={projectId} onUploadComplete={fetchData} />
      </section>

      {/* Media Gallery */}
      <section>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-text-secondary">Loading media...</div>
          </div>
        ) : (
          <MediaGallery
            files={assets}
            projectId={projectId}
            onRefresh={fetchData}
          />
        )}
      </section>
    </div>
  );
}
