import type { DiagramType } from "@/lib/diagrams/shape-libraries";
import type { JsonObject } from "@liveblocks/client";

export interface UserPresence extends JsonObject {
  cursor: { x: number; y: number } | null;
  selectedNodeId: string | null;
  aiStatus: "idle" | "thinking" | "generating";
}

declare global {
  interface Liveblocks {
    Storage: {
      diagramType?: DiagramType;
    };
    Presence: UserPresence;
  }
}

export {};
