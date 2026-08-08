# Feature 65 - Discovery Phase State Machine

## Type

ENHANCEMENT

## What This Delivers

Implements the discovery phase state machine with project complexity classification (SIMPLE, STANDARD, COMPLEX), dynamic phase progression logic, and semantic completion detection. The system automatically determines when sufficient information has been gathered for each phase based on message content analysis and message count thresholds. After this feature, discovery chat adapts intelligently to project complexity and advances phases automatically when appropriate.

## Dependencies

- Feature 64 (Discovery Chat State & Logic) - provides messageCount tracking and isDone state
- Feature 10 (Discovery Chat) - base chat implementation
- Feature 05 (AI Rotation Engine) - AI orchestration

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `research/FOUNDRIE_RESEARCH.md` (Section 5: Discovery Protocol — 8 Phases)
- `research/FOUNDRIE_V15.0.0.md` (Dynamic phase completion)
- `context/code-standards.md`
- `context/ai-workflow-rules.md`

## Context7 Docs To Check

```bash
npx ctx7 library prisma "enums and model relations"
npx ctx7 library next.js "server actions and API routes"
```

## Files Owned

- `lib/discovery/phase-machine.ts` (NEW)
- `lib/discovery/complexity-classifier.ts` (NEW)
- `lib/discovery/semantic-analyzer.ts` (NEW)
- `app/api/discovery/[projectId]/phase/route.ts` (NEW)
- `app/api/discovery/[projectId]/classify/route.ts` (NEW)

## Files

CREATE: `lib/discovery/phase-machine.ts` - phase state machine and transitions
CREATE: `lib/discovery/complexity-classifier.ts` - SIMPLE/STANDARD/COMPLEX classification
CREATE: `lib/discovery/semantic-analyzer.ts` - content analysis for completion detection
CREATE: `app/api/discovery/[projectId]/phase/route.ts` - GET current phase, POST advance phase
CREATE: `app/api/discovery/[projectId]/classify/route.ts` - POST classify project complexity
MODIFY: `prisma/schema.prisma` - add DiscoverySession model with phase tracking
MODIFY: `lib/conversations/store.ts` - integrate phase state with message storage
MODIFY: `trigger/streaming-chat.ts` - pass phase context to AI for adaptive questioning
CREATE: `lib/discovery/phase-machine.test.ts` - test phase transitions and completion detection
CREATE: `lib/discovery/complexity-classifier.test.ts` - test classification logic

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract, update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch.

### Database Schema Updates

```prisma
enum ProjectComplexity {
  SIMPLE      // Landing pages, portfolios, simple CRUD - 3-4 phases, 5-10 messages
  STANDARD    // SaaS apps, APIs - 6-7 phases, 15-25 messages
  COMPLEX     // Enterprise platforms, microservices - 8 phases, 30+ messages
}

enum DiscoveryPhase {
  PHASE_1_PROBLEM_USERS          // What problem, who uses it, success criteria
  PHASE_2_CORE_FLOWS             // Happy path, supporting workflows, CRUD operations
  PHASE_3_SCOPE_CONSTRAINTS      // Out of scope, timeline, team capability, design refs
  PHASE_4_TECHNICAL_DIRECTION    // Stack selection, deployment strategy, ADR
  PHASE_5_FEATURE_SEQUENCE       // Preliminary feature ordering
  PHASE_6_ARCHITECTURE_DIAGRAMS  // Full diagram suite generation and approval
  PHASE_7_FEATURE_SPECS          // DAG-driven spec generation from diagrams
  PHASE_8_ZIP_ASSEMBLY           // Package compilation and export
}

model DiscoverySession {
  id                String            @id @default(cuid())
  projectId         String            @unique
  userId            String
  
  // Phase state (Feature 65)
  currentPhase      DiscoveryPhase    @default(PHASE_1_PROBLEM_USERS)
  complexity        ProjectComplexity?
  phaseHistory      Json[]            @default([])  // Array of { phase, completedAt, messageCount }
  phaseContext      Json?                           // Accumulated context per phase
  
  // Session state (from Feature 64 context)
  state             SessionState      @default(STARTED)
  messages          Json[]            @default([])
  checkpointData    Json?
  
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  project           Project           @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@index([userId, currentPhase])
  @@index([complexity])
}

enum SessionState {
  STARTED
  IN_PROGRESS
  PAUSED
  COMPLETED
  ARCHIVED
}
```

