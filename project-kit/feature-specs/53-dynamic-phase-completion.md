# Feature 53 - Dynamic Phase Completion Detection

## Type

ENHANCEMENT

## What This Delivers

Intelligent phase completion detection that analyzes message content, user intent, and project complexity to automatically advance through discovery phases when sufficient information has been gathered. Replaces the rigid "one question at a time" pattern with adaptive conversation flow that scales from simple landing pages (2-3 messages) to complex systems (20+ messages). The AI detects when a phase is complete based on semantic analysis of requirements coverage, not arbitrary message counts.

## Dependencies

- Feature 10 (Discovery Chat) provides the conversation infrastructure
- Feature 11 (Requirements Generation) depends on discovery completion
- Feature 5 (AI Rotation Engine) powers the semantic analysis

## Context To Read First

- `context/project-overview.md` — The 8-phase discovery protocol
- `context/architecture-context.md` — AI orchestration and model routing
- `context/ai-workflow-rules.md` — How agents work and split tasks
- `research/FOUNDRIE_V15.0.0.md` — This version's discovery improvements

## Context7 Docs To Check

None required — this is internal conversation logic.

## Agent Skills To Use

- `.agents/skills/next-best-practices/SKILL.md`
- `.agents/skills/context7-cli/SKILL.md` when checking updated library patterns

## Files Owned

### New Files
- `lib/ai/phase-detector.ts`
- `lib/ai/phase-detector.test.ts`
- `lib/ai/complexity-classifier.ts`
- `lib/ai/complexity-classifier.test.ts`

### Modified Files
- `app/api/conversations/route.ts` — Add phase detection logic
- `lib/conversations/chat.ts` — Integrate completion detection
- `prisma/schema.prisma` — Add phase completion metadata fields

---

## Problem

Current Foundrie uses a rigid 8-phase discovery where the AI asks exactly one question, waits for response, analyzes, then asks the next question. This works for complex systems but wastes time on simple projects. A landing page only needs Problem, Core Flows, and Scope — yet the user sits through Research Phase, Architecture, Feature Sequence, and Diagramming discussions that add no value.

The AI also doesn't know when a phase is "complete." It asks generic follow-ups even after the user has provided comprehensive answers. There's no semantic analysis of coverage — just blind question progression.

## Solution

**Project Complexity Classification** — On project creation, analyze the initial description and classify as:
- **Simple** (landing page, portfolio, blog, single-feature tool) — 3-4 phases, 5-10 messages
- **Standard** (SaaS app, marketplace, dashboard) — 6-7 phases, 15-25 messages  
- **Complex** (multi-tenant platform, enterprise system, AI-heavy) — Full 8 phases, 30+ messages

**Semantic Phase Completion** — After each user message, run a lightweight semantic analysis:
- Extract intent and entities from the message
- Check coverage against phase requirements (problem statement complete? users defined? flows mapped?)
- If requirements met → auto-advance to next relevant phase
- If gaps remain → ask targeted follow-up

**Adaptive Question Strategy**:
- Simple projects: Ask broad questions ("Describe your pages and main user actions")
- Complex projects: Ask focused, granular questions ("What happens when payment fails during checkout?")

**Explicit Continuation Prompts** — If phase looks complete but AI isn't certain, show:
> "I have enough information about [Phase Name]. Ready to move to [Next Phase], or is there anything else about [current phase] you want to cover?"

User can either continue or confirm completion.

---

## Technical Design

### 1. Complexity Classifier

```typescript
// lib/ai/complexity-classifier.ts

export type ProjectComplexity = 'simple' | 'standard' | 'complex';

export interface ComplexityAnalysis {
  complexity: ProjectComplexity;
  reasoning: string;
  estimatedPhases: number;
  estimatedMessages: number;
  requiredPhases: PhaseId[];
}

export async function classifyProjectComplexity(
  description: string
): Promise<ComplexityAnalysis> {
  const prompt = `Analyze this project description and classify its complexity.

Project: ${description}

Return JSON:
{
  "complexity": "simple" | "standard" | "complex",
  "reasoning": "why this classification",
  "estimatedPhases": number,
  "estimatedMessages": number,
  "requiredPhases": ["problem", "flows", "scope", ...]
}

