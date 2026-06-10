"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { InfrastructureNodeDataSchema, type InfrastructureNodeData } from "@/lib/diagrams/schemas/nodes";

// Inlined base64 SVG icons (CORS-safe for html-to-image)
const ICONS = {
  microservice: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIi8+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMyIgZmlsbD0iY3VycmVudENvbG9yIi8+PC9zdmc+",
  gateway: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkw0IDEyTDEyIDIyTDIwIDEyTDEyIDJaIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+",
  "message-bus": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMyA4SDIxIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTMgMTJIMjEiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMyAxNkgyMSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==",
  database: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZWxsaXBzZSBjeD0iMTIiIGN5PSI1IiByeD0iOSIgcnk9IjMiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMyA1VjE5QzMgMjAuNjU2OSA3LjAyOTQ0IDIyIDEyIDIyQzE2Ljk3MDYgMjIgMjEgMjAuNjU2OSAyMSAxOVY1IiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+",
  "load-balancer": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjYiIHI9IjMiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiLz48Y2lyY2xlIGN4PSI2IiBjeT0iMTgiIHI9IjMiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiLz48Y2lyY2xlIGN4PSIxOCIgY3k9IjE4IiByPSIzIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTEyIDlWMTIiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMTAgMTRMNyAxNiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0xNCAxNEwxNyAxNiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==",
  cache: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSI0IiB5PSI0IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHJ4PSIyIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTggMTJIMTYiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMTIgOFYxNiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==",
};

interface InfrastructureNodeProps {
  data: InfrastructureNodeData;
}

function InfrastructureNodeComponent({ data }: InfrastructureNodeProps) {
  const validated = InfrastructureNodeDataSchema.parse(data);
  const { label, type, instances, technology } = validated;

  return (
    <div className="min-w-[140px] rounded-lg border-2 border-diagram-purple bg-surface p-3 text-center shadow-lg">
      <Handle type="target" position={Position.Top} className="!bg-diagram-purple" />
      
      <img 
        src={ICONS[type]} 
        alt={type}
        className="mx-auto mb-2 h-10 w-10 text-diagram-purple"
      />
      
      <div className="font-semibold text-text-primary">{label}</div>
      
      {technology && (
        <div className="mt-1 text-xs font-mono text-text-tertiary">{technology}</div>
      )}
      
      {instances && instances > 1 && (
        <div className="mt-1 text-xs text-text-secondary">×{instances}</div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-diagram-purple" />
    </div>
  );
}

export const InfrastructureNode = memo(InfrastructureNodeComponent);
