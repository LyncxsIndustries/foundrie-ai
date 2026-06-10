import type { ReactFlowJsonObject, Node, Edge } from '@xyflow/react';

export type ExportDiagramType =
  | 'SYSTEM_CONTEXT'
  | 'CONTAINER'
  | 'COMPONENT'
  | 'SEQUENCE'
  | 'DFD'
  | 'DEPLOYMENT'
  | 'FEATURE_DAG'
  | 'AGENT_ARCHITECTURE'
  | 'SECURITY_ARCHITECTURE'
  | 'ERD'
  | 'STATE_MACHINE'
  | 'API_MAP';

/**
 * Export diagram to Mermaid syntax
 * For: System Context, Container, Component, Sequence, DFD, Deployment, Feature DAG, Agent, Security
 */
export function exportToMermaid(diagramType: ExportDiagramType, data: ReactFlowJsonObject): string {
  const { nodes = [], edges = [] } = data;

  switch (diagramType) {
    case 'SYSTEM_CONTEXT':
    case 'CONTAINER':
    case 'COMPONENT':
      return exportC4ToMermaid(diagramType, nodes, edges);
    
    case 'SEQUENCE':
      return exportSequenceToMermaid(nodes, edges);
    
    case 'DFD':
      return exportDFDToMermaid(nodes, edges);
    
    case 'STATE_MACHINE':
      return exportStateMachineToMermaid(nodes, edges);
    
    case 'DEPLOYMENT':
    case 'FEATURE_DAG':
    case 'AGENT_ARCHITECTURE':
    case 'SECURITY_ARCHITECTURE':
      return exportFlowchartToMermaid(nodes, edges);
    
    default:
      return `graph TD\n  Start[Diagram: ${diagramType}]`;
  }
}

/**
 * Export diagram to SVG
 * Basic implementation - returns placeholder for now
 */