Classification rules:
- **Simple**: Landing page, portfolio, blog, single CRUD app, static site, simple tool
  → 3-4 phases, 5-10 messages, skip Research/Architecture/Feature Sequence
- **Standard**: SaaS dashboard, marketplace, social app, booking system
  → 6-7 phases, 15-25 messages, skip Research if no external integrations
- **Complex**: Multi-tenant platform, enterprise system, heavy AI/ML, blockchain, real-time collaboration
  → All 8 phases, 30+ messages

Required phases by complexity:
Simple: [problem, flows, scope, diagrams]
Standard: [problem, flows, scope, technical, features, diagrams]
Complex: [problem, flows, scope, research, technical, features, architecture, diagrams]`;

  const response = await callAI({
    model: 'gemini-2.5-pro', // Principal Engineer for planning
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  });

  return JSON.parse(response);
}
```

### 2. Phase Completion Detector

```typescript
// lib/ai/phase-detector.ts

export interface PhaseRequirements {
  problem: string[];
  users: string[];
  flows: string[];
  scope: string[];
  research: string[];
  technical: string[];
  features: string[];
  architecture: string[];
}

export interface CompletionAnalysis {
  isComplete: boolean;
  coverage: number; // 0-100%
  missingItems: string[];
  shouldAdvance: boolean;
  nextPhase?: PhaseId;
  suggestedQuestion?: string;
}

const PHASE_REQUIREMENTS: Record<PhaseId, string[]> = {
  problem: [
    'core problem statement',
    'target users identified',
    'current solution or pain point',
    'success criteria defined'
  ],
  flows: [
    'primary user flow mapped',
    'key actions identified',
    'CRUD operations outlined',
    'authentication needs specified'
  ],
  scope: [
    'out-of-scope features listed',
    'timeline or constraints mentioned',
    'team capability noted',
    'design references provided (optional)'
  ],
  // ... other phases
};

export async function analyzePhaseCompletion(
  phase: PhaseId,
  conversation: Message[],
  complexity: ProjectComplexity
): Promise<CompletionAnalysis> {
  const requirements = PHASE_REQUIREMENTS[phase];
  const conversationText = conversation.map(m => m.content).join('\n');

  const prompt = `Analyze if this discovery phase is complete.

Current Phase: ${phase}
Requirements: ${requirements.join(', ')}
Conversation:
${conversationText}

Return JSON:
{
  "isComplete": boolean,
  "coverage": number (0-100),
  "missingItems": string[],
  "shouldAdvance": boolean,
  "suggestedQuestion": "string or null"
}

Rules:
- 100% coverage → isComplete = true
- ≥80% coverage + complexity="simple" → shouldAdvance = true
- ≥90% coverage + complexity="standard" → shouldAdvance = true  
- <80% → suggest targeted question for missing items`;

  const response = await callAI({
    model: 'deepseek-r1', // Staff Reviewer for analysis
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  });

  const analysis = JSON.parse(response);

  // Determine next phase based on complexity
  if (analysis.shouldAdvance) {
    analysis.nextPhase = determineNextPhase(phase, complexity);
  }

  return analysis;
}

function determineNextPhase(
  current: PhaseId,
  complexity: ProjectComplexity
): PhaseId | undefined {
  const phaseOrder: PhaseId[] = ['problem', 'users', 'flows', 'scope', 'research', 'technical', 'features', 'architecture'];
  
  const requiredPhases = getRequiredPhases(complexity);
  const currentIndex = phaseOrder.indexOf(current);
  
  // Find next required phase
  for (let i = currentIndex + 1; i < phaseOrder.length; i++) {
    if (requiredPhases.includes(phaseOrder[i])) {
      return phaseOrder[i];
    }
  }
  
  return undefined; // Discovery complete
}
```

### 3. Database Schema Changes

```prisma
model Project {
  // ... existing fields
  complexity          ProjectComplexity @default(STANDARD)
  estimatedPhases     Int               @default(8)
  estimatedMessages   Int               @default(20)
  requiredPhases      String[]          // JSON array of phase IDs
  phaseCompletions    Json?             // Track coverage per phase
}

enum ProjectComplexity {
  SIMPLE
  STANDARD
  COMPLEX
}

model Conversation {
  // ... existing fields
  phaseCompletionData Json?   // Store completion analysis per phase
  autoAdvanced        Boolean @default(false) // Track if phase auto-advanced
}
```

