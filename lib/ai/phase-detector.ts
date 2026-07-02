/**
 * Feature 53: Phase Completion Detector
 *
 * Analyzes conversation content to determine when a discovery phase has gathered
 * sufficient information. Uses semantic analysis to detect coverage of phase
 * requirements rather than counting messages.
 */

import { callAI } from '@/lib/ai/rotation-engine';
import type { CallResult } from '@/lib/ai/rotation-engine';
import { logEvent } from '@/lib/ai/log';
import type { PhaseId, ProjectComplexity } from './complexity-classifier';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface CompletionAnalysis {
  isComplete: boolean;
  coverage: number; // 0-100%
  missingItems: string[];
  shouldAdvance: boolean;
  confidenceScore: number; // 0-100, used for auto-advance decision
  nextPhase?: PhaseId;
  suggestedQuestion?: string;
}

/**
 * Requirements checklist for each discovery phase.
 * Coverage is calculated by checking if conversation addresses these items.
 */
const PHASE_REQUIREMENTS: Record<PhaseId, string[]> = {
  problem: [
    'Core problem statement clearly defined',
    'Target users or audience identified',
    'Current solution or pain point described',
    'Success criteria or goals mentioned',
  ],
  users: [
    'Primary user personas identified',
    'User roles or types defined',
    'User goals and motivations described',
    'Usage patterns or frequency mentioned',
  ],
  flows: [
    'Primary user flow mapped',
    'Key actions or operations identified',
    'CRUD operations outlined',
    'Authentication/authorization needs specified',
  ],
  scope: [
    'Core features listed',
    'Out-of-scope features explicitly mentioned',
    'Timeline or constraints noted',
    'Design references provided (if applicable)',
  ],
  research: [
    'External integrations identified',
    'Third-party APIs or services mentioned',
    'Technical research needs outlined',
    'Competitor or reference products noted',
  ],
  technical: [
    'Technology preferences stated',
    'Performance requirements defined',
    'Scalability expectations mentioned',
    'Security or compliance needs outlined',
  ],
  features: [
    'Feature list prioritized',
    'MVP scope defined',
    'Nice-to-have features separated',
    'Feature dependencies identified',
  ],
  architecture: [
    'System architecture discussed',
    'Component boundaries identified',
    'Data flow patterns described',
    'Integration points mapped',
  ],
};

/**
 * Thresholds for auto-advance decisions based on confidence score.
 * - ≥85%: Auto-advance to next phase
 * - 60-84%: Show explicit continuation prompt
 * - <60%: Continue with follow-up questions
 */
const CONFIDENCE_THRESHOLDS = {
  AUTO_ADVANCE: 85,
  EXPLICIT_PROMPT: 60,
} as const;

function buildPhaseAnalysisPrompt(
  phase: PhaseId,
  requirements: string[],
  conversationText: string,
  complexity: ProjectComplexity
): string {
  return `Analyze if this discovery phase has gathered sufficient information.

Current Phase: ${phase}
Project Complexity: ${complexity}
Requirements for this phase:
${requirements.map((req, i) => `${i + 1}. ${req}`).join('\n')}

Conversation history:
${conversationText}

Return JSON only (no markdown, no code blocks):
{
  "isComplete": boolean,
  "coverage": number (0-100),
  "confidenceScore": number (0-100),
  "missingItems": string[],
  "shouldAdvance": boolean,
  "suggestedQuestion": "string or null"
}

Scoring rules:
- coverage: Percentage of requirements addressed in conversation
- confidenceScore: Confidence that phase is truly complete (0-100)
  * 100 = Comprehensive, detailed answers to all requirements
  * 85-99 = Good coverage, minor gaps acceptable
  * 60-84 = Decent coverage, but some uncertainty
  * <60 = Significant gaps or unclear answers

Auto-advance logic:
- confidenceScore ≥85 AND complexity="SIMPLE" → shouldAdvance=true
- confidenceScore ≥90 AND complexity="STANDARD" → shouldAdvance=true
- confidenceScore ≥95 AND complexity="COMPLEX" → shouldAdvance=true
- Otherwise → shouldAdvance=false, provide suggestedQuestion

If shouldAdvance=false and coverage <80%, provide a targeted question addressing the missing items.`;
}

/**
 * Analyzes whether a discovery phase has gathered sufficient information.
 * Returns completion analysis with coverage, confidence, and next steps.
 */
