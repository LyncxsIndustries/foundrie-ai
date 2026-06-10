"use client";

import { memo } from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";
import { UMLEdgeDataSchema, type UMLEdgeData } from "@/lib/diagrams/schemas/edges";

export const UMLEdge = memo(({ id, sourceX, sourceY, targetX, targetY, data, selected }: EdgeProps) => {
  const validated = UMLEdgeDataSchema.safeParse(data);
  if (!validated.success) return null;

  const edgeData = validated.data as UMLEdgeData;
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY });

  const strokeColor = selected ? "var(--accent-primary)" : "var(--border-strong)";

  const getMarkerEnd = () => {
    switch (edgeData.type) {
      case "inheritance":
        return "url(#uml-inheritance)";
      case "aggregation":
        return "url(#uml-aggregation)";
      case "composition":
        return "url(#uml-composition)";
      case "dependency":
      case "association":
        return "url(#uml-arrow)";
    }
  };

  const strokeDasharray = edgeData.type === "dependency" ? "5,5" : undefined;

  return (
    <>
      <defs>
        <marker id="uml-arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 Z" fill={strokeColor} />
        </marker>
        <marker id="uml-inheritance" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 Z" fill="var(--bg-canvas)" stroke={strokeColor} strokeWidth="1.5" />
        </marker>
        <marker id="uml-aggregation" markerWidth="12" markerHeight="12" refX="11" refY="6" orient="auto">
          <path d="M 0 6 L 6 0 L 12 6 L 6 12 Z" fill="var(--bg-canvas)" stroke={strokeColor} strokeWidth="1.5" />
        </marker>
        <marker id="uml-composition" markerWidth="12" markerHeight="12" refX="11" refY="6" orient="auto">
          <path d="M 0 6 L 6 0 L 12 6 L 6 12 Z" fill={strokeColor} stroke={strokeColor} strokeWidth="1.5" />
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
      {(edgeData.label || edgeData.multiplicity) && (
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
            {edgeData.multiplicity && <span className="text-text-muted ml-1">{edgeData.multiplicity}</span>}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

UMLEdge.displayName = "UMLEdge";
