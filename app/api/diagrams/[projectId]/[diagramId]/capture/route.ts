import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-auth';
import { requireProjectMember } from '@/lib/projects/auth';
import { db } from '@/lib/db';
import { dataUrlToBuffer } from '@/lib/diagrams/capture';
import { saveDiagramData } from '@/lib/diagrams/storage';
import {
  exportToMermaid,
  exportToSVG,
  exportToDBML,
  exportToOpenAPI,
  exportToXState,
  type ExportDiagramType,
} from '@/lib/diagrams/export-formats';
import type { ReactFlowJsonObject } from '@xyflow/react';
import { DiagramStatus } from '@/lib/generated/prisma/client';
import { z } from 'zod';

const CaptureRequestSchema = z.object({
  pngDataUrl: z.string(),
  reactFlowData: z.object({
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
    viewport: z.object({
      x: z.number(),
      y: z.number(),
      zoom: z.number(),
    }).optional(),
  }),
});

const EXPORT_TYPE_BY_DIAGRAM_ID: Record<string, ExportDiagramType> = {
  'system-context': 'SYSTEM_CONTEXT',
  container: 'CONTAINER',
  component: 'COMPONENT',
  sequence: 'SEQUENCE',
  dfd: 'DFD',
  deployment: 'DEPLOYMENT',
  'feature-dag': 'FEATURE_DAG',
  'agent-architecture': 'AGENT_ARCHITECTURE',
  'security-architecture': 'SECURITY_ARCHITECTURE',
  erd: 'ERD',
  'state-machine': 'STATE_MACHINE',
  'api-map': 'API_MAP',
};

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ projectId: string; diagramId: string }> }
) {
  try {
    const user = await requireAuth();
    const { projectId, diagramId } = await context.params;
    await requireProjectMember(projectId, user.id);

    // Parse and validate request
    const body = await req.json();
    const parsed = CaptureRequestSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request data', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { pngDataUrl, reactFlowData } = parsed.data;

    // Fetch diagram to verify ownership and get type
    const diagram = await db.diagram.findFirst({
      where: { id: diagramId, projectId },
      select: { id: true, diagramTypeId: true, version: true },
    });

    if (!diagram) {
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
    }

    const exportType = EXPORT_TYPE_BY_DIAGRAM_ID[diagram.diagramTypeId];
    if (!exportType) {
      return NextResponse.json({ error: 'Unsupported diagram type' }, { status: 400 });
    }

    // Convert data URL to buffer
    const pngBuffer = dataUrlToBuffer(pngDataUrl);

    // Generate format-specific exports based on diagram type
    const exports: Record<string, string> = {};

    switch (exportType) {
      case 'SYSTEM_CONTEXT':
      case 'CONTAINER':
      case 'COMPONENT':
      case 'SEQUENCE':
      case 'DFD':
      case 'DEPLOYMENT':
      case 'FEATURE_DAG':
      case 'AGENT_ARCHITECTURE':
      case 'SECURITY_ARCHITECTURE':
        exports.mermaid = exportToMermaid(exportType, reactFlowData as ReactFlowJsonObject);
        exports.svg = exportToSVG(exportType, reactFlowData as ReactFlowJsonObject);
        break;

      case 'ERD':
        exports.dbml = exportToDBML(reactFlowData as ReactFlowJsonObject);
        // PNG already captured
        break;

      case 'STATE_MACHINE':
        exports.mermaid = exportToMermaid(exportType, reactFlowData as ReactFlowJsonObject);
        exports.xstate = exportToXState(reactFlowData as ReactFlowJsonObject);
        break;

      case 'API_MAP':
        exports.openapi = exportToOpenAPI(reactFlowData as ReactFlowJsonObject);
        break;

      default:
        break;
    }

    const result = await saveDiagramData({
      diagramId,
      reactFlowData,
      pngBuffer,
      status: DiagramStatus.DONE,
    });

    return NextResponse.json({
      success: true,
      pngUrl: result.pngUrl,
      exports,
    });
  } catch (error) {
    if ((error as any).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if ((error as any).message === 'Project not found') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    console.error('Diagram capture error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
