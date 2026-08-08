# Feature 66 - AI Model Selection & Context Management Per Phase

## Type

ENHANCEMENT

## What This Delivers

Implements intelligent AI model selection based on discovery phase, task type, and user subscription tier. Routes long-context synthesis to Gemini Pro, fast clarifications to Groq, critique to DeepSeek R1, and technical writing to DeepSeek V3. Manages context windows per model, implements automatic context compression when approaching limits, and ensures seamless fallback chains. After this feature, each discovery phase uses the optimal model for its task while respecting token limits and user tier restrictions.

## Dependencies

- Feature 65 (Discovery Phase State Machine) - provides phase context
- Feature 64 (Discovery Chat State & Logic) - provides message history
- Feature 05 (AI Rotation Engine) - base rotation infrastructure
- Feature 10 (Discovery Chat) - chat interface

## Context To Read First

- `context/architecture-context.md`
- `context/ai-workflow-rules.md`
- `research/FOUNDRIE_RESEARCH.md` (Section 7: The AI Firm and Multi-Model Rotation)
- `context/code-standards.md`

## Context7 Docs To Check

```bash
npx ctx7 library "anthropic" "claude context windows and token limits"
npx ctx7 library "google-ai" "gemini token counting"
```

## Files Owned

- `lib/ai/phase-model-router.ts` (NEW)
- `lib/ai/context-manager.ts` (NEW)
- `lib/ai/context-compressor.ts` (NEW)
- `app/api/ai/route-model/route.ts` (NEW)

## Files

CREATE: `lib/ai/phase-model-router.ts` - phase-aware model selection
CREATE: `lib/ai/context-manager.ts` - context window tracking and management
CREATE: `lib/ai/context-compressor.ts` - semantic compression when approaching limits
CREATE: `app/api/ai/route-model/route.ts` - model routing API
MODIFY: `lib/ai/rotation-engine.ts` - integrate phase-aware routing
MODIFY: `trigger/streaming-chat.ts` - use phase-aware model selection
MODIFY: `lib/ai/models/*.ts` - add token counting helpers
CREATE: `lib/ai/phase-model-router.test.ts` - test routing logic
CREATE: `lib/ai/context-manager.test.ts` - test context window management

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract, update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch.

### Phase-to-Model Mapping

```typescript
// lib/ai/phase-model-router.ts

export interface PhaseModelConfig {
  primaryModel: string;
  fallbackChain: string[];
  taskType: "synthesis" | "critique" | "writing" | "chat" | "code";
  contextWindow: number;
  streamingEnabled: boolean;
}

export const PHASE_MODEL_MAP: Record<DiscoveryPhase, PhaseModelConfig> = {
  PHASE_1_PROBLEM_USERS: {
    primaryModel: "gemini-2.5-pro",
    fallbackChain: ["claude-sonnet-4", "deepseek-v3"],
    taskType: "synthesis",
    contextWindow: 1_000_000,
    streamingEnabled: true,
  },
  PHASE_2_CORE_FLOWS: {
    primaryModel: "gemini-2.5-pro",
    fallbackChain: ["claude-sonnet-4", "deepseek-v3"],
    taskType: "synthesis",
    contextWindow: 1_000_000,
    streamingEnabled: true,
  },
  PHASE_3_SCOPE_CONSTRAINTS: {
    primaryModel: "claude-sonnet-4",
    fallbackChain: ["gemini-2.5-pro", "deepseek-r1"],
    taskType: "critique",
    contextWindow: 200_000,
    streamingEnabled: true,
  },
  PHASE_4_TECHNICAL_DIRECTION: {
    primaryModel: "deepseek-r1",
    fallbackChain: ["claude-sonnet-4", "gemini-pro"],
    taskType: "critique",
    contextWindow: 64_000,
    streamingEnabled: false,
  },
  PHASE_5_FEATURE_SEQUENCE: {
    primaryModel: "qwen-coder",
    fallbackChain: ["deepseek-v3", "gemini-2.5-flash"],
    taskType: "code",
    contextWindow: 32_000,
    streamingEnabled: true,
  },
  PHASE_6_ARCHITECTURE_DIAGRAMS: {
    primaryModel: "gemini-2.5-pro",
    fallbackChain: ["claude-sonnet-4", "deepseek-v3"],
    taskType: "synthesis",
    contextWindow: 1_000_000,
    streamingEnabled: false,
  },
  PHASE_7_FEATURE_SPECS: {
    primaryModel: "deepseek-v3",
    fallbackChain: ["gemini-2.5-flash", "claude-sonnet-4"],
    taskType: "writing",
    contextWindow: 64_000,
    streamingEnabled: false,
  },
  PHASE_8_ZIP_ASSEMBLY: {
    primaryModel: "groq-llama",
    fallbackChain: ["gemini-2.5-flash"],
    taskType: "chat",
    contextWindow: 8_000,
    streamingEnabled: true,
  },
};

export interface ModelSelectionContext {
  phase: DiscoveryPhase;
  userTier: "FREE" | "PRO" | "TEAM" | "ENTERPRISE";
  messageCount: number;
  conversationTokens: number;
  taskType?: string;
}

export async function selectModelForPhase(
  context: ModelSelectionContext
): Promise<{ model: string; maxTokens: number; useStreaming: boolean }> {
  const phaseConfig = PHASE_MODEL_MAP[context.phase];

  // Tier-aware model override
  let selectedModel = phaseConfig.primaryModel;
  
  if (context.userTier === "FREE") {
    // Free users get DeepSeek R1 for all phases
    selectedModel = "deepseek-r1";
  } else if (context.userTier === "PRO" || context.userTier === "TEAM") {
    // Pro/Team users get primary model as configured
    selectedModel = phaseConfig.primaryModel;
  } else if (context.userTier === "ENTERPRISE") {
    // Enterprise always gets Claude Sonnet 4 if available
    if (phaseConfig.primaryModel !== "gemini-2.5-pro") {
      selectedModel = "claude-sonnet-4";
    }
  }

  // Check if selected model is available
  const isAvailable = await checkModelAvailability(selectedModel);
  
  if (!isAvailable) {
    // Walk fallback chain
    for (const fallback of phaseConfig.fallbackChain) {
      const fallbackAvailable = await checkModelAvailability(fallback);
      if (fallbackAvailable) {
        selectedModel = fallback;
        break;
      }
    }
  }

  return {
    model: selectedModel,
    maxTokens: phaseConfig.contextWindow,
    useStreaming: phaseConfig.streamingEnabled,
  };
}
```