export async function analyzePhaseCompletion(
  phase: PhaseId,
  conversation: Message[],
  complexity: ProjectComplexity
): Promise<CompletionAnalysis> {
  const startTime = Date.now();

  try {
    const requirements = PHASE_REQUIREMENTS[phase];
    if (!requirements) {
      throw new Error(`Invalid phase ID: ${phase}`);
    }

    const conversationText = conversation
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n\n');

    logEvent('info', {
      event: 'ai_outcome',
      task: 'phase_completion_analysis',
      modelKey: 'unified-rotation',
      status: 'ok',
      attempts: 1,
      durationMs: 0,
    });

    const result: CallResult = await callAI('phase_completion_analysis', {
      systemPrompt: buildPhaseAnalysisPrompt(
        phase,
        requirements,
        conversationText,
        complexity
      ),
      userPrompt: 'Analyze the conversation above and determine phase completion.',
      plan: 'FREE',
      maxTokens: 800,
    });

    if (result.status !== 'ok') {
      logEvent('error', {
        event: 'ai_outcome',
        task: 'phase_completion_analysis',
        modelKey: 'unified-rotation',
        status: result.status,
        attempts: 1,
        durationMs: Date.now() - startTime,
      });

      // Conservative fallback: assume incomplete
      return {
        isComplete: false,
        coverage: 50,
        confidenceScore: 50,
        missingItems: requirements,
        shouldAdvance: false,
        suggestedQuestion: `Let's continue with ${phase}. ${requirements[0]}`,
      };
    }

    const analysis = JSON.parse(result.text) as Omit<CompletionAnalysis, 'nextPhase'>;

    // Determine next phase if should advance
    const fullAnalysis: CompletionAnalysis = {
      ...analysis,
      isComplete: analysis.coverage >= 100,
    };

    if (analysis.shouldAdvance) {
      fullAnalysis.nextPhase = determineNextPhase(phase, complexity);
    }

    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      component: 'ai.phase-detector',
      event: 'phase_completion_analysis',
      phase,
      coverage: analysis.coverage,
      confidenceScore: analysis.confidenceScore,
      shouldAdvance: analysis.shouldAdvance,
      durationMs: Date.now() - startTime,
    }));

    return fullAnalysis;
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      component: 'ai.phase-detector',
      event: 'phase_completion_analysis_error',
      error: error instanceof Error ? error.message : 'Unknown error',
      phase,
      durationMs: Date.now() - startTime,
    }));

    // Conservative fallback
    return {
      isComplete: false,
      coverage: 50,
      confidenceScore: 50,
      missingItems: PHASE_REQUIREMENTS[phase] || [],
      shouldAdvance: false,
      suggestedQuestion: `Let's continue discussing ${phase}.`,
    };
  }
}

/**
 * Determines the next phase based on current phase and project complexity.
 * Skips phases not required for the project's complexity level.
 */
export function determineNextPhase(
  currentPhase: PhaseId,
  complexity: ProjectComplexity
): PhaseId | undefined {
  const allPhases: PhaseId[] = [
    'problem',
    'users',
    'flows',
    'scope',
    'research',
    'technical',
    'features',
    'architecture',
  ];

  const requiredPhasesByComplexity: Record<ProjectComplexity, PhaseId[]> = {
    SIMPLE: ['problem', 'flows', 'scope'],
    STANDARD: ['problem', 'users', 'flows', 'scope', 'technical', 'features'],
    COMPLEX: allPhases,
  };

  const requiredPhases = requiredPhasesByComplexity[complexity];
  const currentIndex = requiredPhases.indexOf(currentPhase);

  if (currentIndex === -1 || currentIndex >= requiredPhases.length - 1) {
    return undefined; // Discovery complete
  }

  return requiredPhases[currentIndex + 1];
}

/**
 * Gets human-readable label for a phase ID.
 */
export function getPhaseLabel(phase: PhaseId): string {
  const labels: Record<PhaseId, string> = {
    problem: 'Problem & Goals',
    users: 'Users & Personas',
    flows: 'User Flows',
    scope: 'Scope & Constraints',
    research: 'Research & Integrations',
    technical: 'Technical Requirements',
    features: 'Feature Prioritization',
    architecture: 'Architecture Design',
  };
  return labels[phase] || phase;
}

/**
 * Gets the introductory question for a phase.
 */
export function getPhaseIntroQuestion(phase: PhaseId): string {
  const questions: Record<PhaseId, string> = {
    problem:
      'What core problem are you solving, and who experiences this problem?',
    users:
      'Who are the primary users of this system? What are their roles and goals?',
    flows:
      'Walk me through the main user flow. What key actions will users take?',
    scope:
      'What features are must-haves vs. nice-to-haves? Any explicit out-of-scope items?',
    research:
      'What external services, APIs, or integrations will this system need?',
    technical:
      'Any specific technology preferences, performance targets, or security requirements?',
    features:
      'Let\'s prioritize the feature list. What\'s in MVP vs. future phases?',
    architecture:
      'How should the system be architected? Any specific component boundaries or patterns?',
  };
  return questions[phase] || `Let's discuss ${phase}.`;
}
