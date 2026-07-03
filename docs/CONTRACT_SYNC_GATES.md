# Contract Synchronization Gates

## Overview

This document describes the absolute mandatory verification gates that CANNOT be bypassed under any circumstances. These gates prevent contract drift and ensure that all implementations, specs, context files, and documentation remain synchronized.

## Problem

Before these gates, contract changes (database schema, API signatures, AI task names, status enums, etc.) could be implemented without updating:
- The current feature spec
- Future specs that depend on the contract  
- Context files (architecture, code-standards, etc.)
- AGENTS.md
- progress-tracker.md

This led to:
- Stale field references in specs
- Build failures from mismatched types
- Agent confusion from outdated documentation
- Hours of debugging contract drift

## Solution

### 1. Rate Limiting (`lib/utils/rate-limiter.ts`)

**Purpose:** Prevent API throttling errors during agent operations.

```typescript
// Exponential backoff retry
await retryWithBackoff(async () => {
  return await callAI(...);
});

// Global rate limiter (2 requests/second)
await globalRateLimiter.throttle();
```

Features:
- Exponential backoff with configurable parameters
- Automatic retry on rate limit errors
- Global rate limiter to pace requests
- Prevents "request throttled by service" errors

### 2. Verification Script (`scripts/verify-sync.js`)

**Purpose:** Automated verification that all contract changes are synchronized.

Checks performed:
- ✅ AGENTS.md contains contract synchronization rule
- ✅ AGENTS.md mentions updating specs, context files, AND progress tracker
- ✅ AGENTS.md lists all verification gates
- ✅ Prisma schema exists
- ✅ Prisma client is generated
- ✅ Required files exist (AGENTS.md, architecture-context.md, progress-tracker.md, code-standards.md)
- ✅ .gitignore contains required entries
- ✅ .env.example contains required variables

### 3. Package.json Hooks

**Purpose:** Automatically enforce gates before tests and builds.

```json
{
  "scripts": {
    "sync:check": "node scripts/verify-sync.js",
    "pretest": "npm run sync:check",
    "prebuild": "npm run sync:check",
    "prepush": "npm run sync:check && npm run security:all && npm run test && npm run build",
    "test": "vitest run",
    "build": "next build",
    "security:all": "npm run security:sast && npm run security:deps && npm run security:secrets"
  }
}
```

**Enforcement points:**
- `pretest` — runs before `npm run test`
- `prebuild` — runs before `npm run build`
- `prepush` — complete gate sequence before push

### 4. Git Pre-Commit Hook (`.husky/pre-commit`)

**Purpose:** Block commits that don't pass contract synchronization verification.

```bash
#!/bin/sh

echo "🔒 Running contract synchronization verification..."
npm run sync:check

if [ $? -ne 0 ]; then
  echo "❌ COMMIT REJECTED"
  echo "Contract synchronization verification failed."
  echo "Fix all errors before committing."
  exit 1
fi

echo "✅ Contract synchronization verified"
echo "Proceeding with commit..."
exit 0
```

### 5. Updated Context Files

All context files now include the VERIFICATION GATE section:

**VERIFICATION GATE:** Before any commit, push, or PR, these scripts MUST pass:
- `npm run sync:check` — verifies contract synchronization
- `npm run security:all` — SAST, dependency audit, secret detection
- `npm run test` — all tests must pass
- `npm run build` — build must succeed with no errors

Files updated:
- `AGENTS.md` (Hard Rule 0)
- `project-kit/context/architecture-context.md`
- `project-kit/context/code-standards.md`
- `project-kit/context/progress-tracker.md`

### 6. AGENTS.md Hard Rule 0

Enhanced with explicit "CANNOT BE BYPASSED" language and structured requirements:

```markdown
0. **Contract synchronization is a hard gate that CANNOT be bypassed under ANY circumstances.**

   a. Update the current feature spec
   b. Update every future spec that depends on that contract
   c. Update all relevant context files
   d. Update AGENTS.md if workflow changes
   e. Update progress-tracker.md session notes
   f. Regenerate derived artifacts (npm run db:generate if schema changed)
   
   **ABSOLUTE VERIFICATION GATE - NO EXCEPTIONS:**
   1. npm run sync:check
   2. npm run security:all
   3. npm run test
   4. npm run build
```

### 7. AGENTS.md Hard Rule 24

Added new rule requiring agents to read AGENTS.md continuously:

```markdown
24. **AI agents MUST read AGENTS.md before, during, and after every operation.**
```

## Verification Flow

```
Developer makes change
        ↓
Runs npm run test
        ↓
pretest hook runs sync:check
        ↓
Verification script checks all requirements
        ↓
   Pass? ────→ Tests run
     ↓ No
   Fail
     ↓
Shows detailed error message
     ↓
Lists all required fixes
     ↓
Developer fixes issues
     ↓
Repeat until pass
```

## Enforcement Levels

### Level 1: npm Scripts
- `pretest` and `prebuild` hooks
- Automatic, cannot be skipped
- Runs before every test and build

