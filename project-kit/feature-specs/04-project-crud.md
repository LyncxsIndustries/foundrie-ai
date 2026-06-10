# Feature 04 - Project CRUD

## Type

NEW FEATURE

## What This Delivers

The first user-owned API surface: Clerk webhook user sync, auth helpers, plan/admin helpers, and project create/list/read/update/delete APIs with strict ownership scoping. Dashboard UI is limited to the smallest wiring needed to prove project data can be created and listed.

## Dependencies

- Feature 02 (Auth) and Feature 03 (Database Schema) must be complete.
- Clerk webhook secret and `ADMIN_EMAILS` must be available in environment variables.

## Files Owned

- `app/api/webhooks/clerk/route.ts`
- `app/api/projects/route.ts`
- `app/api/projects/[projectId]/route.ts`
- `lib/auth/get-auth-user.ts`
- `lib/auth/require-auth.ts`
- `lib/auth/plan-limits.ts`
- `lib/auth/is-admin.ts`
- `lib/projects/slug.ts`

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Next.js `/vercel/next.js`
- Clerk `/clerk/clerk-docs`
- Svix webhooks `/svix/svix-webhooks`
- Prisma `/prisma/web`

Use installed Context7 skills or:

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files

CREATE: `app/api/webhooks/clerk/route.ts` - Svix-verified Clerk webhook for local user sync.
CREATE: `app/api/projects/route.ts` - Project list and create routes.
CREATE: `app/api/projects/[projectId]/route.ts` - Project read, update, and delete routes.
CREATE: `lib/auth/get-auth-user.ts` - Clerk session to local user lookup.
CREATE: `lib/auth/require-auth.ts` - Shared route auth guard.
CREATE: `lib/auth/plan-limits.ts` - Plan limits and `canCreateProject()`.
CREATE: `lib/auth/is-admin.ts` - `ADMIN_EMAILS` helper.
CREATE: `lib/projects/slug.ts` - Slug generation helper.
MODIFY: `.env.example` - Add `CLERK_WEBHOOK_SECRET` and `ADMIN_EMAILS`.
MODIFY: `app/(app)/dashboard/page.tsx` - Minimal project list/create wiring if the dashboard shell exists.
MODIFY: `context/progress-tracker.md` - Mark feature progress after implementation.

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract (schema fields or relations, route signatures, helper signatures, AI task names or callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, or file ownership), update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch. Do not leave future specs with stale names, old API shapes, or invalid fields.


- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens) is also baked into the generated projects, ensuring they are premium products.


### Auth Utilities and User Sync

- Create `app/api/webhooks/clerk/route.ts`.
- Verify `svix-id`, `svix-timestamp`, and `svix-signature` before touching the database.
- Handle Clerk `user.created`, `user.updated`, and `user.deleted`.
- New users default to `plan: FREE` and `role: USER`.
- Create `lib/auth/get-auth-user.ts`.
- Create `lib/auth/require-auth.ts`.
- Create `lib/auth/plan-limits.ts` with `PLAN_LIMITS` and `canCreateProject()`.
- Create `lib/auth/is-admin.ts` using the `ADMIN_EMAILS` environment variable.

### Project API

- Create `GET /api/projects`.
- Create `POST /api/projects` with slug generation.
  - default missing project name to "Untitled Project".
  - use the schema’s existing ID strategy, do not add sequential IDs.
  - Use the authenticated Clerk user ID as ownerId.
- Create `GET/PATCH/DELETE /api/projects/[projectId]`.
- Every route calls `requireAuth()` before reading or mutating user data.
- Every project read/update/delete query includes both project identity and authenticated local `user.id`.
- Never accept or trust `userId` from request body, search params, or route params.
- Security constraints:
  - unauthenticated requests return 401.
  - only the project owner can rename or delete.
  - non-owner mutations return 403.
  - Ownership failures (not found or not owner on read) return 404, not 403.
- Use `deleteMany({ where: { id: projectId, userId: user.id } })` or equivalent for deletes.
- In `POST /api/projects`, count existing projects for the authenticated user and call `canCreateProject()` before creating.
- Return a 403 upgrade response only for plan-limit failures on the authenticated user's own request.
- Use `db` for create/update/delete and any read-after-write response.
- Use cursor pagination for project lists; never use offset pagination.
- Use `select` for dashboard project lists and include denormalized counters instead of counting diagrams/specs with per-row queries.
- Order dashboard project lists by `updatedAt` using the `[userId, updatedAt]` index from Feature 03.
- Avoid N+1 queries when loading project summary data.

### Minimal Dashboard Wiring

- Build dashboard project list.
- Build create project flow from raw idea.
- Redirect new projects to the discovery phase.
- Keep this backend-only. Do not wire the UI yet.

## Out of Scope

- Do not implement later feature specs early.
- Do not introduce undocumented architecture changes.
- Do not bypass the storage, auth, AI, or Context7 rules in the context files.
- Do not build billing checkout, upgrade UI beyond the API error, admin dashboards, PostgreSQL RLS, ABAC, or audit logs.
- Do not add search, sorting controls, pagination UI, project sharing, project duplication, or delete confirmation polish unless a later spec asks for it.
- Collaboration (Features 35-42) extends project access to Collaborators but is not part of this spec.

## Acceptance Criteria

- The feature works within its defined scope.
- Relevant library docs were checked with Context7.
- Types are strict and external input is validated.
- Access control is enforced where data is read or mutated.
- Clerk webhook rejects invalid Svix signatures.
- Local users sync from Clerk create/update/delete events.
- `getAuthUser()` maps Clerk session to the local `User`; it never accepts request-provided user IDs.
- `requireAuth()` is used by project routes.
- Project list returns only the authenticated user's projects.
- Project detail/update/delete returns 404 for another user's project ID.
- Project delete is owner-scoped and cannot delete another user's project.
- Project creation enforces `canCreateProject()` before writing.
- Plan-limit failures return a 403 with `upgradeRequired: true`; ownership failures return 404.

- `project-kit/context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- `npm run build` passes once application code exists.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.

## Future Modifications

- Feature 35: Adds `ProjectMember` schema for Owner/Collaborator roles.
- Feature 36: Refactors ownership checks to use `requireProjectOwner()` and `requireProjectMember()` helpers.
- Feature 39: Extends `GET /api/projects` to include shared projects in the dashboard.
