"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MEDIA_CATEGORIES, MediaCategory } from "@/lib/media/categories";
import { Trash2, Tag, Sparkles, FolderInput } from "lucide-react";

interface BulkActionsBarProps {
  selectedCount: number;
  onCategoryChange: (category: MediaCategory) => Promise<void>;
  onAddTags: (tags: string[]) => Promise<void>;
  onAnalyze: () => Promise<void>;
  onDelete: () => Promise<void>;
  onClearSelection: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onCategoryChange,
  onAddTags,
  onAnalyze,
  onDelete,
  onClearSelection,
}: BulkActionsBarProps) {
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showTagsDialog, setShowTagsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MediaCategory | "">("");
  const [tagInput, setTagInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCategoryChange = async () => {
    if (!selectedCategory) return;
    setIsLoading(true);
    try {
      await onCategoryChange(selectedCategory);
      setShowCategoryDialog(false);
      setSelectedCategory("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTags = async () => {
    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tags.length === 0) return;

    setIsLoading(true);
    try {
      await onAddTags(tags);
      setShowTagsDialog(false);
      setTagInput("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete();
      setShowDeleteDialog(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      await onAnalyze();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 rounded-lg border border-accent-primary bg-surface p-4 shadow-lg">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-text-primary">
            {selectedCount} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-xs"
          >
            Clear
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowCategoryDialog(true)}
            disabled={isLoading}
          >
            <FolderInput className="mr-2 h-4 w-4" />
            Change Category
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowTagsDialog(true)}
            disabled={isLoading}
          >
            <Tag className="mr-2 h-4 w-4" />
            Add Tags
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAnalyze}
            disabled={isLoading}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Analyze
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Category Change Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Category</DialogTitle>
            <DialogDescription>
              Change the category for {selectedCount} selected file(s)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={selectedCategory}
              onValueChange={(value) => setSelectedCategory(value as MediaCategory)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {MEDIA_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{cat.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowCategoryDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCategoryChange}
              disabled={!selectedCategory || isLoading}
            >
              {isLoading ? "Changing..." : "Change Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Tags Dialog */}
      <Dialog open={showTagsDialog} onOpenChange={setShowTagsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tags</DialogTitle>
            <DialogDescription>
              Add tags to {selectedCount} selected file(s). Separate tags with commas.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="e.g., dark-theme, hero-section, inspiration"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAddTags();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowTagsDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddTags}
              disabled={!tagInput.trim() || isLoading}
            >
              {isLoading ? "Adding..." : "Add Tags"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Files</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCount} file(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
