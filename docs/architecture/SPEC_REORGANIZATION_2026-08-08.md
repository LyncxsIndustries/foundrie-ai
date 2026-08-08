# Feature Spec Reorganization - Discovery Orchestration Enhancement

**Date:** 2026-08-08  
**Status:** Complete  
**Scope:** Added 6 new Discovery Orchestration specs (65-70), shifted existing specs 65-99 to 71-105

---

## Summary

To properly implement the discovery-to-requirements workflow, 6 new feature specs have been created to handle phase state management, AI model routing, handoff validation, UI integration, prompt templates, and session recovery. This ensures the discovery → requirements transition is deterministic, validated, and resilient.

---

## New Specs Created (65-70)

### Feature 65 - Discovery Phase State Machine
**File:** `project-kit/feature-specs/65-discovery-phase-state-machine.md`

**What It Delivers:**
- Project complexity classification (SIMPLE/STANDARD/COMPLEX)
- Dynamic phase progression with semantic completion detection
- Phase requirement validation (minMessages, requiredTopics, completionSignals)
- Phase history tracking with context accumulation
- SIMPLE projects skip Phase 4-5 (jump from 3 → 6)

**Key Files:**
- `lib/discovery/phase-machine.ts` - phase state machine and transitions
- `lib/discovery/complexity-classifier.ts` - project classification logic
- `lib/discovery/semantic-analyzer.ts` - content analysis for completion
- `app/api/discovery/[projectId]/phase/route.ts` - phase API
- Database: `DiscoverySession` model with phase tracking

### Feature 66 - AI Model Selection & Context Management Per Phase
**File:** `project-kit/feature-specs/66-ai-model-selection-per-phase.md`

**What It Delivers:**
- Phase-aware model routing (Gemini Pro for synthesis, DeepSeek R1 for critique, etc.)
- Context window management with 70% utilization trigger
- Automatic compression preserving recent 5 messages
- Tier-aware selection (FREE→DeepSeek, PRO→phase-specific, ENTERPRISE→Claude)
- Model availability checking with fallback chains

**Key Files:**
- `lib/ai/phase-model-router.ts` - phase-to-model mapping
- `lib/ai/context-manager.ts` - token tracking and compression triggers
- `lib/ai/context-compressor.ts` - semantic compression logic
- Integration with existing `lib/ai/rotation-engine.ts`

### Feature 67 - Discovery-to-Requirements Handoff Contract
**File:** `project-kit/feature-specs/67-discovery-to-requirements-handoff.md`

**What It Delivers:**
- Zod schema validation for handoff data structure
- AI extraction of structured data from conversation
- Completeness validation (0-100%) with missing field detection
- Blocks requirements generation until handoff is valid
- Stores validated handoff in database for requirements consumption

**Key Files:**
- `lib/discovery/handoff-contract.ts` - Zod schema and types
- `lib/discovery/handoff-validator.ts` - validation logic
- `lib/discovery/context-extractor.ts` - AI-powered extraction
- `app/api/discovery/[projectId]/validate-handoff/route.ts`
- Database: `DiscoveryHandoff` model with all structured fields

**Handoff Schema Includes:**
- `problemStatement`, `targetUsers`, `successCriteria`
- `coreFlows`, `features`, `constraints`
- `technicalStack`, `integrations`, `nonFunctional`
- `designRefs`

### Feature 68 - Discovery UI State Integration
**File:** `project-kit/feature-specs/68-discovery-ui-state-integration.md`

**What It Delivers:**
- Phase indicator showing current phase and progress
- Complexity badge (SIMPLE/STANDARD/COMPLEX)
- Validation status display with completeness percentage
- "Next Phase" button when requirements met
- "Generate Requirements" button when handoff valid

**Key Files:**
- `components/discovery/PhaseIndicator.tsx`
- `components/discovery/ComplexityBadge.tsx`
- `components/discovery/ValidationStatus.tsx`
- Integration with `components/discovery/DiscoveryChat.tsx`