### Context Window Management

```typescript
// lib/ai/context-manager.ts

export interface ContextMetrics {
  totalTokens: number;
  maxTokens: number;
  utilizationPercent: number;
  needsCompression: boolean;
  compressionTarget?: number;
}

export async function trackContextUsage(
  sessionId: string,
  messages: any[]
): Promise<ContextMetrics> {
  const session = await db.discoverySession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  const phaseConfig = PHASE_MODEL_MAP[session.currentPhase];
  const totalTokens = await estimateTokenCount(messages, phaseConfig.primaryModel);

  const utilizationPercent = (totalTokens / phaseConfig.contextWindow) * 100;
  const needsCompression = utilizationPercent >= 70;

  let compressionTarget: number | undefined;
  if (needsCompression) {
    // Target 50% of context window after compression
    compressionTarget = Math.floor(phaseConfig.contextWindow * 0.5);
  }

  return {
    totalTokens,
    maxTokens: phaseConfig.contextWindow,
    utilizationPercent,
    needsCompression,
    compressionTarget,
  };
}

async function estimateTokenCount(messages: any[], model: string): Promise<number> {
  // Use model-specific token counting
  if (model.startsWith("gemini")) {
    return await countGeminiTokens(messages);
  } else if (model.startsWith("claude")) {
    return await countClaudeTokens(messages);
  } else if (model.startsWith("deepseek")) {
    return await countDeepSeekTokens(messages);
  } else {
    // Fallback: rough estimate (4 chars per token)
    const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    return Math.ceil(totalChars / 4);
  }
}

async function countGeminiTokens(messages: any[]): Promise<number> {
  // Use Gemini's countTokens API
  const prompt = messages.map((m) => `${m.role}: ${m.content}`).join("\n\n");
  
  // Call Gemini API for accurate count
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:countTokens", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY!,
    },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });

  const data = await response.json();
  return data.totalTokens || 0;
}

async function countClaudeTokens(messages: any[]): Promise<number> {
  // Claude uses tiktoken for Claude 3+ models
  // Fallback estimate: 4 chars per token
  const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
  return Math.ceil(totalChars / 4);
}

async function countDeepSeekTokens(messages: any[]): Promise<number> {
  // DeepSeek uses standard tokenizer
  // Fallback estimate: 4 chars per token
  const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
  return Math.ceil(totalChars / 4);
}
```

### Context Compression

