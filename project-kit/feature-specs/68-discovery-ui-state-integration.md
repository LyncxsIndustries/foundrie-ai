# Feature 68 - Discovery UI State Integration

## Type

ENHANCEMENT

## What This Delivers

Integrates discovery phase state, complexity classification, and handoff validation into the Discovery Chat UI. Shows current phase indicator, phase progress bar, complexity badge, completion confidence meter, and validation status. Displays "Next Phase" button when phase requirements are met, "Generate Requirements" button when handoff is valid. After this feature, users have full visibility into discovery progress and readiness.

## Dependencies

- Feature 65 (Discovery Phase State Machine) - provides phase state
- Feature 66 (AI Model Selection Per Phase) - uses model selection
- Feature 67 (Discovery-to-Requirements Handoff) - displays validation status
- Feature 64 (Discovery Chat State & Logic) - base chat UI
- Feature 63 (Discovery Chat UI Fixes) - UI refinements

## Context To Read First

- `context/ui-rules.md`
- `context/ui-tokens.md`
- `context/ui-registry.md`
- `context/code-standards.md`

## Files Owned

- `components/discovery/PhaseIndicator.tsx` (NEW)
- `components/discovery/ComplexityBadge.tsx` (NEW)
- `components/discovery/ValidationStatus.tsx` (NEW)

## Files

CREATE: `components/discovery/PhaseIndicator.tsx` - displays current phase and progress
CREATE: `components/discovery/ComplexityBadge.tsx` - shows SIMPLE/STANDARD/COMPLEX classification
CREATE: `components/discovery/ValidationStatus.tsx` - shows handoff validation readiness
MODIFY: `components/discovery/DiscoveryChat.tsx` - integrate phase UI components
MODIFY: `stores/discoveryStore.ts` - add phase state management
CREATE: `components/discovery/PhaseIndicator.test.tsx` - test phase display
CREATE: `components/discovery/ValidationStatus.test.tsx` - test validation UI

## Acceptance Criteria

- [ ] Phase indicator shows current phase name and description
- [ ] Progress bar shows phases completed vs total phases
- [ ] Complexity badge displays SIMPLE/STANDARD/COMPLEX with color coding
- [ ] Validation status shows completeness percentage and missing fields
- [ ] "Next Phase" button appears when canAdvance is true
- [ ] "Generate Requirements" button appears when handoff isValid is true
- [ ] Phase transitions update UI immediately
- [ ] All components tested
- [ ] `context/progress-tracker.md` updated to point at Feature 69

## Setup Instructions

No new dependencies. Uses existing UI components and state management.
