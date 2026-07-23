# Feature 69: Predictive UX Engine (Background Pre-Computation)

**Status:** Not Started  
**Priority:** P2 (Competitive Advantage)  
**Dependencies:** Feature 65 (AI Error Handling)  
**Assigned To:** AI Agent  
**Estimated Effort:** 5 days

---

## Problem Statement

### Current User Experience (Slow)

**Discovery Phase Completion:**
```
User finishes Phase 8 (discovery complete)
↓
Clicks "Generate Requirements"
↓
Waits 30+ seconds while AI generates ❌ SLOW
↓
Requirements displayed
```

**User Perception:** Foundrie feels slow, competitors feel faster

### The Opportunity

Anticipate user actions and pre-compute results BEFORE they click:

```
User finishes Phase 8
↓ (AI detects completion, starts generation in background)
30 seconds pass (user still reviewing chat)
↓
User clicks "Generate Requirements"
↓ (Already generated!)
Requirements displayed INSTANTLY ✅ AMAZING UX
```

---

## Solution Overview

Implement speculative execution with rollback:

1. **Phase Completion Detection** - AI detects when user ready to advance
2. **Background Pre-Generation** - Start generation before user clicks
3. **Speculation Manager** - Track speculative results with rollback
4. **Redis Caching** - Store pre-generated results (1 hour TTL)
5. **Optimistic UI** - Show instant responses from cache

**Perceived Performance Improvement:** 5-10x faster

---

## Technical Design

### 1. Phase Completion Detection

```typescript
// lib/ai/phase-detector.ts
import { callAI } from "@/lib/ai/rotation-engine";

export async function detectPhaseCompletion(
  sessionId: string,
  messages: Message[]
): Promise<{ phase: number; ready: boolean; confidence: number }> {
  // Analyze last 5 messages
  const lastMessages = messages.slice(-5);
  
  const analysis = await callAI(
    `Analyze if user has completed discovery phase.
    
    Current phase: ${currentPhase}
    Last 5 messages: ${JSON.stringify(lastMessages)}
    
    Return JSON:
    {
      "phaseComplete": boolean,
      "phase": number,
      "confidence": 0.0-1.0,
      "reasoning": "why you think phase is complete"
    }`,
    userPlan
  );
  
  const result = JSON.parse(analysis);
  
  // High confidence (>0.85) → trigger background generation
  if (result.phaseComplete && result.confidence > 0.85) {
    await triggerBackgroundGeneration(sessionId, result.phase);
  }
  
  return result;
}

async function triggerBackgroundGeneration(sessionId: string, phase: number) {
  if (phase === 8) {
    // Discovery complete → pre-generate requirements
    await tasks.trigger("pregenerate-requirements", {
      sessionId,
      priority: "HIGH",
    });
  }
  
  if (phase === 6) {
    // Diagrams approved → pre-generate feature specs
    await tasks.trigger("pregenerate-feature-specs", {
      sessionId,
      priority: "HIGH",
    });
  }
}
```

### 2. Speculation Manager (with Rollback)

```typescript
// lib/predictive/speculation-manager.ts
import { redis } from "@/lib/cache/redis";

interface Speculation {
  id: string;
  projectId: string;
  type: "requirements" | "feature-specs" | "architecture";
  status: "PENDING" | "GENERATING" | "READY" | "COMMITTED" | "ROLLED_BACK";
  result: any;
  createdAt: number;
  expiresAt: number;
}

export async function createSpeculation(
  projectId: string,
  type: Speculation["type"]
): Promise<string> {
  const speculationId = generateId();
  
  const speculation: Speculation = {
    id: speculationId,
    projectId,
    type,
    status: "PENDING",
    result: null,
    createdAt: Date.now(),
    expiresAt: Date.now() + 3600_000, // 1 hour
  };
  
  // Store metadata
  await redis.set(
    `speculation:${speculationId}`,
    speculation,
    { ex: 3600 }
  );
  
  return speculationId;
}

export async function storeSpeculationResult(
  speculationId: string,
  result: any
): Promise<void> {
  // Update status
  const speculation = await redis.get<Speculation>(`speculation:${speculationId}`);
  if (!speculation) throw new Error("Speculation not found");
  
  speculation.status = "READY";
  speculation.result = result;
  
  await redis.set(`speculation:${speculationId}`, speculation, { ex: 3600 });
}

export async function commitSpeculation(speculationId: string): Promise<any> {
  const speculation = await redis.get<Speculation>(`speculation:${speculationId}`);
  if (!speculation) throw new Error("Speculation not found");
  
  if (speculation.status !== "READY") {
    throw new Error("Speculation not ready");
  }
  
  // ✅ Write to real database
  await writeToDatabase(speculation.type, speculation.result);
  
  // Mark as committed
  speculation.status = "COMMITTED";
  await redis.set(`speculation:${speculationId}`, speculation, { ex: 3600 });
  
  // Cleanup after 1 hour
  setTimeout(async () => {
    await redis.del(`speculation:${speculationId}`);
  }, 3600_000);
  
  return speculation.result;
}

export async function rollbackSpeculation(speculationId: string): Promise<void> {
  const speculation = await redis.get<Speculation>(`speculation:${speculationId}`);
  if (!speculation) return; // Already deleted
  
  // ✅ Just delete from cache - nothing written to DB yet
  speculation.status = "ROLLED_BACK";
  await redis.set(`speculation:${speculationId}`, speculation, { ex: 60 }); // Keep 1 min for audit
}

async function writeToDatabase(type: string, result: any) {
  switch (type) {
    case "requirements":
      await db.requirement.createMany({ data: result });
      break;
    case "feature-specs":
      await db.featureSpec.createMany({ data: result });
      break;
    case "architecture":
      await db.contextFile.create({ data: result });
      break;
  }
}
```

