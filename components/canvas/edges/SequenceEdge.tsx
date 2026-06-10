"use client";

import { memo } from "react";
import { BaseEdge, EdgeLabelRenderer, getStraightPath, type EdgeProps } from "@xyflow/react";
import { SequenceEdgeDataSchema, type SequenceEdgeData } from "@/lib/diagrams/schemas/edges";

export const SequenceEdge = memo(({ id, sourceX, sourceY, targetX, targetY, data, selected }: EdgeProps) => {
  const validated = SequenceEdgeDataSchema.safeParse(data);
  if (!validated.success) return null;

  const edgeData = validated.data as SequenceEdgeData;
  const [edgePath, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });

  const strokeColor = selected ? "var(--accent-primary)" : "var(--border-strong)";
  const strokeDasharray = edgeData.type === "return" ? "5,5" : undefined;

  const getMarkerEnd = () => {
    if (edgeData.type === "sync") return "url(#seq-sync)";
    return "url(#seq-async)";
  };

  return (
    <>
      <defs>
        <marker id="seq-sync" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 Z" fill={strokeColor} />
        </marker>
        <marker id="seq-async" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 Z" fill="none" stroke={strokeColor} strokeWidth="1.5" />
        </marker>
      </defs>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={getMarkerEnd()}
        style={{
          stroke: strokeColor,
          strokeWidth: selected ? 2 : 1.5,
          strokeDasharray,
        }}
      />
      {(edgeData.label || edgeData.message) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -120%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan px-2 py-1 text-xs font-mono bg-bg-surface border border-border-default rounded"
          >
            {edgeData.message || edgeData.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

SequenceEdge.displayName = "SequenceEdge";