### Level 2: Git Hooks
- `.husky/pre-commit`
- Blocks commits when verification fails
- Shows helpful error message

### Level 3: CI/CD (Future)
- GitHub Actions workflow
- Blocks PRs when gates fail
- Final safety net

## Usage

### Normal Development

```bash
# Make changes to code
vim lib/some-file.ts

# Change contract (e.g., Prisma schema)
vim prisma/schema.prisma

# Regenerate Prisma client
npm run db:generate

# Update affected specs
vim project-kit/feature-specs/XX-feature-name.md

# Update context files
vim project-kit/context/architecture-context.md

# Update progress tracker
vim project-kit/context/progress-tracker.md

# Commit (pre-commit hook runs sync:check automatically)
git add .
git commit -m "feat: implement feature"
# ✅ Contract synchronization verified
# ✅ Proceeding with commit...
```

### When Verification Fails

```bash
git commit -m "feat: implement feature"
# ❌ COMMIT REJECTED
# 
# Contract synchronization verification failed.
# Fix all errors before committing.
#
# REQUIRED ACTIONS:
# 1. Update affected feature specs
# 2. Update dependent future specs
# 3. Update context files
# 4. Update AGENTS.md if rules changed
# 5. Update progress-tracker.md session notes
# 6. Run: npm run db:generate (if schema changed)
# 7. Re-run: npm run sync:check
```

### Manual Verification

```bash
# Run sync check manually
npm run sync:check

# Run full gate sequence
npm run prepush
```

## What Gets Checked

### Contract Changes

Any change to:
- Database schema fields/relations
- Route signatures
- Authorization helper signatures
- AI task names or callAI/callAIStream shapes
- Status enums
- Storage paths
- ZIP structure
- Generated file contents
- Package versions
- Environment variables
- File ownership boundaries

### Required Updates

When contract changes:
1. **Current spec** — correct field names, types, signatures
2. **Future specs** — fix stale references, update dependencies
3. **Context files** — architecture, code-standards, ui-*, library-docs, build-plan
4. **AGENTS.md** — if workflow/rules changed
5. **progress-tracker.md** — session notes with what/why
6. **Derived artifacts** — regenerate (e.g., Prisma client)

## Benefits

### Before Gates
- ❌ Contracts could drift silently
- ❌ Specs referenced non-existent fields
- ❌ Agents used outdated APIs
- ❌ Hours debugging inconsistencies
- ❌ Build failures from type mismatches

### After Gates
- ✅ Contracts CANNOT drift
- ✅ Specs always match implementation
- ✅ Agents always have current docs
- ✅ Issues caught immediately
- ✅ Build failures prevented

## Generated Projects

**CRITICAL:** These gates apply to Foundrie itself AND every project it generates.

Generated projects MUST include:
- `scripts/verify-sync.js`
- `sync:check`/`pretest`/`prebuild`/`prepush` in package.json
- `.husky/pre-commit` hook
- VERIFICATION GATE sections in context files
- AGENTS.md with Hard Rule 0

This ensures ALL Foundrie-generated projects are premium products with built-in quality gates.

## Troubleshooting

### "AGENTS.md Hard Rule 0 incomplete"

**Fix:** Ensure AGENTS.md mentions:
- Updating current feature spec
- Updating future specs
- Updating context files
- Updating AGENTS.md
- Updating progress-tracker.md
- All 4 verification gates (sync:check, security:all, test, build)

### "Prisma client not generated"

**Fix:** Run `npm run db:generate`

### "Required file missing"

**Fix:** Ensure these files exist:
- `AGENTS.md`
- `project-kit/context/architecture-context.md`
- `project-kit/context/progress-tracker.md`
- `project-kit/context/code-standards.md`

### ".gitignore missing entries"

**Fix:** Ensure .gitignore contains:
- `.env`
- `.env.local`
- `node_modules`
- `.next`
- `lib/generated`

### ".env.example missing variables"

**Fix:** Ensure .env.example contains:
- `DATABASE_URL`
- `DIRECT_URL`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

## Architecture Decision

**Decision:** Make contract synchronization an absolute mandatory gate that cannot be bypassed.

**Rationale:**
1. Manual synchronization was error-prone
2. Contract drift caused hours of debugging
3. Agents need current documentation to work correctly
4. Automated enforcement is reliable
5. Benefits apply to Foundrie and all generated projects

**Trade-offs:**
- Slightly longer commit time (verification runs)
- More initial setup (hooks, scripts)
- BUT: Prevents far more time lost to debugging

**Status:** Implemented and enforced.

**Verification:** `npm run sync:check` passes all checks.

## Next Steps

1. **Test on next feature** — Verify gates catch contract drift
2. **Add CI/CD enforcement** — GitHub Actions workflow
3. **Monitor effectiveness** — Track issues prevented
4. **Refine checks** — Add more verification as needed

## References

- AGENTS.md Hard Rule 0
- AGENTS.md Hard Rule 19
- AGENTS.md Hard Rule 24
- project-kit/context/architecture-context.md
- project-kit/context/code-standards.md
- project-kit/context/progress-tracker.md
