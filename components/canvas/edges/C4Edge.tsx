"use client";

import { memo } from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";
import { C4EdgeDataSchema, type C4EdgeData } from "@/lib/diagrams/schemas/edges";

export const C4Edge = memo(({ id, sourceX, sourceY, targetX, targetY, data, selected }: EdgeProps) => {
  const validated = C4EdgeDataSchema.safeParse(data);
  if (!validated.success) return null;

  const edgeData = validated.data as C4EdgeData;
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY });

  const strokeColor = selected ? "var(--accent-primary)" : "var(--border-strong)";

  return (
    <>
      <defs>
        <marker id="c4-arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 Z" fill={strokeColor} />
        </marker>
      </defs>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd="url(#c4-arrow)"
        style={{
          stroke: strokeColor,
          strokeWidth: selected ? 2 : 1.5,
        }}
      />
      {(edgeData.label || edgeData.description || edgeData.technology) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan px-2 py-1 text-xs bg-bg-surface border border-border-default rounded max-w-[200px]"
          >
            {edgeData.label && <div className="font-medium">{edgeData.label}</div>}
            {edgeData.description && <div className="text-text-secondary">{edgeData.description}</div>}
            {edgeData.technology && <div className="text-text-muted font-mono text-[10px] mt-1">{edgeData.technology}</div>}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

C4Edge.displayName = "C4Edge";
