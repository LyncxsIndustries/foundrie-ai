"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { User, Box, Package, Database, ExternalLink } from "lucide-react";
import { C4NodeDataSchema, type C4NodeData } from "@/lib/diagrams/schemas/nodes";

interface C4NodeProps {
  data: C4NodeData;
}

function C4NodeComponent({ data }: C4NodeProps) {
  const validated = C4NodeDataSchema.parse(data);
  const { label, description, technology, type } = validated;

  const icons = {
    person: User,
    system: Box,
    container: Package,
    database: Database,
    external: ExternalLink,
  };

  const Icon = icons[type];

  return (
    <div className="min-w-[160px] max-w-[220px] rounded-lg border-2 border-diagram-blue bg-surface p-4 text-center shadow-lg">
      <Handle type="target" position={Position.Top} className="!bg-diagram-blue" />
      
      <Icon className="mx-auto mb-2 h-8 w-8 text-diagram-blue" />
      <div className="font-semibold text-text-primary">{label}</div>
      
      {description && (
        <div className="mt-1 text-xs text-text-secondary">{description}</div>
      )}
      
      {technology && (
        <div className="mt-2 text-xs font-mono text-text-tertiary">{technology}</div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-diagram-blue" />
    </div>
  );
}

export const C4Node = memo(C4NodeComponent);
