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
    id: "INSPIRATION" as const,
    label: "Inspiration",
    icon: Sparkles,
    description: "Design inspiration, mood boards, reference sites",
  },
  {
    id: "WIREFRAMES" as const,
    label: "Wireframes",
    icon: Layout,
    description: "Sketches, wireframes, mockups, prototypes",
  },
  {
    id: "BRANDING" as const,
    label: "Branding",
    icon: Palette,
    description: "Logos, brand guidelines, color palettes, typography",
  },
  {
    id: "TECHNICAL_DOCS" as const,
    label: "Technical Docs",
    icon: FileText,
    description: "API docs, architecture diagrams, spec sheets",
  },
  {
    id: "COMPETITORS" as const,
    label: "Competitors",
    icon: TrendingUp,
    description: "Competitor screenshots, feature comparisons",
  },
  {
    id: "GENERAL" as const,
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
