# Feature 75 - Dashboard Project Cards UI

## Type
ENHANCEMENT

## What This Delivers
Upgrades dashboard UI and project cards to premium aesthetics matching inspiration screenshots. Perfect opacity, rounded corners, hover states, modern typography.

## Dependencies
- Feature 04 (Project CRUD)
- Feature 66 (Global Theme)
- Feature 06 (Layout Shell)

## Context To Read First
- `context/ui-tokens.md`
- `context/ui-registry.md`
- `project-kit/examples/floria-full.webp`
- `inspo/*.png`

## Files Owned
None - modifies existing dashboard files

## Files
MODIFY: `app/dashboard/page.tsx`
MODIFY: `components/project/ProjectCard.tsx`
MODIFY: `components/project/ProjectGrid.tsx`

## Acceptance Criteria
- [ ] Premium card design with glassmorphism
- [ ] Perfect hover states with smooth transitions
- [ ] Strict design system token usage
- [ ] Responsive grid layout
- [ ] Empty states with custom illustrations
- [ ] Tests pass, build succeeds
- [ ] Progress tracker updated to point at Feature 76