### Phase State Machine

```typescript
// lib/discovery/phase-machine.ts

export interface PhaseRequirements {
  phase: DiscoveryPhase;
  minMessages: number;
  requiredTopics: string[];  // Topics that must be covered
  completionSignals: string[];  // Keywords/patterns indicating readiness
}

export const PHASE_REQUIREMENTS: Record<ProjectComplexity, PhaseRequirements[]> = {
  SIMPLE: [
    {
      phase: "PHASE_1_PROBLEM_USERS",
      minMessages: 2,
      requiredTopics: ["problem", "users", "success"],
      completionSignals: ["understand the problem", "target users defined"],
    },
    {
      phase: "PHASE_2_CORE_FLOWS",
      minMessages: 2,
      requiredTopics: ["workflow", "user actions"],
      completionSignals: ["core flow described", "main features identified"],
    },
    {
      phase: "PHASE_3_SCOPE_CONSTRAINTS",
      minMessages: 1,
      requiredTopics: ["scope", "timeline"],
      completionSignals: ["scope defined", "constraints clear"],
    },
    // SIMPLE projects skip to Phase 6 (skip stack selection and preliminary sequencing)
  ],
  STANDARD: [
    // All 8 phases with moderate depth
    // ... (6-7 phases used, 15-25 messages total)
  ],
  COMPLEX: [
    // All 8 phases with maximum depth
    // ... (30+ messages total)
  ],
};

export async function canAdvancePhase(
  sessionId: string,
  currentPhase: DiscoveryPhase,
  messageCount: number,
  messages: any[]
): Promise<{ canAdvance: boolean; reason: string; confidence: number }> {
  const session = await db.discoverySession.findUnique({ where: { id: sessionId } });
  if (!session?.complexity) {
    return { canAdvance: false, reason: "Project not yet classified", confidence: 0 };
  }

  const requirements = PHASE_REQUIREMENTS[session.complexity].find(
    (req) => req.phase === currentPhase
  );

  if (!requirements) {
    return { canAdvance: false, reason: "Phase requirements not defined", confidence: 0 };
  }

  // Check minimum message count
  if (messageCount < requirements.minMessages) {
    return {
      canAdvance: false,
      reason: `Need at least ${requirements.minMessages} messages`,
      confidence: 0,
    };
  }

  // Semantic analysis: check if required topics are covered
  const topicCoverage = await analyzeTopicCoverage(messages, requirements.requiredTopics);
  
  // Check for completion signals
  const completionScore = await detectCompletionSignals(
    messages,
    requirements.completionSignals
  );

  const confidence = (topicCoverage + completionScore) / 2;

  return {
    canAdvance: confidence >= 0.75,
    reason: confidence >= 0.75 
      ? "Phase requirements satisfied" 
      : "More information needed",
    confidence,
  };
}

export async function advancePhase(
  sessionId: string,
  force?: boolean
): Promise<{ success: boolean; newPhase: DiscoveryPhase | null; error?: string }> {
  const session = await db.discoverySession.findUnique({
    where: { id: sessionId },
    include: { project: true },
  });

  if (!session) {
    return { success: false, newPhase: null, error: "Session not found" };
  }

  const messages = await db.message.findMany({
    where: { conversationId: session.projectId },
    orderBy: { createdAt: "asc" },
  });

  const advanceCheck = await canAdvancePhase(
    sessionId,
    session.currentPhase,
    messages.length,
    messages
  );

  if (!force && !advanceCheck.canAdvance) {
    return {
      success: false,
      newPhase: null,
      error: `Cannot advance: ${advanceCheck.reason}`,
    };
  }

  const nextPhase = getNextPhase(session.currentPhase, session.complexity!);

  if (!nextPhase) {
    return { success: false, newPhase: null, error: "No next phase available" };
  }

  // Update session with new phase
  const updated = await db.discoverySession.update({
    where: { id: sessionId },
    data: {
      currentPhase: nextPhase,
      phaseHistory: {
        push: {
          phase: session.currentPhase,
          completedAt: new Date(),
          messageCount: messages.length,
        },
      },
    },
  });

  return { success: true, newPhase: nextPhase };
}

function getNextPhase(
  current: DiscoveryPhase,
  complexity: ProjectComplexity
): DiscoveryPhase | null {
  const phases = Object.values(DiscoveryPhase);
  const currentIndex = phases.indexOf(current);
  
  // SIMPLE projects skip Phase 4 and 5
  if (complexity === "SIMPLE" && current === "PHASE_3_SCOPE_CONSTRAINTS") {
    return "PHASE_6_ARCHITECTURE_DIAGRAMS";
  }

  if (currentIndex === -1 || currentIndex === phases.length - 1) {
    return null;
  }

  return phases[currentIndex + 1];
}
```

