/**
 * Feature 53: Phase Detector Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  analyzePhaseCompletion,
  determineNextPhase,
  getPhaseLabel,
  getPhaseIntroQuestion,
} from './phase-detector';
import type { Message, CompletionAnalysis } from './phase-detector';
import * as rotationEngine from './rotation-engine';

vi.mock('./rotation-engine');
vi.mock('./log');

describe('analyzePhaseCompletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('detects complete problem phase with high coverage', async () => {
    const conversation: Message[] = [
      {
        role: 'assistant',
        content: 'What problem does this solve?',
      },
      {
        role: 'user',
        content:
          'Freelancers struggle to find consistent clients. We connect them with vetted businesses.',
      },
      {
        role: 'assistant',
        content: 'Who are your target users?',
      },
      {
        role: 'user',
        content:
          'Freelance designers and developers, and small businesses needing contractors.',
      },
    ];

    const mockResponse: Omit<CompletionAnalysis, 'isComplete' | 'nextPhase'> = {
      coverage: 90,
      confidenceScore: 88,
      missingItems: [],
      shouldAdvance: true,
      suggestedQuestion: null,
    };

    vi.mocked(rotationEngine.callAI).mockResolvedValue({
      status: 'ok',
      text: JSON.stringify(mockResponse),
    });

    const result = await analyzePhaseCompletion('problem', conversation, 'SIMPLE');

    expect(result.coverage).toBeGreaterThan(80);
    expect(result.confidenceScore).toBeGreaterThan(85);
    expect(result.shouldAdvance).toBe(true);
    expect(result.nextPhase).toBe('flows'); // Next required phase for SIMPLE
  });

  it('detects incomplete scope phase with missing items', async () => {
    const conversation: Message[] = [
      {
        role: 'assistant',
        content: "What's out of scope?",
      },
      {
        role: 'user',
        content: 'No mobile app for now.',
      },
    ];

    const mockResponse: Omit<CompletionAnalysis, 'isComplete' | 'nextPhase'> = {
      coverage: 40,
      confidenceScore: 45,
      missingItems: ['Timeline or constraints', 'Core features not listed'],
      shouldAdvance: false,
      suggestedQuestion: 'What timeline or constraints are you working with?',
    };

    vi.mocked(rotationEngine.callAI).mockResolvedValue({
      status: 'ok',
      text: JSON.stringify(mockResponse),
    });

    const result = await analyzePhaseCompletion('scope', conversation, 'STANDARD');

    expect(result.isComplete).toBe(false);
    expect(result.coverage).toBeLessThan(80);
    expect(result.confidenceScore).toBeLessThan(60);
    expect(result.shouldAdvance).toBe(false);
    expect(result.missingItems.length).toBeGreaterThan(0);
    expect(result.suggestedQuestion).toBeTruthy();
  });

  it('handles complex project with higher completion threshold', async () => {
    const conversation: Message[] = [
      {
        role: 'assistant',
        content: 'Describe the technical architecture.',
      },
      {
        role: 'user',
        content: 'Microservices with event-driven communication.',
      },
    ];

    const mockResponse: Omit<CompletionAnalysis, 'isComplete' | 'nextPhase'> = {
      coverage: 85,
      confidenceScore: 92,
      missingItems: [],
      shouldAdvance: false, // 92 < 95 threshold for COMPLEX
      suggestedQuestion: null,
    };

    vi.mocked(rotationEngine.callAI).mockResolvedValue({
      status: 'ok',
      text: JSON.stringify(mockResponse),
    });

    const result = await analyzePhaseCompletion(
      'architecture',
      conversation,
      'COMPLEX'
    );

    expect(result.shouldAdvance).toBe(false); // Complex requires 95% confidence
    expect(result.coverage).toBeGreaterThan(80);
  });

  it('falls back gracefully when AI unavailable', async () => {
    vi.mocked(rotationEngine.callAI).mockResolvedValue({
      status: 'queued',
      retryable: true,
      position: null,
      rateLimited: false,
    });

    const result = await analyzePhaseCompletion('problem', [], 'STANDARD');

    expect(result.isComplete).toBe(false);
    expect(result.coverage).toBe(50);
    expect(result.shouldAdvance).toBe(false);
    expect(result.suggestedQuestion).toBeTruthy();
  });

  it('falls back gracefully on AI error', async () => {
    vi.mocked(rotationEngine.callAI).mockRejectedValue(
      new Error('AI provider error')
    );

    const result = await analyzePhaseCompletion('flows', [], 'SIMPLE');

    expect(result.isComplete).toBe(false);
    expect(result.coverage).toBe(50);
    expect(result.shouldAdvance).toBe(false);
  });

  it('handles invalid phase ID with fallback', async () => {
    // Implementation uses graceful fallback instead of throwing
    const result = await analyzePhaseCompletion(
      // @ts-expect-error Testing invalid input
      'invalid_phase',
      [],
      'STANDARD'
    );

    expect(result.isComplete).toBe(false);
    expect(result.shouldAdvance).toBe(false);
    expect(result.suggestedQuestion).toBeTruthy();
  });
});

describe('determineNextPhase', () => {
  it('returns next phase for SIMPLE complexity', () => {
    expect(determineNextPhase('problem', 'SIMPLE')).toBe('flows');
    expect(determineNextPhase('flows', 'SIMPLE')).toBe('scope');
    expect(determineNextPhase('scope', 'SIMPLE')).toBeUndefined(); // Done
  });

  it('returns next phase for STANDARD complexity', () => {
    expect(determineNextPhase('problem', 'STANDARD')).toBe('users');
    expect(determineNextPhase('users', 'STANDARD')).toBe('flows');
    expect(determineNextPhase('scope', 'STANDARD')).toBe('technical');
    expect(determineNextPhase('technical', 'STANDARD')).toBe('features');
    expect(determineNextPhase('features', 'STANDARD')).toBeUndefined(); // Done
  });

  it('returns next phase for COMPLEX complexity', () => {
    expect(determineNextPhase('problem', 'COMPLEX')).toBe('users');
    expect(determineNextPhase('scope', 'COMPLEX')).toBe('research');
    expect(determineNextPhase('features', 'COMPLEX')).toBe('architecture');
    expect(determineNextPhase('architecture', 'COMPLEX')).toBeUndefined(); // Done
  });

  it('skips phases not required for complexity', () => {
    // SIMPLE skips users, research, technical, features, architecture
    expect(determineNextPhase('problem', 'SIMPLE')).toBe('flows');
    expect(determineNextPhase('problem', 'SIMPLE')).not.toBe('users');
  });

  it('returns undefined for invalid current phase', () => {
    // @ts-expect-error Testing invalid input
    expect(determineNextPhase('invalid', 'STANDARD')).toBeUndefined();
  });
});

describe('getPhaseLabel', () => {
  it('returns human-readable labels', () => {
    expect(getPhaseLabel('problem')).toBe('Problem & Goals');
    expect(getPhaseLabel('users')).toBe('Users & Personas');
    expect(getPhaseLabel('flows')).toBe('User Flows');
    expect(getPhaseLabel('scope')).toBe('Scope & Constraints');
  });

  it('falls back to phase ID for unknown phases', () => {
    // @ts-expect-error Testing invalid input
    expect(getPhaseLabel('unknown')).toBe('unknown');
  });
});

describe('getPhaseIntroQuestion', () => {
  it('returns appropriate intro questions', () => {
    expect(getPhaseIntroQuestion('problem')).toContain('core problem');
    expect(getPhaseIntroQuestion('users')).toContain('primary users');
    expect(getPhaseIntroQuestion('flows')).toContain('main user flow');
  });

  it('provides fallback for unknown phases', () => {
    // @ts-expect-error Testing invalid input
    expect(getPhaseIntroQuestion('unknown')).toBeTruthy();
  });
});
