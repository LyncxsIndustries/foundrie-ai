"use client";

import { useState } from "react";
import * as LucideIcons from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { DIAGRAM_CATEGORIES, CATEGORY_ORDER, type DiagramCategory } from "@/lib/diagrams/categories";
import { getDiagramTypesByCategory, type DiagramType } from "@/lib/diagrams/shape-libraries";

interface DiagramSidebarProps {
  selectedType?: DiagramType;
  onTypeSelect?: (type: DiagramType) => void;
  className?: string;
}

export function DiagramSidebar({ selectedType, onTypeSelect, className }: DiagramSidebarProps) {
  const [activeCategory, setActiveCategory] = useState<DiagramCategory>("architectural");
  const diagramTypes = getDiagramTypesByCategory(activeCategory);
  const categoryMeta = DIAGRAM_CATEGORIES[activeCategory];

  const CategoryIcon = (LucideIcons[
    categoryMeta.icon.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("") as keyof typeof LucideIcons
  ] ?? LucideIcons.Box) as React.ComponentType<{ className?: string }>;

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-border-default bg-bg-surface",
        className
      )}
    >
      {/* Category Tabs */}
      <div className="border-b border-border-default p-3">
        <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as DiagramCategory)}>
          <TabsList className="grid w-full grid-cols-5">
            {CATEGORY_ORDER.map((catId) => {
              const cat = DIAGRAM_CATEGORIES[catId];
              const Icon = (LucideIcons[
                cat.icon.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("") as keyof typeof LucideIcons
              ] ?? LucideIcons.Box) as React.ComponentType<{ className?: string }>;
              
              return (
                <TabsTrigger key={catId} value={catId} className="px-2" title={cat.label}>
                  <Icon className="h-4 w-4" />
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Category Info */}
      <div className="border-b border-border-default p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
          <CategoryIcon className="h-4 w-4 text-accent-primary" />
          <span>{categoryMeta.label}</span>
        </div>
        <p className="mt-1 text-xs text-text-muted">{categoryMeta.description}</p>
      </div>

      {/* Diagram Types */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {diagramTypes.map((type) => {
            const isSelected = selectedType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => onTypeSelect?.(type.id)}
                className={cn(
                  "group flex w-full flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors",
                  isSelected
                    ? "border-accent-primary bg-accent-primary-dim text-text-primary"
                    : "border-border-default bg-bg-canvas text-text-secondary hover:border-border-strong hover:bg-bg-elevated"
                )}
              >
                <span className="text-sm font-medium">{type.label}</span>
                <span className="text-xs text-text-muted group-hover:text-text-secondary">
                  {type.trigger}
                </span>
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Shape Palette (filtered by selected type) */}
      {selectedType && (
        <div className="border-t border-border-default p-3">
          <div className="text-xs font-medium text-text-secondary">Shape Palette</div>
          <p className="mt-1 text-xs text-text-muted">
            Drag shapes to canvas (available in Features 16-17)
          </p>
        </div>
      )}
    </aside>
  );
}
