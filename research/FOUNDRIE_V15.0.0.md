# Foundrie AI v15.0.0 — Architecture Resilience & Production Readiness

**Release Date:** 2026-07-04  
**Status:** Current  
**Previous Version:** v14.0.0  
**Scope:** AI rate limiting, error handling, disaster recovery, production gates

---

## What Changed in v15.0.0

This release addresses critical production-readiness gaps discovered during Feature 55 implementation:

1. **AI Rate Limiting & Error Recovery** - Intelligent retry, multi-model fallback, user-friendly errors
2. **Database Backup & Disaster Recovery** - Multi-layer backup strategy, breach detection, cold start mitigation
3. **Conversation State Persistence** - Session checkpointing, resume after power loss

All prior versions (v1.0.0–v14.0.0) remain in force. This version adds production reliability layers.

---

## 1. AI Rate Limiting & Error Handling (Feature 65)

### The Two-Layer Throttling Problem

**Layer 1: Kiro CLI (Development Agent)**
- Provider: Anthropic Claude API
- Limit: ~60 requests/minute
- Impact: Blocks development workflow when agent makes too many rapid tool calls
- Solution: Agent must batch operations and add strategic pauses

**Layer 2: Foundrie AI (Production)**
- Providers: DeepSeek R1, Claude Sonnet 4, GPT-4, Kimi K2, Qwen Coder
- Current: No retry logic, no fallback, generic errors
- Impact: Users see "AI generation failed" and abandon discovery mid-session

### Typed Error Classification

```typescript
type AIErrorType = 
  | "RATE_LIMIT"      // Provider throttled (429)
  | "MODEL_DOWN"      // Provider unavailable (503)
  | "NETWORK_ERROR"   // Connection timeout
  | "TIMEOUT"         // Response >30s
  | "INVALID_RESPONSE"// Malformed output
  | "CONTEXT_LENGTH"  // Input too long
  | "CONTENT_FILTER"  // Safety filter blocked
  | "AUTH_ERROR"      // API key invalid
  | "UNKNOWN";
```

### Multi-Model Fallback Cascade

**Free Tier:** DeepSeek R1 (primary) → GPT-4o-mini (fallback)  
**Pro/Enterprise:** Claude Sonnet 4 → GPT-4o → DeepSeek R1

Each model retried 3x with exponential backoff (1s, 2s, 4s) before falling back to next.

### User-Friendly Error Messages

| Error Type | User Sees |
|------------|-----------|
| RATE_LIMIT | 🕐 High demand detected. Retrying with backup model... |
| NETWORK_ERROR | 🌐 Connection issue. Retrying... |
| MODEL_DOWN | ⚠️ Primary AI unavailable. Switching to backup... |
| TIMEOUT | ⏱️ Request taking longer than expected. Still processing... |

### Discovery Session Persistence

New `DiscoverySession` model:
- `id`, `projectId`, `userId`
- `state` (STARTED, IN_PROGRESS, PAUSED, COMPLETED, ARCHIVED)
- `currentPhase` (1-8)
- `messages` (JSON array - full conversation history)
- `checkpointData` (last known good state)
- Timestamps

Every message saved to database immediately. Page refresh resumes exactly where user left off.

---

## 2. Database Backup & Disaster Recovery (Feature 66)

### The Vulnerability

**Current State:**
- ❌ No automated backups
- ❌ Relying only on Neon's 7-day retention (free tier)
- ❌ No protection against accidental `DROP TABLE`
- ❌ Cold starts after 5 minutes inactivity

**Impact:** Data loss = business extinction

### Multi-Layer Backup Strategy

**Layer 1: Neon Native Backups**
- Built-in continuous backups
- Point-in-time recovery (7-30 days depending on tier)
- Fast but limited retention

**Layer 2: Daily Automated pg_dump**
- Trigger.dev task runs at 3 AM UTC daily
- Compressed SQL dump uploaded to 3 locations:
  - Vercel Blob (primary)
  - AWS S3 (secondary)
  - CloudFlare R2 (tertiary - geo-redundant)
- Keeps 90 days of backups
- `BackupLog` model tracks all backups

**Layer 3: Pre-Migration Snapshots**
- Automatic backup before every `prisma migrate`
- Test migration on branch first
- Rollback available if integrity fails

### Cold Start Mitigation

**Problem:** Neon free tier auto-pauses after 5 minutes → 1-3 second delay on first request

**Solution:** Keep-alive task runs every 4 minutes:
```typescript
export const databaseKeepAlive = schedules.task({
  id: "database-keep-alive",
  cron: "*/4 * * * *",
  run: async () => {
    await db.$queryRaw`SELECT 1`;
    return { status: "alive" };
  },
});
```

**Result:** Zero cold starts for users

### Breach Detection & Auto-Snapshot

Monitors for anomalous delete activity:
- 100+ deletes/minute = suspicious
- Immediately creates emergency snapshot
- Revokes all active API tokens
- Sets database to read-only mode
- Alerts admin via SMS + Slack + email

---

## 3. Conversation State Management

### Session Lifecycle

```
STARTED → IN_PROGRESS → PAUSED → COMPLETED → ARCHIVED
```