### Complexity Classifier

```typescript
// lib/discovery/complexity-classifier.ts

export interface ComplexitySignals {
  hasMultipleUserTypes: boolean;
  hasExternalIntegrations: boolean;
  hasRealTimeFeatures: boolean;
  hasComplexWorkflows: boolean;
  hasMultipleSystems: boolean;
  estimatedEndpoints: number;
  estimatedModels: number;
}

export async function classifyProjectComplexity(
  projectDescription: string,
  messages: any[]
): Promise<{ complexity: ProjectComplexity; confidence: number; signals: ComplexitySignals }> {
  // Use AI to extract complexity signals from description and conversation
  const signals = await extractComplexitySignals(projectDescription, messages);

  let score = 0;

  // Scoring algorithm
  if (signals.hasMultipleUserTypes) score += 10;
  if (signals.hasExternalIntegrations) score += 15;
  if (signals.hasRealTimeFeatures) score += 10;
  if (signals.hasComplexWorkflows) score += 10;
  if (signals.hasMultipleSystems) score += 20;
  score += Math.min(signals.estimatedEndpoints, 20);
  score += Math.min(signals.estimatedModels * 2, 15);

  let complexity: ProjectComplexity;
  if (score <= 20) complexity = "SIMPLE";
  else if (score <= 50) complexity = "STANDARD";
  else complexity = "COMPLEX";

  const confidence = Math.min(score / 100, 0.95);

  return { complexity, confidence, signals };
}

async function extractComplexitySignals(
  description: string,
  messages: any[]
): Promise<ComplexitySignals> {
  // Use AI model to analyze text and extract signals
  const prompt = `Analyze this project description and conversation to identify complexity signals:

Project: ${description}

Recent messages:
${messages.slice(-5).map((m) => `- ${m.content}`).join("\n")}

Return JSON with:
- hasMultipleUserTypes (boolean)
- hasExternalIntegrations (boolean)
- hasRealTimeFeatures (boolean)
- hasComplexWorkflows (boolean)
- hasMultipleSystems (boolean)
- estimatedEndpoints (number)
- estimatedModels (number)`;

  const response = await callAI({
    prompt,
    model: "gemini-2.5-flash",
    responseFormat: "json",
  });

  return JSON.parse(response);
}
```

### Semantic Analyzer

```typescript
// lib/discovery/semantic-analyzer.ts

export async function analyzeTopicCoverage(
  messages: any[],
  requiredTopics: string[]
): Promise<number> {
  // Use AI to determine if required topics are covered
  const recentMessages = messages.slice(-10);
  
  const prompt = `Analyze these conversation messages and determine coverage of required topics.

Required topics: ${requiredTopics.join(", ")}

Messages:
${recentMessages.map((m) => `${m.role}: ${m.content}`).join("\n\n")}

