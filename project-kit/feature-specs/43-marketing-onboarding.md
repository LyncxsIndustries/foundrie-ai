# Feature 43 - Marketing & Onboarding Surface

## Type

NEW FEATURE

## What This Delivers

Foundrie's public front door and the 60-second first-value onboarding: the marketing landing page, the pricing page, and the new-project entry that gets a signed-in user from "What are you building?" to the first discovery question fast. Marketing surfaces use GSAP for Awwwards-level motion; the app itself stays a calm dark workspace.

## Dependencies

- Feature 01 (Design System) and Feature 02 (Auth) must be complete.
- Feature 04 (Project CRUD) provides project creation used by the new-project flow.

## Context To Read First

- `context/project-overview.md`
- `context/ui-context.md`
- `context/architecture-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Next.js `/vercel/next.js`
- GSAP `/websites/gsap`, GSAP React `/greensock/react`
- shadcn/ui `/shadcn-ui/ui`

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `app/(marketing)/page.tsx`
- `app/(marketing)/pricing/page.tsx`
- `app/(marketing)/layout.tsx`
- `components/marketing/**`
- `app/(app)/projects/new/page.tsx`

## Files

CREATE: `app/(marketing)/layout.tsx`, `app/(marketing)/page.tsx`, `app/(marketing)/pricing/page.tsx`.
CREATE: `components/marketing/**` - hero, feature sections, pricing table.
CREATE: `app/(app)/projects/new/page.tsx` - the "What are you building?" entry that creates a project and redirects to discovery.
MODIFY: `context/progress-tracker.md` - mark feature progress.

## Implementation Notes

- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens) is also baked into the generated projects, ensuring they are premium products.


- The landing page communicates the product: idea → diagram-first architecture → ZIP a coding agent can build. Use GSAP for entrance/scroll motion (register plugins at module level, `useLayoutEffect`, `gsap.context()`, `ctx.revert()`, transform/opacity + `force3D`). Keep `/`, `/pricing`, `/sign-in(.*)`, `/sign-up(.*)` public per the middleware matcher.
- The pricing page renders the tier table (FREE / PRO / TEAM / ENTERPRISE) from the documented plan model. This is a marketing surface only; Stripe checkout and billing enforcement are out of scope for v1 (later billing feature). Plan gating at runtime uses `canUseFeature()` from Feature 04.
- 60-second first value: a signed-in user lands on a single clear CTA, types a project description, and reaches the first discovery question quickly. The new-project flow calls `POST /api/projects`, then redirects to the discovery phase. Show progress ("Phase 1 of 8") once in the workspace.
- Marketing surfaces meet Core Web Vitals targets (LCP < 2.5s, CLS < 0.1); lazy-load heavy motion components.

## Out of Scope

- Stripe checkout, billing enforcement, and the customer portal (later billing feature).
- Progressive-disclosure feature unlocks beyond the initial flow.
- Blog/docs marketing content.

## Future Modifications

- Later billing feature: the pricing CTA wires to Stripe Checkout and `canUseFeature()` becomes subscription-backed.
- Feature 51: marketing can surface a "Connect GitHub" CTA for repo-connected sessions.

## Acceptance Criteria

- [ ] The landing and pricing pages render publicly with GSAP motion and dark-theme tokens.
- [ ] The pricing table reflects FREE/PRO/TEAM/ENTERPRISE without implying live billing.
- [ ] A signed-in user can create a project from the new-project entry and is redirected to discovery.
- [ ] The workspace shows the active discovery phase.
- [ ] Marketing pages meet the Core Web Vitals acceptance targets.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
