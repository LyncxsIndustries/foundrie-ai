/**
 * Feature 53: Project Complexity Classifier
 *
 * Analyzes project descriptions to determine complexity level and required
 * discovery phases. Scales from simple landing pages (3-4 phases) to complex
 * enterprise platforms (8 phases).
 */

import { callAI } from '@/lib/ai/rotation-engine';
import type { CallResult } from '@/lib/ai/rotation-engine';
import { logEvent } from '@/lib/ai/log';

export type ProjectComplexity = 'SIMPLE' | 'STANDARD' | 'COMPLEX';

export type PhaseId =
  | 'problem'
  | 'users'
  | 'flows'
  | 'scope'
  | 'research'
  | 'technical'
  | 'features'
  | 'architecture';

export interface ComplexityAnalysis {
  complexity: ProjectComplexity;
  reasoning: string;
  estimatedPhases: number;
  estimatedMessages: number;
  requiredPhases: PhaseId[];
}

const COMPLEXITY_CLASSIFICATION_PROMPT = `Analyze this project description and classify its complexity.

Return JSON only (no markdown, no code blocks):
{
  "complexity": "SIMPLE" | "STANDARD" | "COMPLEX",
  "reasoning": "why this classification",
  "estimatedPhases": number,
  "estimatedMessages": number,
  "requiredPhases": ["problem", "flows", "scope", ...]
}

Classification rules:
- **SIMPLE**: Landing page, portfolio, blog, single CRUD app, static site, simple tool
  → 3-4 phases, 5-10 messages, skip Research/Architecture/Feature Sequence
  → Required: [problem, flows, scope]

- **STANDARD**: SaaS dashboard, marketplace, social app, booking system, API service
  → 6-7 phases, 15-25 messages, skip Research if no external integrations
  → Required: [problem, users, flows, scope, technical, features]

- **COMPLEX**: Multi-tenant platform, enterprise system, heavy AI/ML, blockchain, real-time collaboration, microservices
  → All 8 phases, 30+ messages
  → Required: [problem, users, flows, scope, research, technical, features, architecture]

Signals for complexity:
- SIMPLE: "landing page", "portfolio", "static", "one page", "showcase"
- STANDARD: "dashboard", "SaaS", "users can", "authentication", "CRUD"
- COMPLEX: "multi-tenant", "enterprise", "microservices", "real-time", "AI", "blockchain", "SSO", "RBAC"`;

/**
 * Classifies project complexity based on initial description.
 * Uses AI to analyze scope and determine required discovery phases.
 */
export async function classifyProjectComplexity(
  description: string
): Promise<ComplexityAnalysis> {
  const startTime = Date.now();

  try {
    logEvent('info', {
      event: 'ai_outcome',
      task: 'project_complexity_classification',
      modelKey: 'unified-rotation',
      status: 'ok',
      attempts: 1,
      durationMs: 0,
    });

    const result: CallResult = await callAI('project_complexity_classification', {
      systemPrompt: COMPLEXITY_CLASSIFICATION_PROMPT,
      userPrompt: `Project description:\n\n${description}`,
      plan: 'FREE', // Lightweight analysis, works on free tier
      maxTokens: 500,
    });

    if (result.status !== 'ok') {
      logEvent('error', {
        event: 'ai_outcome',
        task: 'project_complexity_classification',
        modelKey: 'unified-rotation',
        status: 'queued',
        attempts: 1,
        durationMs: Date.now() - startTime,
      });
      // Fallback to STANDARD if AI unavailable
      return {
        complexity: 'STANDARD',
        reasoning: 'AI unavailable, defaulting to standard complexity',
        estimatedPhases: 6,
        estimatedMessages: 20,
        requiredPhases: ['problem', 'users', 'flows', 'scope', 'technical', 'features'],
      };
    }

    const analysis = JSON.parse(result.text) as ComplexityAnalysis;

    // Validate required phases array
    if (!Array.isArray(analysis.requiredPhases) || analysis.requiredPhases.length === 0) {
      throw new Error('Invalid requiredPhases in classification response');
    }

    logEvent('info', {
      event: 'ai_outcome',
      task: 'project_complexity_classification',
      modelKey: 'unified-rotation',
      status: 'ok',
      attempts: 1,
      durationMs: Date.now() - startTime,
    });

    return analysis;
  } catch (error) {
    logEvent('error', {
      event: 'ai_outcome',
      task: 'project_complexity_classification',
      modelKey: 'unified-rotation',
      status: 'queued',
      attempts: 1,
      durationMs: Date.now() - startTime,
    });

    // Fallback to STANDARD on any error
    return {
      complexity: 'STANDARD',
      reasoning: 'Classification error, defaulting to standard complexity',
      estimatedPhases: 6,
      estimatedMessages: 20,
      requiredPhases: ['problem', 'users', 'flows', 'scope', 'technical', 'features'],
    };
  }
}