For each required topic, determine if it has been adequately discussed (0-1 score).
Return JSON: { topicScores: { [topic: string]: number }, overallCoverage: number }`;

  const response = await callAI({
    prompt,
    model: "gemini-2.5-flash",
    responseFormat: "json",
  });

  const result = JSON.parse(response);
  return result.overallCoverage;
}

export async function detectCompletionSignals(
  messages: any[],
  completionSignals: string[]
): Promise<number> {
  // Check for explicit completion signals in messages
  const recentMessages = messages.slice(-5);
  
  let signalCount = 0;
  for (const signal of completionSignals) {
    const found = recentMessages.some((msg) =>
      msg.content.toLowerCase().includes(signal.toLowerCase())
    );
    if (found) signalCount++;
  }

  return signalCount / completionSignals.length;
}
```

### API Routes

```typescript
// app/api/discovery/[projectId]/phase/route.ts

// GET - Get current phase and advancement status
export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  const { userId } = await currentUser();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const session = await db.discoverySession.findUnique({
    where: { projectId: params.projectId },
    include: { project: true },
  });

  if (!session || session.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const messages = await db.message.findMany({
    where: { conversationId: params.projectId },
  });

  const advanceCheck = await canAdvancePhase(
    session.id,
    session.currentPhase,
    messages.length,
    messages
  );

  return NextResponse.json({
    currentPhase: session.currentPhase,
    complexity: session.complexity,
    phaseHistory: session.phaseHistory,
    canAdvance: advanceCheck.canAdvance,
    advanceReason: advanceCheck.reason,
    confidence: advanceCheck.confidence,
  });
}

// POST - Advance to next phase
export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  const { userId } = await currentUser();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { force } = await req.json();

  const session = await db.discoverySession.findUnique({
    where: { projectId: params.projectId },
  });

  if (!session || session.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = await advancePhase(session.id, force);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    newPhase: result.newPhase,
  });
}
```

## Out of Scope

- AI model selection logic (Feature 66)
- Requirements generation (Feature 11)
- Diagram generation (Features in Phase 6 block)
- Discovery chat UI (Feature 10, 63, 64)

## Future Modifications

- Feature 66 (AI Model Selection Per Phase) - uses phase context to route models
- Feature 67 (Discovery-to-Requirements Handoff) - reads final phase state
- Features 11+ - consume phase-structured discovery output

## Quality Gates

- Run `npm run sync:check` and ensure it passes
- Run `npm run security:all` and ensure it passes
- Run `npm run test` and ensure it passes
- Run `npm run build` and ensure it passes

## Acceptance Criteria

- [ ] DiscoverySession model includes currentPhase, complexity, phaseHistory, phaseContext fields
- [ ] ProjectComplexity enum includes SIMPLE, STANDARD, COMPLEX
- [ ] DiscoveryPhase enum includes all 8 phases
- [ ] Complexity classifier analyzes project description and conversation
- [ ] SIMPLE projects use 3-4 phases with 5-10 message threshold
- [ ] STANDARD projects use 6-7 phases with 15-25 message threshold
- [ ] COMPLEX projects use all 8 phases with 30+ message threshold
- [ ] Phase requirements defined for each complexity level
- [ ] canAdvancePhase checks message count and semantic completion
- [ ] Semantic analyzer detects topic coverage using AI
- [ ] Completion signals detected in recent messages
- [ ] advancePhase transitions to next phase when requirements met
- [ ] SIMPLE projects skip Phase 4 and 5 (jump from 3 to 6)
- [ ] Phase history tracks completion timestamps and message counts
- [ ] GET `/api/discovery/[projectId]/phase` returns current phase and advancement status
- [ ] POST `/api/discovery/[projectId]/phase` advances phase with optional force parameter
- [ ] POST `/api/discovery/[projectId]/classify` classifies project complexity
- [ ] Force flag bypasses semantic checks for manual override
- [ ] Phase context accumulates key information from each phase
- [ ] Phase transitions are tested for all complexity levels
- [ ] Complexity classification is tested with edge cases
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at Feature 66
- [ ] All quality gates pass
- [ ] CodeRabbit review completed and all findings resolved (recommended quality gate)

## Setup Instructions

No new external accounts or API keys required. This feature extends existing Prisma schema and discovery logic.

After implementing schema changes:
```bash
npm run db:generate
npm run db:migrate
```

For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
