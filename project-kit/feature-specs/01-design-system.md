# Feature 01 - Design System

## Type

NEW FEATURE

## What This Delivers

The visual and component foundation for the Foundrie app: the Next.js 16 App Router skeleton, the dark workspace token system mapped from `ui-context.md`, the shadcn/ui primitive set, GSAP and Framer Motion wired for motion, and the base working surfaces (dashboard shell, project shell, document review shell, diagram workspace placeholder). After this feature, the app renders Foundrie's dark, diagram-first workspace with consistent tokens and no hardcoded colors.

## Dependencies

- None. This is the first feature.
- Context7 docs for Next.js, Tailwind, shadcn/ui, and GSAP must be checked before implementation.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Next.js `/vercel/next.js`
- Tailwind `/tailwindlabs/tailwindcss.com`
- shadcn/ui `/shadcn-ui/ui`
- GSAP `/websites/gsap`, GSAP React `/greensock/react`

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `app/globals.css`
- `app/layout.tsx` (root layout shell, pre-Clerk)
- `tailwind.config.ts`
- `lib/utils.ts`
- `components/ui/**`
- `design-system.ts` (motion/typography/spacing token contract)
- `vitest.config.mts`, `vitest.setup.ts` (test harness — baked in from the first feature)
- `**/*.test.ts`, `**/*.test.tsx` for files created by this spec

## Files

CREATE: Next.js 16 TypeScript app structure (root-level `app/`, no `src/`) if it does not exist.
CREATE: `app/globals.css` - Foundrie CSS variables from `ui-context.md` color tokens.
CREATE: `tailwind.config.ts` - map CSS variables to Tailwind tokens; add `min-touch` utility (44×44px).
CREATE: `lib/utils.ts` - `cn()` helper.
CREATE: `design-system.ts` - typography, spacing, radius, and motion tokens.
CREATE: base surfaces for dashboard, project shell, document review, and diagram workspace placeholder.
CREATE: Vitest + React Testing Library test harness (`vitest.config.mts`, `vitest.setup.ts`) and unit/component tests for `cn()`, the design-system token contract, the shell/state components, and a base surface.
MODIFY: `app/layout.tsx` - load `next/font`, apply base tokens, accept `children`.
MODIFY: `package.json` - Tailwind v4, shadcn/ui, Lucide React, GSAP, Framer Motion, Vitest test stack, and `test`/`test:watch`/`test:coverage` scripts.

## Implementation Notes

- Use root-level App Router folders. Server components by default.
- Define all colors as CSS custom properties; components must not use raw hex. Keep letter spacing `0`.
- Install shadcn primitives: Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea, DropdownMenu, Tooltip, Badge, Separator, Sheet, Progress, Skeleton.
- Encode motion tokens (durations/easings) in `design-system.ts`; GSAP usage must register plugins at module level, scope with `gsap.context()`, and clean up with `ctx.revert()`.
- Every async surface must have loading (skeleton), error, and empty states. Core Web Vitals targets (LCP < 2.5s, FID < 100ms, CLS < 0.1) apply.
- The product is a dark technical workspace, not a marketing page, once the user is inside the app.

## Out of Scope

- Authentication, database, AI, canvas interactions, diagram generation, ZIP, and research (later features).
- Real diagram nodes/edges (Features 16–17).
- Any business logic.

## Future Modifications

- Feature 02: Auth wraps the root layout in `ClerkProvider`.
- Feature 06: Layout shell adds authenticated navigation.
- Features 14–17: The diagram workspace placeholder becomes the real React Flow canvas.

## Acceptance Criteria

- [ ] Foundrie CSS variables are defined in `globals.css` and mapped through Tailwind.
- [ ] shadcn primitives are installed and render with Foundrie tokens.
- [ ] `cn()` exists in `lib/utils.ts`.
- [ ] Base dashboard, project shell, document review, and diagram workspace placeholder render.
- [ ] No raw hex colors in components outside the token definition.
- [ ] Vitest + React Testing Library harness is configured; `npm run test` runs non-watch and passes; `cn()`, the design-system tokens, the shell/state components, and a base surface are covered.
- [ ] `context/progress-tracker.md` is updated.
- [ ] `npm run build` passes.
- [ ] No TypeScript errors.
- All CodeRabbit reviews must pass. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
