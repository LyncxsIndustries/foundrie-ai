"use client";

import { memo } from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";
import { EREdgeDataSchema, type EREdgeData } from "@/lib/diagrams/schemas/edges";

export const EREdge = memo(({ id, sourceX, sourceY, targetX, targetY, data, selected }: EdgeProps) => {
  const validated = EREdgeDataSchema.safeParse(data);
  if (!validated.success) return null;

  const edgeData = validated.data as EREdgeData;
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY });

  const getMarker = (cardinality?: string) => {
    switch (cardinality) {
      case "one":
        return "url(#er-one)";
      case "many":
        return "url(#er-many)";
      case "zero-or-one":
        return "url(#er-zero-or-one)";
      case "zero-or-many":
        return "url(#er-zero-or-many)";
      default:
        return undefined;
    }
  };

  return (
    <>
      <defs>
        <marker id="er-one" markerWidth="8" markerHeight="14" refX="7" refY="7" orient="auto">
          <line x1="0" y1="0" x2="0" y2="14" stroke={selected ? "var(--accent-primary)" : "var(--border-strong)"} strokeWidth="2" />
        </marker>
        <marker id="er-many" markerWidth="12" markerHeight="14" refX="11" refY="7" orient="auto">
          <path d="M 0 0 L 12 7 L 0 14" fill="none" stroke={selected ? "var(--accent-primary)" : "var(--border-strong)"} strokeWidth="2" />
        </marker>
        <marker id="er-zero-or-one" markerWidth="16" markerHeight="14" refX="15" refY="7" orient="auto">
          <circle cx="4" cy="7" r="3" fill="none" stroke={selected ? "var(--accent-primary)" : "var(--border-strong)"} strokeWidth="1.5" />
          <line x1="12" y1="0" x2="12" y2="14" stroke={selected ? "var(--accent-primary)" : "var(--border-strong)"} strokeWidth="2" />
        </marker>
        <marker id="er-zero-or-many" markerWidth="20" markerHeight="14" refX="19" refY="7" orient="auto">
          <circle cx="4" cy="7" r="3" fill="none" stroke={selected ? "var(--accent-primary)" : "var(--border-strong)"} strokeWidth="1.5" />
          <path d="M 8 0 L 20 7 L 8 14" fill="none" stroke={selected ? "var(--accent-primary)" : "var(--border-strong)"} strokeWidth="2" />
        </marker>
      </defs>
      <BaseEdge
        id={id}
        path={edgePath}
        markerStart={getMarker(edgeData.sourceCardinality)}
        markerEnd={getMarker(edgeData.targetCardinality)}
        style={{
          stroke: selected ? "var(--accent-primary)" : "var(--border-strong)",
          strokeWidth: selected ? 2 : 1.5,
        }}
      />
      {edgeData.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan px-2 py-1 text-xs font-mono bg-bg-surface border border-border-default rounded"
          >
            {edgeData.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

EREdge.displayName = "EREdge";
