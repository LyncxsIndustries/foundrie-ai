# Feature 80 - Refine Modals & Dialogs

## Type
ENHANCEMENT

## What This Delivers
Overhauls all modals, dialogs, slide-overs with modern glassmorphism and motion. Backdrop-blur filters, GSAP spring animations, focus management.

## Dependencies
- Feature 10 (Discovery Chat modal)
- Feature 66 (Global Theme)
- Feature 01 (Design System)

## Context To Read First
- `context/ui-rules.md`
- `context/ui-registry.md`
- `project-kit/skills/foundrie-ai-skill/SKILL.md`

## Files Owned
None

## Files
MODIFY: `components/ui/dialog.tsx`
MODIFY: `components/ui/modal.tsx`
MODIFY: `components/discovery/DiscoveryModal.tsx`
CREATE: `lib/animations/modal.ts`

## Acceptance Criteria
- [ ] Backdrop-blur glassmorphism
- [ ] GSAP spring entry/exit animations
- [ ] Focus trap management
- [ ] Keyboard accessibility (Esc to close)
- [ ] Smooth overlay transitions
- [ ] Tests pass, build succeeds
- [ ] Progress tracker updated to Feature 75
