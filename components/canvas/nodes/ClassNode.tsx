"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { ClassNodeDataSchema, type ClassNodeData } from "@/lib/diagrams/schemas/nodes";

interface ClassNodeProps {
  data: ClassNodeData;
}

function ClassNodeComponent({ data }: ClassNodeProps) {
  const validated = ClassNodeDataSchema.parse(data);
  const { label, attributes = [], methods = [], stereotype = "class" } = validated;

  return (
    <div className="min-w-[180px] rounded border-2 border-border bg-surface text-text-primary shadow-lg">
      <Handle type="target" position={Position.Top} className="!bg-accent" />
      
      {/* Header */}
      <div className="border-b border-border px-3 py-2 text-center">
        {stereotype !== "class" && (
          <div className="text-xs text-text-secondary">&lt;&lt;{stereotype}&gt;&gt;</div>
        )}
        <div className="font-semibold">{label}</div>
      </div>

      {/* Attributes */}
      {attributes.length > 0 && (
        <div className="border-b border-border px-3 py-2">
          {attributes.map((attr, i) => (
            <div key={i} className="text-sm font-mono">{attr}</div>
          ))}
        </div>
      )}

      {/* Methods */}
      {methods.length > 0 && (
        <div className="px-3 py-2">
          {methods.map((method, i) => (
            <div key={i} className="text-sm font-mono">{method}</div>
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-accent" />
    </div>
  );
}

export const ClassNode = memo(ClassNodeComponent);
