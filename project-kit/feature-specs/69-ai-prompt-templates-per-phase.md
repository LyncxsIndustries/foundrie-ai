# Feature 69 - AI Prompt Templates Per Phase

## Type

ENHANCEMENT

## What This Delivers

Creates phase-specific AI prompt templates that guide the AI through each discovery phase with appropriate question depth, context awareness, and stopping logic. Templates include system instructions, few-shot examples, and phase-specific guardrails. After this feature, AI adapts its questioning strategy based on current phase and project complexity.

## Dependencies

- Feature 65 (Discovery Phase State Machine) - provides phase context
- Feature 66 (AI Model Selection Per Phase) - uses phase-aware models
- Feature 05 (AI Rotation Engine) - prompt injection

## Context To Read First

- `context/ai-workflow-rules.md`
- `research/FOUNDRIE_RESEARCH.md` (Section 5: Discovery Protocol)
- `context/code-standards.md`

## Files Owned

- `lib/ai/prompts/discovery-phases.ts` (NEW)
- `lib/ai/prompts/phase-templates/` (NEW directory with 8 templates)

## Files

CREATE: `lib/ai/prompts/discovery-phases.ts` - phase prompt orchestration
CREATE: `lib/ai/prompts/phase-templates/phase-1-problem-users.ts` - Phase 1 template
CREATE: `lib/ai/prompts/phase-templates/phase-2-core-flows.ts` - Phase 2 template
CREATE: `lib/ai/prompts/phase-templates/phase-3-scope-constraints.ts` - Phase 3 template
CREATE: `lib/ai/prompts/phase-templates/phase-4-technical-direction.ts` - Phase 4 template
CREATE: `lib/ai/prompts/phase-templates/phase-5-feature-sequence.ts` - Phase 5 template
MODIFY: `trigger/streaming-chat.ts` - use phase-specific prompts
CREATE: `lib/ai/prompts/discovery-phases.test.ts` - test prompt generation

## Acceptance Criteria

- [ ] Phase-specific prompt templates created for all 8 phases
- [ ] Templates include system instructions, examples, and guardrails
- [ ] Prompts adapt to project complexity (SIMPLE/STANDARD/COMPLEX)
- [ ] Streaming chat uses phase-specific prompts
- [ ] Templates tested with sample contexts
- [ ] `context/progress-tracker.md` updated to point at Feature 70

## Setup Instructions

No new dependencies. Extends existing AI prompt system.
