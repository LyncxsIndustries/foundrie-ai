"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MEDIA_CATEGORIES, MediaCategory } from "@/lib/media/categories";

interface CategoryFilterProps {
  value: string;
  counts: Record<string, number>;
  totalCount: number;
  onChange: (value: string) => void;
}

export function CategoryFilter({
  value,
  counts,
  totalCount,
  onChange,
}: CategoryFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-[200px]">
        <SelectValue placeholder="All Categories" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          All Categories ({totalCount})
        </SelectItem>
        {MEDIA_CATEGORIES.map((category) => {
          const count = counts[category.id] || 0;
          const Icon = category.icon;
          return (
            <SelectItem key={category.id} value={category.id}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>
                  {category.label} ({count})
                </span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
