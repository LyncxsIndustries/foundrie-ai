# Feature 84 - Refine Canvas & Diagram UI

## Type
ENHANCEMENT

## What This Delivers
Applies Foundrie AI Skills aesthetic to React Flow canvas, elevating system architecture and diagram visuals. Redesigned nodes, styled canvas background, refined edges.

## Dependencies
- Feature 14 (React Flow Canvas)
- Feature 16 (Custom Node Types)
- Feature 17 (Custom Edge Types)
- Feature 66 (Global Theme)

## Context To Read First
- `context/ui-rules.md`
- `project-kit/skills/foundrie-ai-skill/SKILL.md`
- `inspo/*.png`

## Files Owned
None

## Files
MODIFY: `components/canvas/CustomNode.tsx`
MODIFY: `components/canvas/CustomEdge.tsx`
MODIFY: `components/canvas/CanvasBackground.tsx`
MODIFY: `lib/canvas/styles.ts`

## Acceptance Criteria
- [ ] Custom nodes with rounded corners, drop shadows
- [ ] Subtle dot pattern canvas background
- [ ] Animated edge paths with clear arrowheads
- [ ] Minimap integrated into dark theme
- [ ] Node typography precise and readable
- [ ] Tests pass, build succeeds
- [ ] Progress tracker updated to Feature 79
