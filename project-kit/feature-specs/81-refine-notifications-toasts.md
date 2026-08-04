# Feature 81 - Refine Notifications & Toasts

## Type
ENHANCEMENT

## What This Delivers
Revamps global toast notification system to feel responsive and polished. Stacking mechanism, slide-in/slide-out physics animations, semantic colors.

## Dependencies
- Feature 66 (Global Theme)
- Feature 01 (Design System)

## Context To Read First
- `context/ui-tokens.md`
- `context/ui-registry.md`
- `project-kit/skills/foundrie-ai-skill/SKILL.md`

## Files Owned
- `components/ui/toast.tsx`
- `components/ui/toaster.tsx`

## Files
MODIFY: `components/ui/toast.tsx`
MODIFY: `components/ui/toaster.tsx`
MODIFY: `lib/toast.ts`

## Acceptance Criteria
- [ ] Stacking toast mechanism (no overlaps)
- [ ] Slide-in/slide-out physics-based animations
- [ ] Semantic colors (success, error, warning, info)
- [ ] Auto-dismiss with progress indicator
- [ ] Pause on hover
- [ ] Tests pass, build succeeds
- [ ] Progress tracker updated to Feature 82