```typescript
// lib/ai/context-compressor.ts

export interface CompressionResult {
  compressedMessages: any[];
  originalTokens: number;
  compressedTokens: number;
  compressionRatio: number;
}

export async function compressConversationContext(
  messages: any[],
  targetTokens: number,
  preserveRecent: number = 5
): Promise<CompressionResult> {
  const originalTokens = await estimateTokenCount(messages, "gemini-2.5-pro");

  if (originalTokens <= targetTokens) {
    return {
      compressedMessages: messages,
      originalTokens,
      compressedTokens: originalTokens,
      compressionRatio: 1.0,
    };
  }

  // Strategy: Keep recent messages verbatim, summarize older messages
  const recentMessages = messages.slice(-preserveRecent);
  const oldMessages = messages.slice(0, -preserveRecent);

  // Summarize old messages using AI
  const summary = await summarizeMessages(oldMessages);

  const compressedMessages = [
    {
      role: "system",
      content: `Previous conversation summary:\n\n${summary}`,
    },
    ...recentMessages,
  ];

  const compressedTokens = await estimateTokenCount(compressedMessages, "gemini-2.5-pro");

  return {
    compressedMessages,
    originalTokens,
    compressedTokens,
    compressionRatio: compressedTokens / originalTokens,
  };
}

async function summarizeMessages(messages: any[]): Promise<string> {
  const prompt = `Summarize this conversation history, preserving all key decisions, requirements, and constraints:

${messages.map((m) => `${m.role}: ${m.content}`).join("\n\n")}

Provide a structured summary that includes:
1. Key decisions made
2. Requirements identified
3. Constraints and limitations
4. Technical choices
5. User preferences

Keep the summary concise but comprehensive.`;

  const response = await callAI({
    prompt,
    model: "gemini-2.5-flash",
    maxTokens: 2000,
  });

  return response;
}
```

### Model Availability Check

```typescript
// lib/ai/phase-model-router.ts (continued)

async function checkModelAvailability(model: string): Promise<boolean> {
  // Check if model is currently rate-limited or unavailable
  const status = await db.modelStatus.findUnique({
    where: { modelId: model },
  });

  if (!status) {
    return true; // Assume available if not tracked
  }

  // Check if rate limit window has expired
  if (status.rateLimitedUntil && status.rateLimitedUntil > new Date()) {
    return false;
  }

  // Check if model is marked as down
  if (status.isDown) {
    return false;
  }

  return true;
}
```

## Out of Scope

- Model fine-tuning or custom models (future)
- Multi-turn reasoning visualization (future)
- Real-time model performance monitoring dashboard (future)
- Phase state machine logic (Feature 65)
- Discovery-to-requirements handoff (Feature 67)

## Future Modifications

- Feature 67 (Discovery-to-Requirements Handoff) - uses final compressed context
- Future features may add custom model preferences per user
- Future features may add real-time token usage tracking in UI

## Quality Gates

- Run `npm run sync:check` and ensure it passes
- Run `npm run security:all` and ensure it passes
- Run `npm run test` and ensure it passes
- Run `npm run build` and ensure it passes

## Acceptance Criteria

- [ ] Phase-to-model mapping defined for all 8 discovery phases
- [ ] Model selection respects user subscription tier (FREE → DeepSeek R1, PRO/TEAM → phase-specific, ENTERPRISE → Claude Sonnet 4)
- [ ] Primary model and fallback chain configured per phase
- [ ] Task type classification (synthesis, critique, writing, chat, code) per phase
- [ ] Context window limits enforced per model
- [ ] Streaming enabled/disabled based on phase requirements
- [ ] Model availability checked before selection
- [ ] Fallback chain traversed when primary unavailable
- [ ] Context usage tracked with token counts
- [ ] Token estimation uses model-specific counting (Gemini countTokens API, Claude tiktoken, fallback for others)
- [ ] Compression triggered at 70% context utilization
- [ ] Recent messages (last 5) preserved verbatim during compression
- [ ] Older messages semantically summarized using Gemini Flash
- [ ] Compression reduces token count to 50% of max window
- [ ] Compression ratio tracked and logged
- [ ] POST `/api/ai/route-model` returns selected model for given phase and tier
- [ ] Rotation engine integrates phase-aware routing
- [ ] Streaming chat uses phase-aware model selection
- [ ] Token counting tested for all supported models
- [ ] Compression tested with various message counts
- [ ] Fallback chain tested when primary unavailable
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at Feature 67
- [ ] All quality gates pass
- [ ] CodeRabbit review completed and all findings resolved (recommended quality gate)

## Setup Instructions

### Environment Variables Required

```bash
# Already configured from Feature 05
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=...
DEEPSEEK_API_KEY=...
GROQ_API_KEY=...
OPENROUTER_API_KEY=...
```

No new external accounts needed. This feature uses existing AI provider keys.

For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
