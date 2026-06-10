"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { ERNodeDataSchema, type ERNodeData } from "@/lib/diagrams/schemas/nodes";

interface ERNodeProps {
  data: ERNodeData;
}

function ERNodeComponent({ data }: ERNodeProps) {
  const validated = ERNodeDataSchema.parse(data);
  const { label, type, attributes = [], primaryKey } = validated;

  if (type === "entity") {
    return (
      <div className="min-w-[140px] rounded border-2 border-diagram-green bg-surface shadow-lg">
        <Handle type="target" position={Position.Top} className="!bg-diagram-green" />
        
        <div className="border-b border-border px-3 py-2 text-center font-semibold">
          {label}
        </div>
        
        {attributes.length > 0 && (
          <div className="px-3 py-2">
            {attributes.map((attr, i) => (
              <div key={i} className="text-sm font-mono">
                {attr === primaryKey && <span className="text-diagram-yellow">🔑 </span>}
                {attr}
              </div>
            ))}
          </div>
        )}

        <Handle type="source" position={Position.Bottom} className="!bg-diagram-green" />
      </div>
    );
  }

  if (type === "weak-entity") {
    return (
      <div className="min-w-[140px] rounded border-4 border-double border-diagram-green bg-surface p-3 text-center shadow-lg">
        <Handle type="target" position={Position.Top} className="!bg-diagram-green" />
        <div className="font-semibold">{label}</div>
        <Handle type="source" position={Position.Bottom} className="!bg-diagram-green" />
      </div>
    );
  }

  if (type === "relationship") {
    return (
      <div className="flex h-12 w-24 rotate-45 items-center justify-center border-2 border-diagram-blue bg-surface shadow-lg">
        <div className="-rotate-45 text-sm font-semibold">{label}</div>
        <Handle type="target" position={Position.Left} className="!bg-diagram-blue" />
        <Handle type="source" position={Position.Right} className="!bg-diagram-blue" />
      </div>
    );
  }

  // attribute type
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-surface text-xs">
      {label}
      <Handle type="source" position={Position.Bottom} className="!bg-accent" />
    </div>
  );
}

export const ERNode = memo(ERNodeComponent);
