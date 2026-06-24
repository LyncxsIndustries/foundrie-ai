# 02 - Authentication Foundation

## Type

NEW FEATURE

## What This Delivers

Foundrie has the minimal Clerk session foundation: Clerk is installed, the root app is wrapped with `ClerkProvider`, public sign-in/sign-up routes exist, and app/API routes are protected by default. This feature does not touch the database because the Prisma schema is created in Feature 03.

## Dependencies

- Feature 01 (`01-design-system.md`) must be complete for root layout styling.
- Clerk application keys must be available in environment variables.
- Context7 docs for Clerk must be checked before implementation.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Clerk `/clerk/clerk-docs`
- Next.js `/vercel/next.js`

Use installed Context7 skills or:

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `middleware.ts`
- `app/(auth)/**`

## Files

CREATE: `middleware.ts` - Clerk route protection using `clerkMiddleware` and `createRouteMatcher`.
CREATE: `app/(auth)/sign-in/[[...sign-in]]/page.tsx` - Clerk sign-in component.
CREATE: `app/(auth)/sign-up/[[...sign-up]]/page.tsx` - Clerk sign-up component.
MODIFY: `app/layout.tsx` - Wrap children in `ClerkProvider`.
MODIFY: `.env.example` - Add Clerk publishable and secret keys.
MODIFY: `package.json` - Add Clerk dependency if not already present.

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.


- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens, executable `npm run security:all` gates) is also baked into the generated projects, ensuring they are premium products.


- Use root-level Next.js 16 App Router folders. Do not create a `src/` directory.
- Public routes are `/`, `/pricing`, `/sign-in(.*)`, `/sign-up(.*)`, and `/api/webhooks/clerk`.
- Protect every other app/API route by default.
- Keep Clerk appearance minimal and mapped to Foundrie tokens where the current design system supports it.
- Do not create local users, auth utilities, plan gates, admin helpers, or webhooks yet.

## Out of Scope

- Project CRUD.
- Clerk webhook user sync.
- Local `User` lookup helpers.
- User avatar menu and logout UI.
- Plan gate helpers and admin helpers.
- Billing or payment integration.
- Upgrade prompts.
- Team/organization workspaces.
- Project owner/editor/viewer RBAC.
- Custom admin dashboard.
- PostgreSQL Row-Level Security, ABAC, audit logging, hardware-key admin controls.
- Any AI, canvas, diagram, or ZIP behavior.

## Future Modifications

- Feature 03: Database schema will add local `User`, `User.plan`, `User.role`, `UserPlan`, and `UserRole`.
- Feature 04: Project CRUD will add Clerk webhook sync, `requireAuth()`, user ownership scoping, and `canCreateProject()`.
- Feature 06: App shell can add authenticated navigation once layout exists.
- Later billing feature: Plan gates can become Stripe-backed without changing ownership rules.
- Later collaboration feature: Team or project-level RBAC can be introduced only after the product has collaboration requirements.

## Quality Gates

- Run `npm run test` and ensure it passes.
- Run `npm run build` and ensure it passes.
- Run `npm run security:all` and ensure it passes before push.

## Acceptance Criteria

- [ ] `app/layout.tsx` wraps the application in `ClerkProvider`.
- [ ] `middleware.ts` protects all non-public routes by default.
- [ ] Sign-in and sign-up pages render Clerk components.
- [ ] No database code, webhook code, local user sync, plan gates, or admin helpers are introduced in this feature.
- [ ] No custom admin portal, team RBAC, RLS, ABAC, or audit logging exists.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes once application code exists.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
