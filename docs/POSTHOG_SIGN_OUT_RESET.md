# PostHog Sign-Out Reset — Feature 59

## File Ownership
- Owner: Foundrie runtime privacy / instrumentation
- Implementation file: `lib/liveblocks/provider.tsx`
- Related specs: Feature 57 (`before_send`), Feature 58 (`defaults`), Feature 59 (this file), Feature 60 (`identify` scrub)

## What Changed
On every Clerk-resolved signed-out mount of `LiveblocksReactProvider`, call `posthog.reset()` **unconditionally**, then clear the local `identifiedUserId` ref.

### Before (bug)
```typescript
if (!isSignedIn || !user) {
  if (identifiedUserId.current) { // misses cold mount with persisted identity
    posthog.reset();
    identifiedUserId.current = null;
  }
  return;
}
```

### After (Feature 59)
```typescript
if (!isSignedIn || !user) {
  posthog.reset();
  identifiedUserId.current = null;
  return;
}
```

## Why (Context7 `/posthog/posthog-js`)
- `reset(reset_device_id?: boolean): void` clears `persistence` and `sessionPersistence`, sets `$user_state` to anonymous, and assigns a new anonymous `distinct_id`.
- Identified `distinct_id` survives page refreshes until `reset()` runs.
- Official product docs (`/posthog/posthog.com` identify-reset snippet): call `posthog.reset()` on logout so shared devices do not merge users.

Adopted: `posthog.reset()` without `true` (preserve `$device_id`). Device rotation is out of scope.

## Validation Checklist
1. Unit tests in `lib/liveblocks/provider.test.tsx` — signed-out mount with null ref calls `reset()` exactly once; loading state does not call reset; sign-out after identify calls reset; user-switch resets then identifies.
2. Manual: sign in → confirm identify → sign out → reload signed-out route → PostHog persistence should show anonymous `$user_state` / new `distinct_id`.
3. Hard Rule 0 gates: `sync:check` → `security:all` → `test` → `build`.

## Generated Project Impact
Generated apps that install PostHog + Clerk MUST bake the same rule into their auth-boundary provider: unconditional `posthog.reset()` on signed-out mount after auth `isLoaded`, documented in exported `docs/` and `research/`, with Context7 citation for `/posthog/posthog-js`.

## Agent Skills
- `posthog-instrumentation`, `verify-posthog-instrumentation`, `check-posthog-loading`
- `liveblocks-best-practices`, `clerk-nextjs-patterns`, `context7-cli`

## References
- Feature 59 spec: `project-kit/feature-specs/59-liveblocks-reset-on-sign-out.md`
- Research: `research/POSTHOG_SIGN_OUT_RESET.md`
- Privacy matrix: `docs/POSTHOG_PRIVACY_IMPLEMENTATION.md`
- Upstream: https://github.com/posthog/posthog-js/blob/main/packages/browser/src/posthog-core.ts