### 3. Background Pre-Generation Tasks

```typescript
// trigger/tasks/pregenerate-requirements.ts
import { task } from "@trigger.dev/sdk";
import { generateRequirements } from "@/lib/generation/requirements";
import { createSpeculation, storeSpeculationResult } from "@/lib/predictive/speculation-manager";

export const pregenerateRequirements = task({
  id: "pregenerate-requirements",
  run: async (payload: { sessionId: string; projectId: string }) => {
    // Create speculation record
    const speculationId = await createSpeculation(payload.projectId, "requirements");
    
    try {
      // Generate requirements in background
      const requirements = await generateRequirements(payload.projectId);
      
      // Store result in cache (not database yet)
      await storeSpeculationResult(speculationId, requirements);
      
      logger.info("Pre-generated requirements ready", {
        speculationId,
        projectId: payload.projectId,
        count: requirements.length,
      });
      
      return { success: true, speculationId, count: requirements.length };
      
    } catch (error) {
      logger.error("Pre-generation failed", { error, speculationId });
      await rollbackSpeculation(speculationId);
      throw error;
    }
  },
});
```

### 4. API Route with Speculative Serving

```typescript
// app/api/requirements/[projectId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/cache/redis";
import { commitSpeculation } from "@/lib/predictive/speculation-manager";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const user = await requireAuth();
  await requireProjectMember(projectId);

  // ✅ Check if we have a ready speculation
  const speculationKey = `project:${projectId}:speculation:requirements`;
  const speculationId = await redis.get<string>(speculationKey);
  
  if (speculationId) {
    try {
      // Commit speculation → writes to database
      const requirements = await commitSpeculation(speculationId);
      
      logger.info("Served from speculation (INSTANT)", {
        projectId,
        speculationId,
      });
      
      return NextResponse.json({ 
        requirements,
        source: "speculation", // Debug info
        instant: true,
      });
    } catch (error) {
      // Speculation expired or invalid → fall through to normal generation
      logger.warn("Speculation failed, falling back", { error });
    }
  }

  // Fallback: generate on-demand (slower path)
  const requirements = await generateRequirements(projectId);
  
  return NextResponse.json({ 
    requirements,
    source: "generated",
    instant: false,
  });
}
```

### 5. Frontend Optimistic UI

```typescript
// hooks/use-predictive-generation.ts
import { useState, useEffect } from "react";

export function usePredictiveGeneration(
  projectId: string,
  type: "requirements" | "feature-specs"
) {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  // Poll for speculation status
  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch(
        `/api/speculation/${projectId}/status?type=${type}`
      );
      const data = await response.json();
      
      if (data.ready) {
        setReady(true);
        clearInterval(interval);
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [projectId, type]);

  const generate = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/${type}/${projectId}`);
      const data = await response.json();

      if (data.instant) {
        // ✅ Served from speculation - INSTANT
        return { data: data.requirements, instant: true };
      } else {
        // Generated on-demand - slower
        return { data: data.requirements, instant: false };
      }
    } finally {
      setLoading(false);
    }
  };

  return { ready, loading, generate };
}

// Usage in component
function RequirementsGenerator() {
  const { ready, loading, generate } = usePredictiveGeneration(
    projectId,
    "requirements"
  );

  return (
    <button
      onClick={generate}
      disabled={loading}
      className={ready ? "ring-2 ring-green-500" : ""}
    >
      {ready && "✨ "} Generate Requirements {ready && "(Ready!)"}
    </button>
  );
}
```

---

## Acceptance Criteria

- [ ] Phase completion detected automatically (>85% confidence)
- [ ] Requirements pre-generated in background when Phase 8 complete
- [ ] Feature specs pre-generated when diagrams approved
- [ ] Pre-generated results served from cache (<500ms)
- [ ] Rollback works when user changes their mind
- [ ] No speculative data persists to database without user confirmation
- [ ] Pre-computation accuracy >80% (user actually clicks button)
- [ ] Perceived performance improvement >5x (measured via user surveys)
- [ ] Cache hit rate for speculative results >70%

---

## Files Owned

### New Files
- `lib/ai/phase-detector.ts`
- `lib/predictive/speculation-manager.ts`
- `trigger/tasks/pregenerate-requirements.ts`
- `trigger/tasks/pregenerate-feature-specs.ts`
- `hooks/use-predictive-generation.ts`
- `app/api/speculation/[projectId]/status/route.ts`

### Modified Files
- `app/api/requirements/[projectId]/route.ts`
- `app/api/feature-specs/[projectId]/route.ts`
- `hooks/use-discovery-chat.ts` (integrate phase detection)

---

## Testing Requirements

- Unit test: Phase detection accuracy (90%+ on test set)
- Integration test: Pre-generation → user clicks → served from cache
- E2E test: User completes discovery → requirements appear instant
- Performance test: Verify <500ms cache serve vs 30s+ generation
- Rollback test: User changes phase → speculation discarded cleanly

---

## Out of Scope

- ❌ Predictive payments (security risk)
- ❌ Predictive deletions (safety risk)
- ❌ Multi-step speculation chains
- ❌ User-configurable prediction settings

---

## Security Considerations

**⚠️ CRITICAL: What NOT to Pre-Compute**

❌ **Never pre-compute:**
- Payment processing
- Data deletions
- Email sending
- User account modifications
- Sensitive data operations

✅ **Safe to pre-compute:**
- Read-only AI generation
- Report building
- Analytics dashboards
- Search results
- AI suggestions

---

**END OF SPEC**
