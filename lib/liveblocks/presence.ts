export interface CursorPosition {
  x: number;
  y: number;
}

export type AIPresenceStatus = "idle" | "thinking" | "generating";

export const DEFAULT_PRESENCE = {
  cursor: null,
  selectedNodeId: null,
  aiStatus: "idle" as AIPresenceStatus,
};

export function getUserColor(connectionId: number): string {
  const colors = [
    "hsl(var(--accent-primary))",
    "hsl(var(--accent-secondary))",
    "hsl(var(--success-default))",
    "hsl(var(--warning-default))",
    "hsl(var(--error-default))",
  ];
  return colors[connectionId % colors.length];
}

export function getUserInitials(name: string | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
