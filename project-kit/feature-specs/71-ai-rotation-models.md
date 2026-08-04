# Feature 71 - AI Rotation Models Enhancement

## Type
ENHANCEMENT

## What This Delivers
Integrates Gemini 3.6 Flash and 3.5 Flash-Lite models into AI Rotation engine. Improves conversational flow with better stopping logic and RAG memory sync.

## Dependencies
- Feature 05 (AI Rotation Engine)
- Feature 64 (Discovery Chat State & Logic)

## Context To Read First
- `context/architecture-context.md`
- `context/ai-workflow-rules.md`
- `research/FOUNDRIE_RESEARCH.md`

## Files Owned
None

## Files
MODIFY: `lib/ai/rotation-engine.ts`
MODIFY: `lib/ai/models/gemini.ts`
CREATE: `lib/ai/models/gemini-flash.ts`

## Acceptance Criteria
- [ ] Gemini 3.6 Flash integrated
- [ ] Gemini 3.5 Flash-Lite integrated
- [ ] Conversational limits by complexity
- [ ] RAG memory prevents redundant questions
- [ ] Tests pass, build succeeds
- [ ] Progress tracker updated to Feature 72
