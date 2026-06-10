export type DiagramCategory = "structural" | "behavioral" | "architectural" | "data" | "infrastructure";

export interface CategoryMeta {
  id: DiagramCategory;
  label: string;
  description: string;
  icon: string;
}

export const DIAGRAM_CATEGORIES: Record<DiagramCategory, CategoryMeta> = {
  structural: {
    id: "structural",
    label: "Structural",
    description: "Class, component, object, deployment, package diagrams",
    icon: "box",
  },
  behavioral: {
    id: "behavioral",
    label: "Behavioral",
    description: "Use case, sequence, activity, state machine diagrams",
    icon: "workflow",
  },
  architectural: {
    id: "architectural",
    label: "Architectural",
    description: "C4 context, container, component, microservices, system context",
    icon: "layers",
  },
  data: {
    id: "data",
    label: "Data",
    description: "DFD L0, DFD L1, ER diagrams",
    icon: "database",
  },
  infrastructure: {
    id: "infrastructure",
    label: "Infrastructure",
    description: "AWS architecture, network diagrams",
    icon: "server",
  },
} as const;

export const CATEGORY_ORDER: DiagramCategory[] = [
  "structural",
  "behavioral",
  "architectural",
  "data",
  "infrastructure",
];
