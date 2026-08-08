# Feature 74 - Landing Page Animations

## Type
ENHANCEMENT

## What This Delivers
Redesigns the landing page with complex, advanced GSAP animations for an Awwwards-winning first impression. Implements smooth scrolling, micro-interactions, and creative motion design.

## Dependencies
- Feature 01 (Design System) - GSAP already wired
- Feature 66 (Global Theme) - color tokens
- Foundrie AI Skills - animation patterns

## Context To Read First
- `context/ui-tokens.md`
- `context/ui-rules.md`
- `project-kit/skills/foundrie-ai-skill/SKILL.md`
- `inspo/*.png`

## Files Owned
- `app/(marketing)/page.tsx`
- `components/marketing/HeroSection.tsx`
- `components/marketing/AnimatedFeatures.tsx`

## Files
MODIFY: `app/(marketing)/page.tsx`
CREATE: `components/marketing/HeroSection.tsx`
CREATE: `components/marketing/AnimatedFeatures.tsx`
CREATE: `lib/animations/landing.ts`

## Acceptance Criteria
- [ ] GSAP ScrollTrigger animations on scroll
- [ ] Smooth parallax effects
- [ ] Micro-interactions on all interactive elements
- [ ] Performance: 60fps animations
- [ ] Mobile-optimized animations
- [ ] Tests pass, build succeeds
- [ ] Progress tracker updated to point at Feature 75