### Feature 69 - AI Prompt Templates Per Phase
**File:** `project-kit/feature-specs/69-ai-prompt-templates-per-phase.md`

**What It Delivers:**
- Phase-specific AI prompt templates
- System instructions adapted to phase and complexity
- Few-shot examples per phase
- Phase-specific guardrails and stopping logic

**Key Files:**
- `lib/ai/prompts/discovery-phases.ts` - orchestration
- `lib/ai/prompts/phase-templates/phase-{1-5}.ts` - individual templates
- Integration with `trigger/streaming-chat.ts`

### Feature 70 - Discovery Session Recovery & Resume
**File:** `project-kit/feature-specs/70-discovery-session-recovery.md`

**What It Delivers:**
- Page refresh recovery at exact message
- LangGraph checkpoints after each AI turn
- Power loss recovery from database state
- Cross-device continuation
- Recovery UI: Resume / Review history / Start fresh

**Key Files:**
- `lib/discovery/session-recovery.ts` - recovery logic
- `lib/discovery/checkpoint-sync.ts` - LangGraph integration
- `app/api/discovery/[projectId]/recover/route.ts`

---

## Renamed Specs (65-99 → 71-105)

All existing specs from 65-99 have been shifted forward by 6 positions:

| Old Number | New Number | Spec Name |
|------------|------------|-----------|
| 65 | 71 | Requirements Page Integration |
| 66 | 72 | Global Theme and Contrast Fix |
| 67 | 73 | Foundrie AI Skills AI Integration |
| 68 | 74 | Landing Page Animations |
| 69 | 75 | Dashboard Project Cards UI |
| 70 | 76 | Global Layout Interactions |
| 71 | 77 | AI Rotation Models Enhancement |
| 72-88 | 78-94 | UI Refinements |
| 89-93 | 95-99 | ZIP Testing & Templates |
| 94-99 | 100-105 | Production Readiness |

**Total Specs:** 105 (previously 99)

---

## Updated Files

### 1. README.md
- Updated feature spec roadmap to show 65-70 discovery orchestration block
- Listed 71-105 as shifted specs
- Documented 100-105 as production readiness

### 2. AGENTS.md
- Updated "Note on Spec Renumbering" to document the 2026-08-08 shift
- Explains the 6 new discovery orchestration specs
- References deterministic discovery → requirements transition

### 3. project-kit/context/progress-tracker.md
- Updated Current Goal to Feature 65 (Discovery Phase State Machine)
- Updated Next Up to list Features 66-70 orchestration block
- Added detailed descriptions of each orchestration feature
- Listed Features 71-88 as Requirements & UI Refinement block

### 4. project-kit/context/architecture-context.md
- **Already contains complete Discovery Orchestration section**
- Documents phase state machine with enums
- Explains AI model selection per phase
- Defines handoff contract with Zod schema
- Describes session recovery mechanisms
- Lists all API routes and database models

### 5. All Renamed Specs (71-105)
- Updated feature numbers in headers (`# Feature NN`)
- Updated dependency references within specs
- Updated progress tracker references to point to next feature
- Fixed cross-references between specs

---

## Contract Synchronization Checklist

✅ **Spec Files:**
- [x] Created 6 new specs (65-70)
- [x] Renamed 35 existing specs (65-99 → 71-105)
- [x] Updated all feature numbers in headers
- [x] Updated all progress tracker references
- [x] Updated all dependency references

✅ **Documentation Files:**
- [x] README.md updated with new roadmap
- [x] AGENTS.md updated with renumbering note
- [x] progress-tracker.md updated with new Current Goal/Next Up
- [x] architecture-context.md contains complete Discovery Orchestration section

✅ **Cross-References:**
- [x] Feature 71 (formerly 65) now depends on Feature 67 (handoff validation)
- [x] Feature 64 completion points to Feature 65 as next
- [x] All specs 71-105 reference correct feature numbers

