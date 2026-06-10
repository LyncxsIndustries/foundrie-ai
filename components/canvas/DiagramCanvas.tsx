"use client";

import { useState } from "react";
import { ReactFlow, Background, Controls, MiniMap, BackgroundVariant } from "@xyflow/react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { useStorage, useMutation } from "@liveblocks/react";
import "@xyflow/react/dist/style.css";
import { DiagramSidebar } from "./DiagramSidebar";
import type { DiagramType } from "@/lib/diagrams/shape-libraries";

export function DiagramCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDelete,
    isLoading,
  } = useLiveblocksFlow();

  const selectedType = useStorage((root) => root.diagramType) ?? undefined;
  const setDiagramType = useMutation(({ storage }, type: DiagramType) => {
    storage.set("diagramType", type);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center text-muted">
        Loading canvas...
      </div>
    );
  }

  return (
    <div className="flex h-full w-full">
      <DiagramSidebar selectedType={selectedType} onTypeSelect={setDiagramType} />
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDelete={onDelete}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} className="opacity-30" />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}
