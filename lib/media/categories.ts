import { LucideIcon } from "lucide-react";
import {
  Sparkles,
  Layout,
  Palette,
  FileText,
  TrendingUp,
  Folder,
} from "lucide-react";

export const MEDIA_CATEGORIES = [
  {
    id: "inspiration",
    label: "Inspiration",
    icon: Sparkles,
    description: "Design inspiration, mood boards, reference sites",
  },
  {
    id: "wireframes",
    label: "Wireframes",
    icon: Layout,
    description: "Sketches, wireframes, mockups, prototypes",
  },
  {
    id: "branding",
    label: "Branding",
    icon: Palette,
    description: "Logos, brand guidelines, color palettes, typography",
  },
  {
    id: "technical-docs",
    label: "Technical Docs",
    icon: FileText,
    description: "API docs, architecture diagrams, spec sheets",
  },
  {
    id: "competitors",
    label: "Competitors",
    icon: TrendingUp,
    description: "Competitor screenshots, feature comparisons",
  },
  {
    id: "general",
    label: "General",
    icon: Folder,
    description: "Uncategorized research files",
  },
] as const;

export type MediaCategory = (typeof MEDIA_CATEGORIES)[number]["id"];

export const VALID_CATEGORIES = MEDIA_CATEGORIES.map((c) => c.id);

export function isValidCategory(category: string): category is MediaCategory {
  return VALID_CATEGORIES.includes(category as MediaCategory);
}

export function getCategoryInfo(categoryId: string) {
  return MEDIA_CATEGORIES.find((c) => c.id === categoryId);
}

export function getCategoryIcon(categoryId: string): LucideIcon {
  const category = getCategoryInfo(categoryId);
  return category ? category.icon : Folder;
}