---

## Implementation Order

The new specs (65-70) must be implemented **before** Feature 71 (Requirements Page Integration), as Feature 71 depends on Feature 67's handoff validation.

**Correct Order:**
1. Feature 65 - Discovery Phase State Machine
2. Feature 66 - AI Model Selection Per Phase
3. Feature 67 - Discovery-to-Requirements Handoff
4. Feature 68 - Discovery UI State Integration
5. Feature 69 - AI Prompt Templates Per Phase
6. Feature 70 - Discovery Session Recovery
7. Feature 71 - Requirements Page Integration (depends on 67)
8. Features 72-105 - Continue in order

---

## Database Schema Changes

New models added across Features 65-70:

### DiscoverySession (Feature 65)
```prisma
model DiscoverySession {
  id            String            @id @default(cuid())
  projectId     String            @unique
  userId        String
  
  currentPhase  DiscoveryPhase    @default(PHASE_1_PROBLEM_USERS)
  complexity    ProjectComplexity?
  phaseHistory  Json[]            @default([])
  phaseContext  Json?
  
  state         SessionState      @default(STARTED)
  messages      Json[]            @default([])
  checkpointData Json?
  
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
}

enum ProjectComplexity {
  SIMPLE
  STANDARD
  COMPLEX
}

enum DiscoveryPhase {
  PHASE_1_PROBLEM_USERS
  PHASE_2_CORE_FLOWS
  PHASE_3_SCOPE_CONSTRAINTS
  PHASE_4_TECHNICAL_DIRECTION
  PHASE_5_FEATURE_SEQUENCE
  PHASE_6_ARCHITECTURE_DIAGRAMS
  PHASE_7_FEATURE_SPECS
  PHASE_8_ZIP_ASSEMBLY
}
```

### DiscoveryHandoff (Feature 67)
```prisma
model DiscoveryHandoff {
  id                String   @id @default(cuid())
  projectId         String   @unique
  sessionId         String   @unique
  
  problemStatement  String
  targetUsers       Json
  successCriteria   Json
  coreFlows         Json
  features          Json
  constraints       Json
  technicalStack    Json
  integrations      Json
  nonFunctional     Json
  designRefs        Json?
  
  complexity        String
  phaseCount        Int
  messageCount      Int
  isValid           Boolean  @default(false)
  validationErrors  Json[]   @default([])
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

---

## API Routes Added

### Feature 65 - Phase Management
- `GET /api/discovery/[projectId]/phase` - Get current phase and advancement status
- `POST /api/discovery/[projectId]/phase` - Advance to next phase
- `POST /api/discovery/[projectId]/classify` - Classify project complexity

### Feature 66 - Model Routing
- `POST /api/ai/route-model` - Get selected model for phase and tier

### Feature 67 - Handoff Validation
- `POST /api/discovery/[projectId]/validate-handoff` - Validate handoff readiness
- `POST /api/discovery/[projectId]/extract-context` - Extract handoff data from conversation

### Feature 70 - Session Recovery
- `POST /api/discovery/[projectId]/recover` - Recover interrupted session

---

## Quality Gates

All new specs include the mandatory quality gates:

1. `npm run sync:check` - Contract synchronization verification
2. `npm run security:all` - SAST, dependency audit, secret detection
3. `npm run test` - All tests must pass
4. `npm run build` - Build must succeed

These gates are enforced in:
- `package.json` via `pretest` and `prebuild` hooks
- `.husky/pre-commit` hook
- CI/CD pipeline

---

## Next Steps

1. **Current:** Feature 64 (Discovery Chat State & Logic) is complete and ready for review
2. **Next:** Implement Feature 65 (Discovery Phase State Machine)
3. **Then:** Continue with Features 66-70 to complete the orchestration block
4. **After:** Feature 71 (Requirements Page Integration) can proceed with full handoff validation support

---

**End of Reorganization Summary**
