/**
 * Feature 53: Complexity Classifier Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { classifyProjectComplexity } from './complexity-classifier';
import type { ComplexityAnalysis } from './complexity-classifier';
import * as rotationEngine from './rotation-engine';

vi.mock('./rotation-engine');
vi.mock('./log');

describe('classifyProjectComplexity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('classifies landing page as SIMPLE', async () => {
    const mockResponse: ComplexityAnalysis = {
      complexity: 'SIMPLE',
      reasoning: 'Simple portfolio with static pages',
      estimatedPhases: 3,
      estimatedMessages: 8,
      requiredPhases: ['problem', 'flows', 'scope'],
    };

    vi.mocked(rotationEngine.callAI).mockResolvedValue({} as any); // {
      status: "ok", modelKey: "mock", attempts: 1, provider: "mock", model: "mock",
      text: JSON.stringify(mockResponse),
    });

    const result = await classifyProjectComplexity(
      'A portfolio site with hero section, projects grid, and contact form'
    );

    expect(result.complexity).toBe('SIMPLE');
    expect(result.estimatedMessages).toBeLessThan(15);
    expect(result.requiredPhases).toEqual(['problem', 'flows', 'scope']);
    expect(result.requiredPhases).not.toContain('architecture');
  });

  it('classifies SaaS dashboard as STANDARD', async () => {
    const mockResponse: ComplexityAnalysis = {
      complexity: 'STANDARD',
      reasoning: 'SaaS app with user auth and CRUD operations',
      estimatedPhases: 6,
      estimatedMessages: 20,
      requiredPhases: ['problem', 'users', 'flows', 'scope', 'technical', 'features'],
    };

    vi.mocked(rotationEngine.callAI).mockResolvedValue({} as any); // {
      status: "ok", modelKey: "mock", attempts: 1, provider: "mock", model: "mock",
      text: JSON.stringify(mockResponse),
    });

    const result = await classifyProjectComplexity(
      'Task management SaaS with user authentication, project boards, and team collaboration'
    );

    expect(result.complexity).toBe('STANDARD');
    expect(result.estimatedMessages).toBeGreaterThan(10);
    expect(result.estimatedMessages).toBeLessThan(30);
    expect(result.requiredPhases).toContain('technical');
    expect(result.requiredPhases).not.toContain('architecture');
  });

  it('classifies enterprise platform as COMPLEX', async () => {
    const mockResponse: ComplexityAnalysis = {
      complexity: 'COMPLEX',
      reasoning: 'Multi-tenant enterprise platform with advanced features',
      estimatedPhases: 8,
      estimatedMessages: 35,
      requiredPhases: [
        'problem',
        'users',
        'flows',
        'scope',
        'research',
        'technical',
        'features',
        'architecture',
      ],
    };

    vi.mocked(rotationEngine.callAI).mockResolvedValue({} as any); // {
      status: "ok", modelKey: "mock", attempts: 1, provider: "mock", model: "mock",
      text: JSON.stringify(mockResponse),
    });

    const result = await classifyProjectComplexity(
      'Multi-tenant B2B platform with SSO, RBAC, real-time collaboration, and AI-powered analytics'
    );

    expect(result.complexity).toBe('COMPLEX');
    expect(result.estimatedMessages).toBeGreaterThan(25);
    expect(result.requiredPhases).toHaveLength(8);
    expect(result.requiredPhases).toContain('architecture');
  });

  it('falls back to STANDARD when AI unavailable', async () => {
    vi.mocked(rotationEngine.callAI).mockResolvedValue({} as any); // {
      status: "queued", modelKey: "mock", attempts: 1,
      retryable: true,
      position: null,
      rateLimited: false,
    });

    const result = await classifyProjectComplexity('Any project description');

    expect(result.complexity).toBe('STANDARD');
    expect(result.estimatedPhases).toBe(6);
    expect(result.reasoning).toContain('unavailable');
  });

  it('falls back to STANDARD on AI error', async () => {
    vi.mocked(rotationEngine.callAI).mockRejectedValue(
      new Error('AI provider error')
    );

    const result = await classifyProjectComplexity('Any project description');

    expect(result.complexity).toBe('STANDARD');
    expect(result.estimatedPhases).toBe(6);
    expect(result.reasoning).toContain('error');
  });

  it('falls back to STANDARD on invalid JSON', async () => {
    vi.mocked(rotationEngine.callAI).mockResolvedValue({} as any); // {
      status: "ok", modelKey: "mock", attempts: 1, provider: "mock", model: "mock",
      text: 'Invalid JSON response',
    });

    const result = await classifyProjectComplexity('Any project description');

    expect(result.complexity).toBe('STANDARD');
    expect(result.reasoning).toContain('error');
  });

  it('falls back to STANDARD on missing requiredPhases', async () => {
    vi.mocked(rotationEngine.callAI).mockResolvedValue({} as any); // {
      status: "ok", modelKey: "mock", attempts: 1, provider: "mock", model: "mock",
      text: JSON.stringify({
        complexity: 'SIMPLE',
        reasoning: 'Test',
        estimatedPhases: 3,
        estimatedMessages: 8,
        requiredPhases: [], // Empty array should trigger fallback
      }),
    });

    const result = await classifyProjectComplexity('Any project description');

    expect(result.complexity).toBe('STANDARD');
    expect(result.reasoning).toContain('error');
  });
});
