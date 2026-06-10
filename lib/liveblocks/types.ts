import type { DiagramType } from "@/lib/diagrams/shape-libraries";

declare global {
  interface Liveblocks {
    Storage: {
      diagramType?: DiagramType;
    };
  }
}

export {};
