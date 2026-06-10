import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { requireAuth } from '@/lib/auth/require-auth';
import { requireProjectMember } from '@/lib/projects/auth';
import { db } from '@/lib/db';
import { saveDiagramData } from '@/lib/diagrams/storage';

vi.mock('@/lib/auth/require-auth');
vi.mock('@/lib/projects/auth');
vi.mock('@/lib/db');
vi.mock('@/lib/diagrams/storage');

describe('POST /api/diagrams/[projectId]/[diagramId]/capture', () => {
  const mockUser = { id: 'user-1', clerkId: 'clerk-1', email: 'test@example.com', plan: 'FREE', role: 'USER' };
  const projectId = 'project-1';
  const diagramId = 'diagram-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new Error('Unauthorized'));

    const req = new Request('http://localhost/api/diagrams/p/d/capture', {
      method: 'POST',
      body: JSON.stringify({ pngDataUrl: 'data:image/png;base64,abc', reactFlowData: { nodes: [], edges: [] } }),
    });

    const res = await POST(req, { params: Promise.resolve({ projectId, diagramId }) });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 404 when user is not a project member', async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockUser);
    vi.mocked(requireProjectMember).mockRejectedValue(new Error('Project not found'));

    const req = new Request('http://localhost/api/diagrams/p/d/capture', {
      method: 'POST',
      body: JSON.stringify({ pngDataUrl: 'data:image/png;base64,abc', reactFlowData: { nodes: [], edges: [] } }),
    });

    const res = await POST(req, { params: Promise.resolve({ projectId, diagramId }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Not found');
  });

  it('returns 404 when diagram does not exist', async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockUser);
    vi.mocked(requireProjectMember).mockResolvedValue(undefined);
    vi.mocked(db, { partial: true, deep: true }).diagram = {
      findFirst: vi.fn().mockResolvedValue(null),
    } as any;

    const req = new Request('http://localhost/api/diagrams/p/d/capture', {
      method: 'POST',
      body: JSON.stringify({ pngDataUrl: 'data:image/png;base64,abc', reactFlowData: { nodes: [], edges: [] } }),
    });

    const res = await POST(req, { params: Promise.resolve({ projectId, diagramId }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Diagram not found');
  });

  it('captures and saves diagram with exports', async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockUser);
    vi.mocked(requireProjectMember).mockResolvedValue(undefined);
    vi.mocked(db, { partial: true, deep: true }).diagram = {
      findFirst: vi.fn().mockResolvedValue({
        id: diagramId,
        diagramTypeId: 'system-context',
        version: 1,
      }),
    } as any;
    vi.mocked(saveDiagramData).mockResolvedValue({
      pngUrl: 'https://blob.example.com/diagram.png',
    } as any);

    const req = new Request('http://localhost/api/diagrams/p/d/capture', {
      method: 'POST',
      body: JSON.stringify({
        pngDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
        reactFlowData: { nodes: [{ id: 'n1', position: { x: 0, y: 0 }, data: {} }], edges: [] },
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ projectId, diagramId }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.pngUrl).toBe('https://blob.example.com/diagram.png');
    expect(body.exports).toBeDefined();
    expect(body.exports.mermaid).toBeDefined();
    expect(body.exports.svg).toBeDefined();
  });

  it('generates DBML export for ERD diagrams', async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockUser);
    vi.mocked(requireProjectMember).mockResolvedValue(undefined);
    vi.mocked(db, { partial: true, deep: true }).diagram = {
      findFirst: vi.fn().mockResolvedValue({
        id: diagramId,
        diagramTypeId: 'erd',
        version: 1,
      }),
    } as any;
    vi.mocked(saveDiagramData).mockResolvedValue({
      pngUrl: 'https://blob.example.com/diagram.png',
    } as any);

    const req = new Request('http://localhost/api/diagrams/p/d/capture', {
      method: 'POST',
      body: JSON.stringify({
        pngDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
        reactFlowData: { nodes: [{ id: 'n1', type: 'er-entity', position: { x: 0, y: 0 }, data: { label: 'User' } }], edges: [] },
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ projectId, diagramId }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.exports.dbml).toBeDefined();
    expect(body.exports.dbml).toContain('Table');
  });

  it('generates OpenAPI export for API Map diagrams', async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockUser);
    vi.mocked(requireProjectMember).mockResolvedValue(undefined);
    vi.mocked(db, { partial: true, deep: true }).diagram = {
      findFirst: vi.fn().mockResolvedValue({
        id: diagramId,
        diagramTypeId: 'api-map',
        version: 1,
      }),
    } as any;
    vi.mocked(saveDiagramData).mockResolvedValue({
      pngUrl: 'https://blob.example.com/diagram.png',
    } as any);

    const req = new Request('http://localhost/api/diagrams/p/d/capture', {
      method: 'POST',
      body: JSON.stringify({
        pngDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
        reactFlowData: { nodes: [{ id: 'n1', type: 'api-endpoint', position: { x: 0, y: 0 }, data: { path: '/users', method: 'GET' } }], edges: [] },
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ projectId, diagramId }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.exports.openapi).toBeDefined();
    expect(body.exports.openapi).toContain('openapi: 3.1.0');
  });
});
