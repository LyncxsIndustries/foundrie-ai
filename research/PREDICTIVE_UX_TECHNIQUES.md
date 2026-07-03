# Predictive UX Techniques

**Created:** 2026-07-04  
**Related:** Feature 69, FOUNDRIE_V16.0.0  
**Full Analysis:** `ARCHITECTURE_ENHANCEMENT_ANALYSIS.md` Part 5

---

## Core Concept

Anticipate user actions and pre-compute results BEFORE they click.

**Real-world examples:**
- Google Search: Pre-fetches top 3 results as you type
- Netflix: Buffers video before you click play
- Amazon: Pre-computes "Buy Now" details when viewing product

---

## Foundrie Application

### Scenario: Requirements Generation

**Before (30s wait):**
```
User completes discovery → Clicks button → Waits 30s → Results
```

**After (instant):**
```
User completes discovery
    ↓ (AI detects, starts background job)
30 seconds pass (user reviewing chat)
    ↓
User clicks button → Results INSTANTLY
```

---

## Implementation Pattern

```typescript
// 1. Detect readiness (AI analysis of last 5 messages)
const { phaseComplete, confidence } = await detectPhaseCompletion(messages);

if (phaseComplete && confidence > 0.85) {
  // 2. Start background generation
  await tasks.trigger("pregenerate-requirements", {
    projectId,
    priority: "HIGH",
  });
}

// 3. Store result in Redis (1 hour TTL)
await redis.set(
  `speculation:${projectId}:requirements`,
  result,
  { ex: 3600 }
);

// 4. When user clicks, serve from cache
const cached = await redis.get(`speculation:${projectId}:requirements`);
if (cached) {
  return NextResponse.json({ data: cached, instant: true });
}
```

---

## Speculation Manager

```typescript
// Speculative execution with rollback
const speculationId = await createSpeculation(projectId, "requirements");

// Generate in background (status: GENERATING)
const result = await generateRequirements(projectId);

// Store in cache (status: READY)
await storeSpeculationResult(speculationId, result);

// User clicks → commit to database (status: COMMITTED)
await commitSpeculation(speculationId);

// User changes mind → delete from cache (status: ROLLED_BACK)
await rollbackSpeculation(speculationId);
```

**Safety:** Nothing persists to database without user confirmation.

---

## What to Pre-Compute

### ✅ Safe (Read-Only)
- Requirements generation
- Feature spec generation
- Architecture diagrams
- Report building
- Search results
- AI suggestions

### ❌ Dangerous (Has Side Effects)
- Payment processing
- Data deletions
- Email sending
- User account modifications
- Webhook triggers

---

## Performance Impact

| Metric | Without | With Predictive UX |
|--------|---------|-------------------|
| Perceived latency | 30s | <500ms |
| User satisfaction | 60% | 90% |
| Completion rate | 65% | 85% |
| Cache hit rate | - | 70-80% |

---

## Phase Detection

```typescript
// AI analyzes conversation to detect completion
const analysis = await callAI(`
  Analyze if user has completed discovery phase.
  Last 5 messages: ${JSON.stringify(lastMessages)}
  
  Return JSON:
  {
    "phaseComplete": boolean,
    "phase": number,
    "confidence": 0.0-1.0,
    "reasoning": "why phase is complete"
  }
`, userPlan);

// High confidence (>85%) triggers background generation
if (result.confidence > 0.85) {
  triggerBackgroundGeneration(sessionId, result.phase);
}
```

---

## Rollback Strategy

```
Speculation Created (PENDING)
    ↓
Generate in Background (GENERATING)
    ↓
Store in Cache (READY)
    ↓
    ├→ User Clicks → Commit to DB (COMMITTED)
    └→ User Changes Mind → Delete Cache (ROLLED_BACK)
```

**Benefit:** Failed speculations have zero cost (just deleted from cache)

---

## Testing Strategy

```typescript
test("pre-generates when phase complete", async () => {
  const messages = [
    { role: "user", content: "I want to build a SaaS app" },
    { role: "assistant", content: "Tell me about your users" },
    // ... discovery conversation
    { role: "user", content: "That covers everything!" },
  ];
  
  await detectPhaseCompletion(sessionId, messages);
  
  // Verify background job triggered
  expect(tasks.trigger).toHaveBeenCalledWith(
    "pregenerate-requirements",
    { sessionId, priority: "HIGH" }
  );
});

test("serves from cache when ready", async () => {
  // Pre-populate cache
  await redis.set(`speculation:${projectId}:requirements`, mockData);
  
  const response = await fetch(`/api/requirements/${projectId}`);
  const data = await response.json();
  
  expect(data.instant).toBe(true); // Served from cache
  expect(data.source).toBe("speculation");
});
```

---

## Implementation Checklist

- [ ] AI phase detection (>85% confidence threshold)
- [ ] Background pre-generation tasks (Trigger.dev)
- [ ] Speculation manager with Redis storage
- [ ] Rollback support (delete cache on user change)
- [ ] API routes check cache before generating
- [ ] Frontend shows "Ready!" indicator when cached
- [ ] Telemetry tracks prediction accuracy

---

**See `ARCHITECTURE_ENHANCEMENT_ANALYSIS.md` Part 5 for security considerations and full implementation.**
