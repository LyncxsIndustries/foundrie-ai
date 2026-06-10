import type { NodeTypes } from "@xyflow/react";
import { ClassNode } from "./ClassNode";
import { C4Node } from "./C4Node";
import { SequenceNode } from "./SequenceNode";
import { ERNode } from "./ERNode";
import { InfrastructureNode } from "./InfrastructureNode";

// Define nodeTypes outside render scope for React Flow
export const nodeTypes: NodeTypes = {
  // UML nodes
  class: ClassNode,
  interface: ClassNode,
  abstract: ClassNode,

  // C4 nodes
  person: C4Node,
  system: C4Node,
  container: C4Node,
  database: C4Node,
  external: C4Node,

  // Sequence nodes
  lifeline: SequenceNode,
  activation: SequenceNode,
  actor: SequenceNode,
  fragment: SequenceNode,

  // ER nodes
  entity: ERNode,
  "weak-entity": ERNode,
  attribute: ERNode,
  relationship: ERNode,

  // Infrastructure nodes
  microservice: InfrastructureNode,
  gateway: InfrastructureNode,
  "message-bus": InfrastructureNode,
  "database-infra": InfrastructureNode,
  "load-balancer": InfrastructureNode,
  cache: InfrastructureNode,
};

export { ClassNode, C4Node, SequenceNode, ERNode, InfrastructureNode };
