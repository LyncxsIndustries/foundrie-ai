import type { DiagramCategory } from "./categories";

export type DiagramType =
  | "system-context"
  | "container"
  | "component"
  | "erd"
  | "sequence"
  | "dfd"
  | "state-machine"
  | "deployment"
  | "api-map"
  | "feature-dag"
  | "agent-architecture"
  | "security-architecture";

export interface ShapeDefinition {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export interface DiagramTypeMeta {
  id: DiagramType;
  label: string;
  category: DiagramCategory;
  trigger: string;
  fileFormat: string[];
  nodes: ShapeDefinition[];
  edges: ShapeDefinition[];
}

export const SHAPE_LIBRARIES: Record<DiagramType, DiagramTypeMeta> = {
  "system-context": {
    id: "system-context",
    label: "System Context (C4 L1)",
    category: "architectural",
    trigger: "Always — first diagram",
    fileFormat: [".mermaid", ".svg"],
    nodes: [
      { id: "person", label: "Person", icon: "user", description: "External user or actor" },
      { id: "system", label: "System", icon: "box", description: "Software system boundary" },
      { id: "external", label: "External System", icon: "package", description: "External dependency" },
    ],
    edges: [
      { id: "uses", label: "Uses", icon: "arrow-right", description: "System interaction" },
      { id: "sends-to", label: "Sends to", icon: "send", description: "Data/message flow" },
    ],
  },
  container: {
    id: "container",
    label: "Container (C4 L2)",
    category: "architectural",
    trigger: "Always — after Context approved",
    fileFormat: [".mermaid", ".svg"],
    nodes: [
      { id: "webapp", label: "Web App", icon: "globe", description: "Web application" },
      { id: "api", label: "API", icon: "server", description: "Backend API" },
      { id: "database", label: "Database", icon: "database", description: "Data store" },
      { id: "queue", label: "Queue", icon: "list", description: "Message queue" },
    ],
    edges: [
      { id: "calls", label: "Calls", icon: "arrow-right", description: "API call" },
      { id: "reads-writes", label: "Reads/Writes", icon: "arrow-left-right", description: "Data access" },
    ],
  },
  component: {
    id: "component",
    label: "Component (C4 L3)",
    category: "architectural",
    trigger: "Per container with > 3 components",
    fileFormat: [".mermaid", ".svg"],
    nodes: [
      { id: "controller", label: "Controller", icon: "circle-dot", description: "Request handler" },
      { id: "service", label: "Service", icon: "cog", description: "Business logic" },
      { id: "repository", label: "Repository", icon: "archive", description: "Data access" },
      { id: "component", label: "Component", icon: "box", description: "Generic component" },
    ],
    edges: [
      { id: "depends-on", label: "Depends on", icon: "arrow-right", description: "Component dependency" },
      { id: "invokes", label: "Invokes", icon: "zap", description: "Method call" },
    ],
  },
  erd: {
    id: "erd",
    label: "Entity Relationship (ERD)",
    category: "data",
    trigger: "Always if a database exists",
    fileFormat: [".dbml", ".png"],
    nodes: [
      { id: "entity", label: "Entity", icon: "table", description: "Database table" },
      { id: "attribute", label: "Attribute", icon: "list", description: "Column/field" },
    ],
    edges: [
      { id: "one-to-one", label: "One-to-One", icon: "minus", description: "1:1 relationship" },
      { id: "one-to-many", label: "One-to-Many", icon: "git-branch", description: "1:N relationship" },
      { id: "many-to-many", label: "Many-to-Many", icon: "network", description: "N:M relationship" },
    ],
  },
  sequence: {
    id: "sequence",
    label: "Sequence Diagram",
    category: "behavioral",
    trigger: "One per core flow, minimum 3",
    fileFormat: [".mermaid", ".svg"],
    nodes: [
      { id: "lifeline", label: "Lifeline", icon: "user", description: "Actor or object" },
      { id: "activation", label: "Activation", icon: "square", description: "Active execution" },
    ],
    edges: [
      { id: "sync-call", label: "Sync Call", icon: "arrow-right", description: "Synchronous message" },
      { id: "async-call", label: "Async Call", icon: "corner-down-right", description: "Asynchronous message" },
      { id: "return", label: "Return", icon: "arrow-left", description: "Return message" },
    ],
  },
  dfd: {
    id: "dfd",
    label: "Data Flow Diagram (DFD)",
    category: "data",
    trigger: "Always if user data / payments / AI signals",
    fileFormat: [".mermaid", ".svg"],
    nodes: [
      { id: "external-entity", label: "External Entity", icon: "square", description: "External actor" },
      { id: "process", label: "Process", icon: "circle", description: "Data transformation" },
      { id: "datastore", label: "Data Store", icon: "database", description: "Persistent storage" },
    ],
    edges: [
      { id: "dataflow", label: "Data Flow", icon: "arrow-right", description: "Data movement" },
    ],
  },
  "state-machine": {
    id: "state-machine",
    label: "State Machine",
    category: "behavioral",
    trigger: "Conditional — objects with lifecycle states",
    fileFormat: [".mermaid", ".json"],
    nodes: [
      { id: "state", label: "State", icon: "circle", description: "Object state" },
      { id: "initial", label: "Initial State", icon: "circle-dot", description: "Starting state" },
      { id: "final", label: "Final State", icon: "circle-dashed", description: "End state" },
    ],
    edges: [
      { id: "transition", label: "Transition", icon: "arrow-right", description: "State change" },
    ],
  },
  deployment: {
    id: "deployment",
    label: "Deployment Diagram",
    category: "structural",
    trigger: "Always if > 1 deployment target",
    fileFormat: [".mermaid", ".svg"],
    nodes: [
      { id: "node", label: "Node", icon: "server", description: "Physical/virtual machine" },
      { id: "artifact", label: "Artifact", icon: "package", description: "Deployable unit" },
      { id: "container-runtime", label: "Container", icon: "box", description: "Container runtime" },
    ],
    edges: [
      { id: "deploys-to", label: "Deploys to", icon: "arrow-right", description: "Deployment target" },
      { id: "communicates", label: "Communicates", icon: "arrow-left-right", description: "Network communication" },
    ],
  },
  "api-map": {
    id: "api-map",
    label: "API Map",
    category: "architectural",
    trigger: "Always if > 3 endpoints",
    fileFormat: [".yaml"],
    nodes: [
      { id: "endpoint", label: "Endpoint", icon: "route", description: "API endpoint" },
      { id: "service", label: "Service", icon: "server", description: "Backend service" },
      { id: "schema", label: "Schema", icon: "file-json", description: "Request/response schema" },
    ],
    edges: [
      { id: "routes-to", label: "Routes to", icon: "arrow-right", description: "Endpoint routing" },
      { id: "depends-on", label: "Depends on", icon: "link", description: "Service dependency" },
    ],
  },
  "feature-dag": {
    id: "feature-dag",
    label: "Feature DAG",
    category: "architectural",
    trigger: "Always",
    fileFormat: [".mermaid", ".svg"],
    nodes: [
      { id: "feature", label: "Feature", icon: "box", description: "Feature spec" },
      { id: "phase", label: "Phase", icon: "folder", description: "Implementation phase" },
    ],
    edges: [
      { id: "depends-on", label: "Depends on", icon: "arrow-right", description: "Feature dependency" },
      { id: "blocks", label: "Blocks", icon: "alert-circle", description: "Blocking dependency" },
    ],
  },
  "agent-architecture": {
    id: "agent-architecture",
    label: "Agent Architecture",
    category: "architectural",
    trigger: "Conditional — agentic projects",
    fileFormat: [".mermaid", ".svg"],
    nodes: [
      { id: "agent", label: "Agent", icon: "bot", description: "AI agent" },
      { id: "tool", label: "Tool", icon: "wrench", description: "Agent tool/function" },
      { id: "memory", label: "Memory", icon: "brain", description: "Agent memory store" },
    ],
    edges: [
      { id: "uses", label: "Uses", icon: "arrow-right", description: "Tool usage" },
      { id: "reads-writes", label: "Reads/Writes", icon: "arrow-left-right", description: "Memory access" },
    ],
  },
  "security-architecture": {
    id: "security-architecture",
    label: "Security Architecture",
    category: "infrastructure",
    trigger: "Always",
    fileFormat: [".mermaid", ".svg"],
    nodes: [
      { id: "layer", label: "Security Layer", icon: "shield", description: "Security boundary" },
      { id: "control", label: "Control", icon: "lock", description: "Security control" },
      { id: "threat", label: "Threat", icon: "alert-triangle", description: "Threat vector" },
    ],
    edges: [
      { id: "protects", label: "Protects", icon: "arrow-right", description: "Protection boundary" },
      { id: "mitigates", label: "Mitigates", icon: "shield-check", description: "Threat mitigation" },
    ],
  },
};

export function getDiagramTypesByCategory(category: DiagramCategory): DiagramTypeMeta[] {
  return Object.values(SHAPE_LIBRARIES).filter((lib) => lib.category === category);
}

export function getShapeLibrary(diagramType: DiagramType): DiagramTypeMeta {
  return SHAPE_LIBRARIES[diagramType];
}