**STARTED:** User initiates discovery  
**IN_PROGRESS:** Actively chatting  
**PAUSED:** User left, can resume later  
**COMPLETED:** All 8 phases done  
**ARCHIVED:** Backup after user makes edits

### Auto-Save & Resume

- Every message triggers database update
- LangGraph PostgresSaver checkpoints every AI turn
- Page refresh offers: Resume / Review history / Discard
- Collaborative sessions persist in Neon (not local machine)

### Rollback Support

- **Diagram rollback:** Restore prior version, dependent specs flagged
- **Conversation-branch rollback:** Explore "what if" scenarios, both branches preserved

---

## 4. Production Gates (Hard Requirements)

### ABSOLUTE VERIFICATION GATE

Before any commit, push, or PR, these scripts MUST pass:

1. `npm run sync:check` — Contract synchronization
2. `npm run security:all` — SAST, dependency audit, secret detection
3. `npm run test` — All tests pass
4. `npm run build` — Build succeeds

These gates are enforced in:
- `package.json` via `pretest` and `prebuild` hooks
- `.husky/pre-commit` hook (blocks commits)
- CI/CD pipeline (blocks merges)

**NEVER bypass these gates.** Generated projects MUST include identical gates.

---

## 5. API Throttling Prevention (Hard Rule 25)

### Immediate Recovery Steps

When encountering "The request was throttled by the service":

1. **PAUSE EXECUTION:** Stop making tool calls immediately
2. **WAIT:** Execute `sleep 5` command (5 seconds minimum)
3. **BATCH OPERATIONS:** Combine multiple small operations into fewer large ones
4. **VERIFY:** Check last operation completed before continuing

### Prevention Strategies (MANDATORY)

- **Batch file operations:** Read/write multiple files in single operations
- **Use glob patterns:** Find all files, then batch-read them
- **Consolidate writes:** Plan all changes, execute in batch
- **Strategic pauses:** Insert 2-3 second pauses every 5 calls
- **Prefer shell commands:** For bulk operations (grep, find, sed)
- **Check state first:** Verify modification needed before reading file

### What to Tell User

"Hit API rate limit. Pausing 5 seconds to recover, then will continue with [specific next action]. I've batched the remaining [N] operations to prevent future throttling."

### NEVER:
- Make 10+ rapid sequential tool calls without pauses
- Retry immediately after throttling (makes it worse)
- Read same file multiple times in quick succession
- Write files one line at a time
- Give up after one throttle error

---

## 6. Contract Synchronization (Updated Hard Rule 0)

Whenever implementation changes any project contract:

**Immediately update:**
1. Current feature spec (with actual implementation)
2. Every future spec that depends on that contract
3. All relevant context files
4. `AGENTS.md` if workflow affected
5. `progress-tracker.md` session notes

**Then regenerate derived artifacts:**
- Run `npm run db:generate` if Prisma schema changed

**ABSOLUTE GATE:** `npm run sync:check` MUST pass before any commit.

---

## 7. Implementation Tracking

### New Feature Specs

- **Feature 65:** AI Error Handling & Rate Limit Recovery (P0)
- **Feature 66:** Database Backup & Disaster Recovery (P0)
- **Feature 67:** Payment Transaction Safety & Idempotency (P0)

### New Database Models

```prisma
model DiscoverySession {
  id               String       @id @default(cuid())
  projectId        String
  userId           String
  state            SessionState @default(STARTED)
  currentPhase     Int          @default(1)
  messages         Json[]       @default([])
  checkpointData   Json?
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt
  
  @@unique([userId, projectId])
  @@index([state])
}

enum SessionState {
  STARTED
  IN_PROGRESS
  PAUSED
  COMPLETED
  ARCHIVED
}

model BackupLog {
  id        String     @id @default(cuid())
  filename  String     @unique
  size      BigInt
  locations String[]   // ["vercel-blob", "s3", "r2"]
  type      BackupType
  timestamp DateTime
  verified  Boolean    @default(false)
  createdAt DateTime   @default(now())
  
  @@index([timestamp])
}

enum BackupType {
  FULL
  INCREMENTAL
  PRE_MIGRATION
  EMERGENCY
}
```

---

## 8. Breaking Changes

None. This is purely additive.

---

## 9. Migration Path

For existing Foundrie installations:

1. Run `npm install` (no new dependencies for Feature 65-66)
2. Run `prisma migrate dev --name add-discovery-sessions-and-backup-logs`
3. Set up external services (Upstash Redis for Feature 68+, AWS S3 + CloudFlare R2 for backups)
4. Configure keep-alive task in Trigger.dev
5. Add new environment variables to `.env`

For generated projects:

All new projects automatically include:
- Retry logic with fallback models
- Session persistence patterns
- Backup task templates
- Verification gates in `package.json` and git hooks

---

## 10. References

- **Analysis Document:** `research/ARCHITECTURE_ENHANCEMENT_ANALYSIS.md`
- **Related Research:** `research/AI_RATE_LIMITING_STRATEGY.md`, `research/DATABASE_RESILIENCE_ARCHITECTURE.md`
- **Feature Specs:** `project-kit/feature-specs/65-*.md`, `66-*.md`

---

**All content from v1.0.0 through v14.0.0 remains in force. v15.0.0 adds production reliability without replacing prior architecture.**