### 4. Integration with Conversation Route

```typescript
// app/api/conversations/route.ts

export async function POST(req: NextRequest) {
  const { projectId, content } = await req.json();
  
  // Get project complexity
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { complexity: true, requiredPhases: true, currentPhase: true }
  });

  // Save user message
  await db.conversationMessage.create({
    data: {
      projectId,
      role: 'user',
      content,
      phaseId: project.currentPhase
    }
  });

  // Analyze phase completion
  const conversation = await db.conversationMessage.findMany({
    where: { projectId, phaseId: project.currentPhase },
    orderBy: { createdAt: 'asc' }
  });

  const completion = await analyzePhaseCompletion(
    project.currentPhase,
    conversation,
    project.complexity
  );

  // Update project phase completion metadata
  await db.project.update({
    where: { id: projectId },
    data: {
      phaseCompletions: {
        ...project.phaseCompletions,
        [project.currentPhase]: completion
      }
    }
  });

  // Generate AI response
  let aiResponse: string;
  
  if (completion.shouldAdvance && completion.nextPhase) {
    // Auto-advance
    await db.project.update({
      where: { id: projectId },
      data: { currentPhase: completion.nextPhase }
    });

    aiResponse = `Great! I have what I need for ${getPhaseLabel(project.currentPhase)}.

Moving to: **${getPhaseLabel(completion.nextPhase)}**

${getPhaseIntroQuestion(completion.nextPhase)}`;

    await db.conversationMessage.create({
      data: {
        projectId,
        role: 'assistant',
        content: aiResponse,
        phaseId: completion.nextPhase,
        metadata: { autoAdvanced: true }
      }
    });

  } else if (completion.isComplete && !completion.nextPhase) {
    // Discovery complete
    aiResponse = `Perfect! Discovery is complete. I now have everything needed to build your architecture and diagrams.

Ready to proceed to Architecture & Diagramming?`;

  } else if (completion.suggestedQuestion) {
    // Ask follow-up
    aiResponse = completion.suggestedQuestion;

  } else {
    // Standard next question
    aiResponse = await generateNextQuestion(project.currentPhase, conversation);
  }

  return NextResponse.json({ message: aiResponse, completion });
}
```

---

## User Experience Flow

### Simple Project Example (Landing Page)

**User:** "Build a landing page for my freelance design studio. Hero, portfolio grid, contact form."

**AI analyzes** → Complexity: SIMPLE, Required: [problem, flows, scope]

**AI:** "Got it — a freelance design studio landing page. Three quick questions:
1. What's the main action you want visitors to take? (hire you, view portfolio, download resume?)
2. How many portfolio projects will you showcase?
3. Do you have existing branding/design files, or should I generate a design system?"

**User:** "Main action is contact me. 6-8 projects. I have a logo and color palette."

**AI analyzes** → Problem ✓ (100%), Flows ✓ (100%), Scope ✓ (80%)

**AI:** "Perfect. Just to confirm — any features explicitly out of scope? (e.g., blog, case study pages, client login, CMS)"

**User:** "No blog, no login. Just a static site."

**AI analyzes** → Scope ✓ (100%), auto-advances to diagrams

**AI:** "All set! Moving directly to diagramming. I'll generate:
- Site map diagram (3 pages)
- Component structure
- Design tokens

Ready to proceed?"

**Total: 4 messages. Discovery done.**

### Complex Project Example (Multi-Tenant SaaS)

**User:** "Multi-tenant SaaS for project management. Teams create workspaces, invite members, manage projects with Kanban boards."

**AI analyzes** → Complexity: COMPLEX, all 8 phases required

**AI:** "A multi-tenant project management platform — substantial scope. Let's start with the core problem.

What specific project management pain point does this solve that existing tools (Asana, Linear, Monday.com) don't address?"

**User provides detailed answer**

**AI analyzes** → Problem ✓ (60%), continues with targeted follow-up

**AI:** "And who are the primary users? Individual freelancers, agency teams, enterprise departments?"

**... continues through all 8 phases with granular questions ...**

**Total: 35 messages. Discovery thorough and complete.**

---

## Acceptance Criteria

