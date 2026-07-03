"use client";

import { useState, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileCard } from "./FileCard";
import { CategoryFilter } from "./CategoryFilter";
import { BulkActionsBar } from "./BulkActionsBar";
import { MediaCategory } from "@/lib/media/categories";
import { Search, Grid3x3, CheckSquare } from "lucide-react";
import { SurfaceEmpty } from "@/components/shells/surface-states";

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

interface MediaGalleryProps {
  files: MediaFile[];
  projectId: string;
  onRefresh: () => void;
}

export function MediaGallery({ files, projectId, onRefresh }: MediaGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Filter files
  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      // Category filter
      if (categoryFilter !== "all" && file.category !== categoryFilter) {
        return false;
      }

      // Search filter (filename and tags)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesFilename = file.fileName.toLowerCase().includes(query);
        const matchesTags = file.tags?.some((tag) =>
          tag.toLowerCase().includes(query)
        );
        if (!matchesFilename && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [files, categoryFilter, searchQuery]);

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    files.forEach((file) => {
      const cat = file.category || "general";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [files]);

  // Selection handlers
  const handleSelect = (id: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedFiles(new Set());
    setIsSelectionMode(false);
  };

  // Bulk operations
  const handleBulkCategoryChange = async (category: MediaCategory) => {
    try {
      const res = await fetch(`/api/research/${projectId}/files/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "update-category",
          fileIds: Array.from(selectedFiles),
          data: { category },
        }),
      });

      if (!res.ok) throw new Error("Failed to update category");
      
      onRefresh();
      handleClearSelection();
    } catch (error) {
      console.error("Bulk category change error:", error);
      alert("Failed to update category. Please try again.");
    }
  };

  const handleBulkAddTags = async (tags: string[]) => {
    try {
      const res = await fetch(`/api/research/${projectId}/files/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "add-tags",
          fileIds: Array.from(selectedFiles),
          data: { tags },
        }),
      });

      if (!res.ok) throw new Error("Failed to add tags");
      
      onRefresh();
      handleClearSelection();
    } catch (error) {
      console.error("Bulk add tags error:", error);
      alert("Failed to add tags. Please try again.");
    }
  };

  const handleBulkAnalyze = async () => {
    try {
      const res = await fetch(`/api/research/${projectId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileIds: Array.from(selectedFiles),
          analysisType: "full",
        }),
      });

      if (!res.ok) throw new Error("Failed to analyze files");
      
      onRefresh();
      handleClearSelection();
    } catch (error) {
      console.error("Bulk analyze error:", error);
      alert("Failed to analyze files. Please try again.");
    }
  };

  const handleBulkDelete = async () => {
    try {
      const res = await fetch(`/api/research/${projectId}/files/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "delete",
          fileIds: Array.from(selectedFiles),
        }),
      });

      if (!res.ok) throw new Error("Failed to delete files");
      
      onRefresh();
      handleClearSelection();
    } catch (error) {
      console.error("Bulk delete error:", error);
      alert("Failed to delete files. Please try again.");
    }
  };

  // Single file operations
  const handleCategoryChange = async (id: string, category: MediaCategory) => {
    try {
      const res = await fetch(`/api/research/${projectId}/files/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "update-category",
          fileIds: [id],
          data: { category },
        }),
      });

      if (!res.ok) throw new Error("Failed to update category");
      
      onRefresh();
    } catch (error) {
      console.error("Category change error:", error);
      alert("Failed to update category. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      const res = await fetch(`/api/research/${projectId}/files/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "delete",
          fileIds: [id],
        }),
      });

      if (!res.ok) throw new Error("Failed to delete file");
      
      onRefresh();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete file. Please try again.");
    }
  };

  const handleView = (id: string) => {
    // TODO: Open lightbox/preview modal
    console.log("View file:", id);
  };

  if (files.length === 0) {
    return (
      <SurfaceEmpty
        icon={<Grid3x3 className="h-10 w-10" />}
        title="No research files uploaded yet"
        message="Upload images, videos, or documents to get started with your research collection"
      />
    );
  }

  if (filteredFiles.length === 0) {
    return (
      <SurfaceEmpty
        icon={<Search className="h-10 w-10" />}
        title="No files found"
        message="Try adjusting your filters or search query"
        action={
          <Button
            variant="ghost"
            onClick={() => {
              setSearchQuery("");
              setCategoryFilter("all");
            }}
          >
            Clear Filters
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <Input
              placeholder="Search by filename or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <CategoryFilter
            value={categoryFilter}
            counts={categoryCounts}
            totalCount={files.length}
            onChange={setCategoryFilter}
          />
        </div>
        <Button
          variant={isSelectionMode ? "default" : "secondary"}
          size="sm"
          onClick={() => {
            setIsSelectionMode(!isSelectionMode);
            if (isSelectionMode) {
              handleClearSelection();
            }
          }}
        >
          <CheckSquare className="mr-2 h-4 w-4" />
          {isSelectionMode ? "Exit Selection" : "Select"}
        </Button>
      </div>

      {/* Bulk actions bar */}
      {selectedFiles.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedFiles.size}
          onCategoryChange={handleBulkCategoryChange}
          onAddTags={handleBulkAddTags}
          onAnalyze={handleBulkAnalyze}
          onDelete={handleBulkDelete}
          onClearSelection={handleClearSelection}
        />
      )}

      {/* File grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredFiles.map((file) => (
          <FileCard
            key={file.id}
            file={file}
            isSelected={selectedFiles.has(file.id)}
            isSelectionMode={isSelectionMode}
            onSelect={handleSelect}
            onCategoryChange={handleCategoryChange}
            onDelete={handleDelete}
            onView={handleView}
          />
        ))}
      </div>
    </div>
  );
}
