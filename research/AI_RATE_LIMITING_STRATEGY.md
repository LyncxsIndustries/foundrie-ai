# AI Rate Limiting Strategy

**Created:** 2026-07-04  
**Status:** Active Implementation  
**Related:** Feature 65, FOUNDRIE_V15.0.0  
**Full Analysis:** `ARCHITECTURE_ENHANCEMENT_ANALYSIS.md` Part 1

---

## Quick Reference

### Two-Layer Problem

1. **Kiro CLI (Development):** Anthropic Claude API → ~60 req/min
2. **Foundrie (Production):** Multiple providers → Various limits

### Solution Pattern

```typescript
Primary Model (3x retry, exponential backoff)
  ↓ FAIL
Secondary Model (3x retry)
  ↓ FAIL
Tertiary Model (3x retry)
  ↓ FAIL
User-friendly error + log for investigation
```

---

## Provider Rate Limits (2026)

| Provider | Free Tier | Paid Tier | Recovery Time |
|----------|-----------|-----------|---------------|
| DeepSeek R1 | 100 req/min | 1000 req/min | 24h block |
| Claude Sonnet 4 | N/A | 1000 req/min | Exp backoff |
| GPT-4o | 3 req/min | 500 req/min | 60s window |
| Kimi K2 | 60 req/min | 600 req/min | 60s window |
| Groq Llama | 30 req/min | 300 req/min | 60s window |

---

## Error Classification

```typescript
RATE_LIMIT     → Retry with backoff, then fallback
MODEL_DOWN     → Immediate fallback
NETWORK_ERROR  → Retry 3x, then fallback
TIMEOUT        → Retry with longer timeout
CONTENT_FILTER → Non-retryable, ask user to rephrase
CONTEXT_LENGTH → Non-retryable, ask user to shorten
```

---

## Fallback Chains

**Free Tier Users:**
```
DeepSeek R1 → GPT-4o-mini → Groq Llama
```

**Pro/Enterprise Users:**
```
Claude Sonnet 4 → GPT-4o → DeepSeek R1 → Kimi K2
```

---

## Implementation Checklist

- [ ] Typed `AIError` class with `retryable` flag
- [ ] `retryWithBackoff()` utility (1s, 2s, 4s delays)
- [ ] Provider rotation in `callAI()`
- [ ] User-friendly error messages in UI
- [ ] Telemetry for provider success rates
- [ ] Alert if all providers fail >5 min

---

## Testing Strategy

```typescript
// Mock rate limit
vi.mocked(callClaude).mockRejectedValue({ status: 429 });

// Verify fallback
expect(callOpenAI).toHaveBeenCalled();

// Verify retry count
expect(callClaude).toHaveBeenCalledTimes(3);
```

---

**See `ARCHITECTURE_ENHANCEMENT_ANALYSIS.md` Part 1 for full implementation details.**
