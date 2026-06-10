"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { SequenceNodeDataSchema, type SequenceNodeData } from "@/lib/diagrams/schemas/nodes";

interface SequenceNodeProps {
  data: SequenceNodeData;
}

function SequenceNodeComponent({ data }: SequenceNodeProps) {
  const validated = SequenceNodeDataSchema.parse(data);
  const { label, type, fragmentType } = validated;

  if (type === "lifeline") {
    return (
      <div className="flex flex-col items-center">
        <div className="rounded border-2 border-border bg-surface px-4 py-2 shadow-lg">
          <div className="font-semibold text-text-primary">{label}</div>
        </div>
        <div className="mt-2 h-[200px] w-px border-l-2 border-dashed border-border" />
        <Handle type="target" position={Position.Top} className="!bg-accent" />
        <Handle type="source" position={Position.Bottom} className="!bg-accent" />
      </div>
    );
  }

  if (type === "activation") {
    return (
      <div className="h-[60px] w-[12px] rounded bg-diagram-yellow">
        <Handle type="target" position={Position.Top} className="!bg-diagram-yellow" />
        <Handle type="source" position={Position.Bottom} className="!bg-diagram-yellow" />
      </div>
    );
  }

  if (type === "fragment") {
    return (
      <div className="min-w-[200px] rounded border-2 border-diagram-purple bg-surface/50 p-4">
        <div className="mb-2 text-xs font-semibold text-diagram-purple">
          {fragmentType?.toUpperCase() || "FRAGMENT"}
        </div>
        <div className="text-sm text-text-secondary">{label}</div>
        <Handle type="target" position={Position.Left} className="!bg-diagram-purple" />
        <Handle type="source" position={Position.Right} className="!bg-diagram-purple" />
      </div>
    );
  }

  // actor type
  return (
    <div className="flex flex-col items-center">
      <div className="mb-2 h-8 w-8 rounded-full border-2 border-border bg-surface" />
      <div className="text-sm font-semibold">{label}</div>
      <Handle type="source" position={Position.Bottom} className="!bg-accent" />
    </div>
  );
}

export const SequenceNode = memo(SequenceNodeComponent);
