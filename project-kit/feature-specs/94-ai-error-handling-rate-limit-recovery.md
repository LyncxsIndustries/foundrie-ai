# Feature 74: AI Error Handling & Rate Limit Recovery

**Status:** Not Started  
**Priority:** P0 (Blocking)  
**Dependencies:** Feature 55 (Research Media Management)  
**Assigned To:** AI Agent  
**Estimated Effort:** 5 days

---

## Problem Statement

### Current Issues

1. **Cryptic Error Messages:** Users see "AI generation failed" with no context
2. **No Rate Limit Recovery:** Both Kiro CLI and Foundrie hit API throttling with zero recovery
3. **Conversation State Loss:** Discovery chat messages lost on page refresh
4. **No Model Rotation Resilience:** If primary model fails, entire service fails

### Impact

- Development workflow blocked when Anthropic throttles Kiro CLI
- Users abandon discovery mid-session due to unclear errors
- Poor UX leads to low conversion rates

---

## Solution Overview

Implement comprehensive AI reliability layer:

1. **Typed Error Classification** - Distinguish rate limits from network errors
2. **Intelligent Retry with Backoff** - Exponential backoff for transient errors
3. **Multi-Model Fallback Cascade** - Claude → GPT-4 → DeepSeek
4. **Conversation State Persistence** - Save every message to database
5. **User-Friendly Error Messages** - Clear, actionable error text

---

## Technical Design

### 1. Error Type System

```typescript
// lib/ai/errors.ts
export type AIErrorType = 
  | "RATE_LIMIT"      // Provider throttled (429)
  | "MODEL_DOWN"      // Provider unavailable (503)
  | "NETWORK_ERROR"   // Connection timeout
  | "TIMEOUT"         // Response >30s
  | "INVALID_RESPONSE"// Malformed JSON
  | "CONTEXT_LENGTH"  // Input too long
  | "CONTENT_FILTER"  // Safety filter blocked
  | "AUTH_ERROR"      // API key invalid
  | "UNKNOWN";

export class AIError extends Error {
  constructor(
    public type: AIErrorType,
    public provider: string,
    public retryable: boolean,
    public userMessage: string,
    public technicalDetails: string,
    public retryAfterSeconds?: number
  ) {
    super(userMessage);
    this.name = "AIError";
  }
}
```

### 2. Discovery Session Persistence

```prisma
// prisma/schema.prisma (ADD THIS)
enum SessionState {
  STARTED
  IN_PROGRESS
  PAUSED
  COMPLETED
  ARCHIVED
}

model DiscoverySession {
  id                String       @id @default(cuid())
  projectId         String
  userId            String
  state             SessionState @default(STARTED)
  currentPhase      Int          @default(1)
  messages          Json[]       @default([])
  checkpointData    Json?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@unique([userId, projectId])
  @@index([state])
}
```

### 3. Enhanced Rotation Engine

```typescript
// lib/ai/rotation-engine.ts (ENHANCED)
export async function callAI(
  prompt: string,
  plan: UserPlan
): Promise<string> {
  const providers = getProvidersByPlan(plan); // Returns sorted by priority
  let lastError: AIError | null = null;

  for (const provider of providers) {
    try {
      // Retry with exponential backoff
      return await retryWithBackoff(
        async () => callProvider(provider, prompt),
        provider.name
      );
    } catch (error) {
      lastError = error as AIError;
      // Continue to next provider
    }
  }

  throw lastError; // All providers exhausted
}
```

---

## Acceptance Criteria

- [ ] AI calls retry 3x with exponential backoff (1s, 2s, 4s)
- [ ] Rate limit (429) triggers immediate fallback to secondary model
- [ ] User sees specific errors: "🕐 Retrying...", "🌐 Connection issue...", etc.
- [ ] Discovery session persists after every message
- [ ] Page refresh resumes conversation exactly where it left off
- [ ] Free tier: DeepSeek → GPT-4o-mini fallback
- [ ] Pro tier: Claude → GPT-4o → DeepSeek cascade
- [ ] All errors logged to monitoring with full context

---

## Files Owned

### New Files
- `lib/ai/errors.ts`
- `lib/ai/retry.ts`
- `app/api/discovery/[projectId]/session/route.ts`
- `hooks/use-discovery-chat.ts`

### Modified Files
- `lib/ai/rotation-engine.ts`
- `prisma/schema.prisma`
- `components/discovery-chat.tsx`

---

## Testing Requirements

- Unit tests for retry logic (mock rate limits)
- Integration tests for fallback cascade
- E2E tests for session persistence across page refresh
- Load test with 100 concurrent discovery sessions

---

## Out of Scope

- ❌ Custom model fine-tuning
- ❌ User-selectable model preferences (Feature 70)
- ❌ Real-time collaboration (Feature 71)
- ❌ Voice input/output
- ❌ Multi-language error messages

---

**For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.**

No new external services required - using existing Anthropic, OpenAI, and DeepSeek accounts.

---

**END OF SPEC**
