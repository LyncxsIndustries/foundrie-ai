import { describe, it, expect } from 'vitest';
import {
  exportToMermaid,
  exportToSVG,
  exportToDBML,
  exportToOpenAPI,
  exportToXState,
} from './export-formats';
import type { ReactFlowJsonObject } from '@xyflow/react';

describe('lib/diagrams/export-formats', () => {
  const sampleData: ReactFlowJsonObject = {
    nodes: [
      { id: 'node1', type: 'c4-system', position: { x: 0, y: 0 }, data: { label: 'System A', nodeType: 'system' } },
      { id: 'node2', type: 'c4-container', position: { x: 200, y: 0 }, data: { label: 'Container B', nodeType: 'container' } },
    ],
    edges: [
      { id: 'edge1', source: 'node1', target: 'node2', data: { label: 'calls' } },
    ],
  };

  describe('exportToMermaid', () => {
    it('exports C4 diagrams to Mermaid', () => {
      const mermaid = exportToMermaid('SYSTEM_CONTEXT', sampleData);
      
      expect(mermaid).toContain('graph TD');
      expect(mermaid).toContain('node1');
      expect(mermaid).toContain('System A');
    });

    it('exports sequence diagrams to Mermaid', () => {
      const sequenceData: ReactFlowJsonObject = {
        nodes: [
          { id: 'user', type: 'sequence-actor', position: { x: 0, y: 0 }, data: { label: 'User' } },
          { id: 'api', type: 'sequence-lifeline', position: { x: 200, y: 0 }, data: { label: 'API' } },
        ],
        edges: [
          { id: 'e1', source: 'user', target: 'api', data: { label: 'request', edgeType: 'sync', order: 1 } },
        ],
      };
      
      const mermaid = exportToMermaid('SEQUENCE', sequenceData);
      
      expect(mermaid).toContain('sequenceDiagram');
      expect(mermaid).toContain('participant');
    });

    it('exports state machines to Mermaid', () => {
      const stateData: ReactFlowJsonObject = {
        nodes: [
          { id: 'idle', type: 'state', position: { x: 0, y: 0 }, data: { label: 'Idle' } },
          { id: 'active', type: 'state', position: { x: 200, y: 0 }, data: { label: 'Active' } },
        ],
        edges: [
          { id: 'e1', source: 'idle', target: 'active', data: { label: 'start' } },
        ],
      };
      
      const mermaid = exportToMermaid('STATE_MACHINE', stateData);
      
      expect(mermaid).toContain('stateDiagram-v2');
    });
  });

  describe('exportToSVG', () => {
    it('exports diagram to SVG', () => {
      const svg = exportToSVG('CONTAINER', sampleData);
      
      expect(svg).toContain('<svg');
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(svg).toContain('CONTAINER');
    });
  });

  describe('exportToDBML', () => {
    it('exports ERD to DBML', () => {
      const erdData: ReactFlowJsonObject = {
        nodes: [
          {
            id: 'user',
            type: 'er-entity',
            position: { x: 0, y: 0 },
            data: { label: 'User', attributes: ['id', 'name', 'email'], primaryKey: 'id' },
          },
          {
            id: 'post',
            type: 'er-entity',
            position: { x: 200, y: 0 },
            data: { label: 'Post', attributes: ['id', 'title', 'userId'], primaryKey: 'id' },
          },
        ],
        edges: [
          { id: 'e1', source: 'user', target: 'post', data: { cardinality: '1-to-many' } },
        ],
      };
      
      const dbml = exportToDBML(erdData);
      
      expect(dbml).toContain('Table User');
      expect(dbml).toContain('Table Post');
      expect(dbml).toContain('id varchar [pk]');
      expect(dbml).toContain('Ref:');
    });
  });

  describe('exportToOpenAPI', () => {
    it('exports API Map to OpenAPI YAML', () => {
      const apiData: ReactFlowJsonObject = {
        nodes: [
          {
            id: 'get-users',
            type: 'api-endpoint',
            position: { x: 0, y: 0 },
            data: { label: 'Get Users', path: '/users', method: 'GET', description: 'Fetch all users' },
          },
        ],
        edges: [],
      };
      
      const yaml = exportToOpenAPI(apiData);
      
      expect(yaml).toContain('openapi: 3.1.0');
      expect(yaml).toContain('/users:');
      expect(yaml).toContain('get:');
      expect(yaml).toContain('Fetch all users');
    });
  });

  describe('exportToXState', () => {
    it('exports State Machine to XState JSON', () => {
      const stateData: ReactFlowJsonObject = {
        nodes: [
          { id: 'idle', type: 'state', position: { x: 0, y: 0 }, data: { label: 'Idle' } },
          { id: 'loading', type: 'state', position: { x: 200, y: 0 }, data: { label: 'Loading' } },
          { id: 'success', type: 'state', position: { x: 400, y: 0 }, data: { label: 'Success', type: 'final' } },
        ],
        edges: [
          { id: 'e1', source: 'idle', target: 'loading', data: { label: 'FETCH' } },
          { id: 'e2', source: 'loading', target: 'success', data: { label: 'SUCCESS' } },
        ],
      };
      
      const json = exportToXState(stateData);
      const xstate = JSON.parse(json);
      
      expect(xstate.id).toBe('stateMachine');
      expect(xstate.initial).toBe('idle');
      expect(xstate.states.idle).toBeDefined();
      expect(xstate.states.idle.on.FETCH).toBe('loading');
      expect(xstate.states.success.type).toBe('final');
    });
  });
});
