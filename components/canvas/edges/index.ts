import type { EdgeTypes } from "@xyflow/react";
import { UMLEdge } from "./UMLEdge";
import { SequenceEdge } from "./SequenceEdge";
import { EREdge } from "./EREdge";
import { C4Edge } from "./C4Edge";

// Define edgeTypes outside render scope for React Flow
export const edgeTypes: EdgeTypes = {
  // UML edges
  association: UMLEdge,
  aggregation: UMLEdge,
  composition: UMLEdge,
  inheritance: UMLEdge,
  dependency: UMLEdge,

  // Sequence edges
  sync: SequenceEdge,
  async: SequenceEdge,
  return: SequenceEdge,

  // ER edges
  "er-relationship": EREdge,

  // C4 edges
  "c4-relationship": C4Edge,
};

export { UMLEdge, SequenceEdge, EREdge, C4Edge };
