# 04 - Project CRUD

## Type

NEW FEATURE

## Goal

Build the first user-owned API surface: Clerk webhook user sync, auth helpers, plan/admin helpers, and project create/list/read/update/delete APIs with strict ownership scoping. Dashboard UI is intentionally limited to the smallest wiring needed to prove project data can be created and listed.

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

## Implementation

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
- Create `GET/PATCH/DELETE /api/projects/[projectId]`.
- Every route calls `requireAuth()` before reading or mutating user data.
- Every project read/update/delete query includes both project identity and authenticated local `user.id`.
- Never accept or trust `userId` from request body, search params, or route params.
- Return 404, not 403, when a project is missing or belongs to another user.
- Use `deleteMany({ where: { id: projectId, userId: user.id } })` or equivalent for deletes.
- In `POST /api/projects`, count existing projects for the authenticated user and call `canCreateProject()` before creating.
- Return a 403 upgrade response only for plan-limit failures on the authenticated user's own request.
- Use `dbWrite` for create/update/delete and any read-after-write response.
- Use cursor pagination for project lists; never use offset pagination.
- Use `select` for dashboard project lists and include denormalized counters instead of counting diagrams/specs with per-row queries.
- Order dashboard project lists by `updatedAt` using the `[userId, updatedAt]` index from Feature 03.
- Avoid N+1 queries when loading project summary data.

### Minimal Dashboard Wiring

- Build dashboard project list.
- Build create project flow from raw idea.
- Redirect new projects to the discovery phase.

## Scope Limits

- Do not implement later feature specs early.
- Do not introduce undocumented architecture changes.
- Do not bypass the storage, auth, AI, or Context7 rules in the context files.
- Do not build billing checkout, upgrade UI beyond the API error, admin dashboards, team workspaces, project-level roles, RLS, ABAC, or audit logs.
- Do not add search, sorting controls, pagination UI, project sharing, project duplication, or delete confirmation polish unless a later spec asks for it.

## Check When Done

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
- No team RBAC, custom admin portal, RLS, ABAC, or audit logging is added.
- `context/progress-tracker.md` is updated.
- `npm run build` passes once application code exists.