export function exportToSVG(diagramType: ExportDiagramType, data: ReactFlowJsonObject): string {
  const { nodes = [], edges = [] } = data;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#0a0a0a"/>
  <text x="400" y="300" fill="#fff" text-anchor="middle">
    ${diagramType} (${nodes.length} nodes, ${edges.length} edges)
  </text>
</svg>`;
}

/**
 * Export ERD to DBML
 */
export function exportToDBML(data: ReactFlowJsonObject): string {
  const { nodes = [], edges = [] } = data;
  
  let dbml = '// Database Schema\n\n';
  
  // Export entities as tables
  const entities = nodes.filter(n => n.type === 'er-entity' || n.type === 'er-weak-entity');
  for (const entity of entities) {
    const entityData = entity.data as any;
    dbml += `Table ${entityData.label || entity.id} {\n`;
    
    if (entityData.attributes && Array.isArray(entityData.attributes)) {
      for (const attr of entityData.attributes) {
        const isPK = entityData.primaryKey === attr;
        dbml += `  ${attr} varchar${isPK ? ' [pk]' : ''}\n`;
      }
    }
    
    dbml += '}\n\n';
  }
  
  // Export relationships
  for (const edge of edges) {
    const sourceData = edge.data as any;
    dbml += `Ref: ${edge.source}.id ${sourceData.cardinality || '>'} ${edge.target}.id\n`;
  }
  
  return dbml;
}

/**
 * Export API Map to OpenAPI YAML
 */
export function exportToOpenAPI(data: ReactFlowJsonObject): string {
  const { nodes = [], edges = [] } = data;
  
  let yaml = `openapi: 3.1.0
info:
  title: API Specification
  version: 1.0.0
  description: Generated from API Map diagram

servers:
  - url: https://api.example.com/v1
    description: Production server

paths:
`;
  
  // Export endpoint nodes as paths
  const endpoints = nodes.filter(n => n.type === 'api-endpoint');
  for (const endpoint of endpoints) {
    const endpointData = endpoint.data as any;
    const path = endpointData.path || `/${endpoint.id}`;
    const method = (endpointData.method || 'get').toLowerCase();
    
    yaml += `  ${path}:\n`;
    yaml += `    ${method}:\n`;
    yaml += `      summary: ${endpointData.label || endpoint.id}\n`;
    yaml += `      description: ${endpointData.description || ''}\n`;
    yaml += `      responses:\n`;
    yaml += `        '200':\n`;
    yaml += `          description: Successful response\n`;
    yaml += `\n`;
  }
  
  return yaml;
}

/**
 * Export State Machine to XState JSON
 */
export function exportToXState(data: ReactFlowJsonObject): string {
  const { nodes = [], edges = [] } = data;
  
  const xstate = {
    id: 'stateMachine',
    initial: nodes[0]?.id || 'initial',
    states: {} as Record<string, any>,
  };
  
  // Export states
  for (const node of nodes) {
    const stateData = node.data as any;
    xstate.states[node.id] = {
      on: {},
    };
    
    if (stateData.type === 'final') {
      xstate.states[node.id].type = 'final';
    }
  }
  
  // Export transitions
  for (const edge of edges) {
    const edgeData = edge.data as any;
    const event = edgeData.label || 'EVENT';
    
    if (!xstate.states[edge.source]) {
      xstate.states[edge.source] = { on: {} };
    }
    
    xstate.states[edge.source].on[event] = edge.target;
  }
  
  return JSON.stringify(xstate, null, 2);
}

// Helper functions for Mermaid export

function exportC4ToMermaid(type: ExportDiagramType, nodes: Node[], edges: Edge[]): string {
  let mermaid = 'graph TD\n';
  
  for (const node of nodes) {
    const nodeData = node.data as any;
    const label = nodeData.label || node.id;
    const shape = getC4Shape(nodeData.nodeType);
    mermaid += `  ${node.id}${shape[0]}${label}${shape[1]}\n`;
  }
  
  for (const edge of edges) {
    const edgeData = edge.data as any;
    const label = edgeData.label || '';
    mermaid += `  ${edge.source} -->|${label}| ${edge.target}\n`;
  }
  
  return mermaid;
}

function exportSequenceToMermaid(nodes: Node[], edges: Edge[]): string {
  let mermaid = 'sequenceDiagram\n';
  
  const participants = nodes.filter(n => n.type === 'sequence-lifeline' || n.type === 'sequence-actor');
  for (const p of participants) {
    const pData = p.data as any;
    mermaid += `  participant ${p.id} as ${pData.label || p.id}\n`;
  }
  
  for (const edge of edges.sort((a, b) => (a.data as any).order - (b.data as any).order)) {
    const edgeData = edge.data as any;
    const arrow = edgeData.edgeType === 'sync' ? '->>' : '-->';
    mermaid += `  ${edge.source}${arrow}${edge.target}: ${edgeData.label || ''}\n`;
  }
  
  return mermaid;
}

function exportDFDToMermaid(nodes: Node[], edges: Edge[]): string {
  let mermaid = 'graph LR\n';
  
  for (const node of nodes) {
    const nodeData = node.data as any;
    const label = nodeData.label || node.id;
    mermaid += `  ${node.id}[${label}]\n`;
  }
  
  for (const edge of edges) {
    const edgeData = edge.data as any;
    mermaid += `  ${edge.source} -->|${edgeData.label || 'data'}| ${edge.target}\n`;
  }
  
  return mermaid;
}

function exportStateMachineToMermaid(nodes: Node[], edges: Edge[]): string {
  let mermaid = 'stateDiagram-v2\n';
  
  for (const edge of edges) {
    const edgeData = edge.data as any;
    mermaid += `  ${edge.source} --> ${edge.target}: ${edgeData.label || ''}\n`;
  }
  
  return mermaid;
}

function exportFlowchartToMermaid(nodes: Node[], edges: Edge[]): string {
  let mermaid = 'graph TD\n';
  
  for (const node of nodes) {
    const nodeData = node.data as any;
    mermaid += `  ${node.id}[${nodeData.label || node.id}]\n`;
  }
  
  for (const edge of edges) {
    const edgeData = edge.data as any;
    mermaid += `  ${edge.source} --> ${edge.target}\n`;
  }
  
  return mermaid;
}

function getC4Shape(nodeType: string): [string, string] {
  switch (nodeType) {
    case 'person': return ['[', ']'];
    case 'system': return ['[[', ']]'];
    case 'container': return ['[(', ')]'];
    case 'database': return ['[(', ')]'];
    default: return ['[', ']'];
  }
}
