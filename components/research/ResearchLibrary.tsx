"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ResearchUploader } from "@/components/research/ResearchUploader";
import { MediaGallery } from "@/components/research/MediaGallery";
import { ResearchSynthesisActions } from "@/components/research/ResearchSynthesisActions";
import { MediaFile } from "@/lib/media/types";
import { logger, generateTraceId } from "@/lib/logger";

interface ResearchLibraryProps {
  projectId: string;
}

async function fetchResearchAssets(projectId: string): Promise<MediaFile[]> {
  const response = await fetch(`/api/research/${projectId}/assets`);
  if (!response.ok) {
    throw new Error("Failed to fetch research assets");
  }
  const data = await response.json();
  return data.assets || [];
}

export function ResearchLibrary({ projectId }: ResearchLibraryProps) {
  const queryClient = useQueryClient();

  // Use react-query for automatic request cancellation and deduplication
  const { data: assets = [], isLoading, error } = useQuery({
    queryKey: ["research-assets", projectId],
    queryFn: () => fetchResearchAssets(projectId),
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Log errors with structured logging
  if (error) {
    logger.error("Failed to fetch research data", {
      trace_id: generateTraceId(),
      project_id: projectId,
      error: error instanceof Error ? error.message : String(error),
      event: "fetch_research_data_error",
    });
  }

  // Refresh handler for manual refetch
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["research-assets", projectId] });
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-end">
        <ResearchSynthesisActions projectId={projectId} />
      </div>

      {/* Uploader Section */}
      <section>
        <ResearchUploader projectId={projectId} onUploadComplete={handleRefresh} />
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
            onRefresh={handleRefresh}
          />
        )}
      </section>
    </div>
  );
}