1. ✅ On project creation, `classifyProjectComplexity()` runs and sets `complexity`, `estimatedPhases`, `requiredPhases`
2. ✅ After each user message, `analyzePhaseCompletion()` evaluates coverage against requirements
3. ✅ If `shouldAdvance === true`, project auto-advances to `nextPhase` and AI announces transition
4. ✅ If phase complete but uncertain, AI asks: "Ready to move to [next], or more to cover?"
5. ✅ Simple projects complete discovery in 5-10 messages (measured in tests)
6. ✅ Complex projects get granular questions and hit 30+ messages before completion
7. ✅ Phase completion data stored in `project.phaseCompletions` for audit trail
8. ✅ UI shows progress: "Phase 2/4 complete" for simple, "Phase 5/8 complete" for complex

---

## Out of Scope

- User override to manually advance phases (future: Feature 65)
- Phase regression (going backward if user realizes something was missed) — agent can still ask clarifying questions
- Customizing phase order beyond complexity presets
- Machine learning model for completion detection (using prompt-based LLM analysis)

---

## Future Modifications

When Feature 65 (Manual Phase Control) ships:
- Add UI button: "Skip to Next Phase"
- Add "Go Back to [Previous Phase]" option
- Store manual overrides in audit log

When Feature 66 (Discovery Templates) ships:
- Pre-fill phase requirements based on project template (e.g., "E-commerce" template knows it needs payment integration discussion)

---

## Testing Strategy

```typescript
// lib/ai/complexity-classifier.test.ts

describe('classifyProjectComplexity', () => {
  it('classifies landing page as SIMPLE', async () => {
    const result = await classifyProjectComplexity(
      'A portfolio site with hero, projects grid, and contact form'
    );
    expect(result.complexity).toBe('simple');
    expect(result.estimatedMessages).toBeLessThan(15);
    expect(result.requiredPhases).toEqual(['problem', 'flows', 'scope']);
  });

  it('classifies SaaS dashboard as STANDARD', async () => {
    const result = await classifyProjectComplexity(
      'Task management SaaS with user auth, project boards, and team collaboration'
    );
    expect(result.complexity).toBe('standard');
    expect(result.estimatedMessages).toBeGreaterThan(10);
    expect(result.requiredPhases).not.toContain('research'); // Unless external APIs mentioned
  });

  it('classifies enterprise platform as COMPLEX', async () => {
    const result = await classifyProjectComplexity(
      'Multi-tenant B2B platform with SSO, RBAC, real-time collaboration, and AI-powered analytics'
    );
    expect(result.complexity).toBe('complex');
    expect(result.estimatedMessages).toBeGreaterThan(25);
    expect(result.requiredPhases).toHaveLength(8);
  });
});

describe('analyzePhaseCompletion', () => {
  it('detects complete problem phase', async () => {
    const conversation = [
      { role: 'assistant', content: 'What problem does this solve?' },
      { role: 'user', content: 'Freelancers struggle to find consistent clients. We connect them with vetted businesses.' },
      { role: 'assistant', content: 'Who are your target users?' },
      { role: 'user', content: 'Freelance designers and developers, and small businesses needing contractors.' }
    ];

    const result = await analyzePhaseCompletion('problem', conversation, 'simple');
    
    expect(result.coverage).toBeGreaterThan(80);
    expect(result.shouldAdvance).toBe(true);
  });

  it('detects incomplete scope phase', async () => {
    const conversation = [
      { role: 'assistant', content: 'What's out of scope?' },
      { role: 'user', content: 'No mobile app for now.' }
    ];

    const result = await analyzePhaseCompletion('scope', conversation, 'standard');
    
    expect(result.isComplete).toBe(false);
    expect(result.missingItems).toContain('timeline or constraints');
    expect(result.suggestedQuestion).toContain('timeline');
  });
});
```

---

## Security Considerations

- Phase completion logic runs server-side only (no client manipulation)
- Complexity classification uses deterministic prompts to prevent gaming
- Phase completion data stored in project record for audit trail
- Rate limit complexity classification to 1 per project creation

---

## Performance Considerations

- Completion analysis lightweight (single LLM call ~500 tokens)
- Run async — don't block AI response generation
- Cache complexity classification result (never re-run)
- Phase completion stored in DB, not recalculated on every load
