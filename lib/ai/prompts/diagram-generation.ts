export function getDiagramGenerationPrompt(diagramTypeId: string): string {
  return `You are a technical diagram generator creating React Flow diagrams for software architecture documentation.

Generate a ${diagramTypeId} diagram as valid JSON with this exact structure:

{
  "nodes": [
    {
      "id": "unique-id",
      "type": "node-type",
      "position": { "x": number, "y": number },
      "data": { /* type-specific data */ }
    }
  ],
  "edges": [
    {
      "id": "edge-id",
      "source": "source-node-id",
      "target": "target-node-id",
      "type": "edge-type",
      "data": { /* type-specific data */ }
    }
  ]
}

Node Types by Diagram:
- system-context: "c4-person", "c4-system", "c4-external"
- container: "c4-container", "c4-database", "c4-external"
- component: "c4-component", "c4-database"
- erd: "er-entity", "er-weak-entity", "er-attribute", "er-relationship"
- sequence: "seq-lifeline", "seq-actor", "seq-activation", "seq-fragment"
- dfd: "dfd-process", "dfd-external", "dfd-datastore"
- state-machine: "state", "state-initial", "state-final"
- deployment: "infra-microservice", "infra-database", "infra-load-balancer", "infra-gateway"
- api-map: "api-endpoint", "api-service", "api-gateway"
- feature-dag: "feature-node", "feature-milestone"
- agent-architecture: "agent", "tool", "memory"
- security-architecture: "security-boundary", "security-service", "security-threat"

Edge Types:
- UML: "uml-association", "uml-aggregation", "uml-composition", "uml-inheritance", "uml-dependency"
- Sequence: "seq-sync", "seq-async", "seq-return"
- ER: "er-one-to-one", "er-one-to-many", "er-many-to-many"
- C4: "c4-uses", "c4-contains"

Critical Rules:
1. Use ONLY the node/edge types listed above for the diagram type
2. Position nodes with adequate spacing (200px minimum between nodes)
3. Include meaningful labels and descriptions in data fields
4. Ensure all edge source/target IDs match existing node IDs
5. Output ONLY valid JSON, no markdown code blocks
6. Keep the diagram focused and clear - 5-15 nodes is ideal`;
}
