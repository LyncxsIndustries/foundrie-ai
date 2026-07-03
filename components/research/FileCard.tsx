"use client";

import Image from "next/image";
import { useState } from "react";
import { Check, FileText, Video, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MEDIA_CATEGORIES, MediaCategory } from "@/lib/media/categories";
import { Badge } from "@/components/ui/badge";

interface FileCardProps {
  file: {
    id: string;
    fileName: string;
    storageUrl: string;
    mimeType?: string | null;
    category?: string | null;
    tags?: string[];
    aiDescription?: string | null;
    fileSize?: number | null;
    createdAt: Date;
  };
  isSelected: boolean;
  isSelectionMode: boolean;
  onSelect: (id: string) => void;
  onCategoryChange: (id: string, category: MediaCategory) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

export function FileCard({
  file,
  isSelected,
  isSelectionMode,
  onSelect,
  onCategoryChange,
  onDelete,
  onView,
}: FileCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const isImage = file.mimeType?.startsWith("image/");
  const isVideo = file.mimeType?.startsWith("video/");
  const isDocument = file.mimeType?.includes("pdf") || file.mimeType?.includes("document");

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "Unknown size";
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div
      className="group relative rounded-lg border border-border bg-surface p-3 transition-all hover:border-accent-primary hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Selection checkbox */}
      {isSelectionMode && (
        <button
          onClick={() => onSelect(file.id)}
          className="absolute top-2 left-2 z-10 flex h-5 w-5 items-center justify-center rounded border border-border bg-surface transition-all hover:border-accent-primary"
          aria-label={isSelected ? "Deselect file" : "Select file"}
        >
          {isSelected && <Check className="h-4 w-4 text-accent-primary" />}
        </button>
      )}

      {/* File preview */}
      <div
        className="relative aspect-square w-full cursor-pointer overflow-hidden rounded-md bg-background"
        onClick={() => onView(file.id)}
      >
        {isImage ? (
          <Image
            src={file.storageUrl}
            alt={file.fileName}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : isVideo ? (
          <div className="flex h-full items-center justify-center">
            <Video className="h-12 w-12 text-text-tertiary" />
          </div>
        ) : isDocument ? (
          <div className="flex h-full items-center justify-center">
            <FileText className="h-12 w-12 text-text-tertiary" />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <FileText className="h-12 w-12 text-text-tertiary" />
          </div>
        )}

        {/* Quick actions overlay */}
        {isHovered && !isSelectionMode && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/80 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onView(file.id);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(file.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* File metadata */}
      <div className="mt-3 space-y-2">
        <h3 className="truncate text-sm font-medium text-text-primary" title={file.fileName}>
          {file.fileName}
        </h3>

        {/* Category selector */}
        <Select
          value={file.category || "general"}
          onValueChange={(value) => onCategoryChange(file.id, value as MediaCategory)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {MEDIA_CATEGORIES.map((cat) => (
              <SelectItem key={cat.id} value={cat.id} className="text-xs">
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tags */}
        {file.tags && file.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {file.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {file.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{file.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* AI Description */}
        {file.aiDescription && (
          <p className="line-clamp-2 text-xs text-text-secondary">
            {file.aiDescription}
          </p>
        )}

        {/* File info */}
        <div className="flex items-center justify-between text-xs text-text-tertiary">
          <span>{formatFileSize(file.fileSize)}</span>
          <span>{formatDate(file.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
