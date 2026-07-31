# Feature 60 - Liveblocks identify scrub

## Description
Remove raw email/name from the `posthog.identify` call in `lib/liveblocks/provider.tsx`.

## Feature 57 Defense-in-Depth Note
Feature 57 (PostHog `before_send` global scrub) is the primary privacy guard and already zeros `properties`, `$set`, and `$set_once` on every outbound browser event, including payloads emitted by `posthog.identify()`. This spec (60) scrubbing at the identify call site acts as defense-in-depth **Layer 1**. Layer 1 = call-site scrub (Feature 60); Layer 2 = wire-payload scrub (Feature 57); Layer 3 = session-boundary reset (Feature 59). Even if layer 1 or 3 fails to execute on an edge case, layer 2 still removes all PII before the payload leaves the browser.

## Feature 58 Defense-in-Depth Note
Feature 58 bumps `defaults: "2026-01-30"` → `defaults: "2026-05-30"` which upgrades `rageclick` (fewer false positives) and `session_recording` (canvas capture at 0.6x). Full four-layer privacy matrix with all four specs active:

| Layer | Spec | Mechanism | Scope | What happens if this layer fails |
|---|---|---|---|---|
| 1 | 60 | No email/name in `identify()` person props | `$set` at identify call site | Layer 2 still wipes |
| 2 | 57 | `before_send` zeroes `properties`/`$set`/`$set_once` | EVERY browser event envelope | Only layers 1/3/4 run; PII LEAK RISK → this is why layer 2 CANNOT be weakened |
| 3 | 58 | `defaults` preset enables canvas capture at 0.6x AND improved rageclick ignorelist | Session recording config only (project-level enablement still required) | No PII leak if session recording is not enabled; even if it is, layer 2 still wipes `$snapshot_data` per audit F-07 |
| 4 | 59 | Unconditional `posthog.reset()` on every signed-out mount (not gated on React ref) | Persistence + in-memory PostHog identity (`distinct_id`, `$user_state`) | Layer 2 still wipes residual events; if reset is skipped (e.g. provider unmounted before Clerk `isLoaded`), stale persistence can survive until next signed-out mount (layer 2 still covers wire) |

The Feature 58 `defaults` bump is safe because layer 2 is the wire boundary and is unchanged by the preset upgrade. No changes to the `before_send` hook are required for Feature 58 compatibility.

## Dependencies
- Feature 57 (PostHog before_send hook) — primary wire-payload privacy guard; this spec adds identify call-site scrub only.
- Existing Liveblocks provider in `lib/liveblocks/provider.tsx` (prior Liveblocks features).

## Future Modifications
- none.

## Setup Instructions (external account & API keys)
No new external account or API-key setup is required by this spec. It only removes raw email/name from the existing `posthog.identify` call site. Liveblocks and PostHog credentials remain owned by their prior setup specs.

## Files Owned
- `lib/liveblocks/provider.tsx`

## Out of Scope
- Modifying other PostHog events.

## Acceptance Criteria
- The `posthog.identify` call in `lib/liveblocks/provider.tsx` is scrubbed of raw email/name.
- `npm run sync:check`, `npm run security:all`, `npm run test`, and `npm run build` succeed.

## Implementation Plan
1. Open `lib/liveblocks/provider.tsx`.
2. Scrub the identify call.
3. Run the validation pipeline.

## Version Research
- Context7 library checked: `/posthog/posthog-js`
- Context7 query executed: `identify userPropertiesToSet empty properties omit email name privacy person properties $set`
- Secondary product docs: `/posthog/posthog.com` — identifying users / person properties / reset after logout
- Official source: https://github.com/posthog/posthog-js/blob/main/packages/browser/src/posthog-core.ts (`identify`), https://github.com/posthog/posthog-js/blob/main/packages/types/src/posthog.ts
- Signature: `identify(new_distinct_id?: string, userPropertiesToSet?: Properties, userPropertiesToSetOnce?: Properties): void`
  - `userPropertiesToSet` is written to `$set` on the `$identify` capture envelope (and `setPersonProperties` on re-identify).
  - Empty `{}` / omitted props → no PII in `$set`. Empty-string `email`/`name` matches progress-tracker contract ("pass an empty name and email") and overwrites any prior person props that may have been set before Feature 60.
- Companion API: `group(groupType, groupKey, groupPropertiesToSet?)` — workspace/org attributes belong on groups, **not** on the person record via `identify`. This provider has no workspace context; do not invent a `group()` call here.
- Adopted call:
  ```typescript
  posthog.identify(user.id, { email: "", name: "" });
  ```

## Context7 Findings — Identify Call-Site Scrub (Feature 60)

| Scenario | Pre-Feature-60 | Feature 60 |
|----------|----------------|------------|
| Signed-in identify | `$set.email` / `$set.name` from Clerk | `$set.email=""` / `$set.name=""` — no raw PII |
| Layer 2 `before_send` (Feature 57) | Still wipes `$set` on the wire | Unchanged — defense in depth |
| Workspace attributes | N/A in this file | Out of scope; use `posthog.group()` in workspace-aware call sites later |
| Distinct id | Clerk `user.id` | Unchanged — identity linking without PII props |

**Privacy-relevant analysis**: Feature 60 is Layer 1 (call-site). Even if Layer 2 is temporarily broken, identify no longer seeds person profiles with email/name. Empty strings are preferred over omitting the object so any stale `$set.email` from pre-60 sessions gets overwritten on next identify (SDK passes `userPropertiesToSet` into `$set`).

## Agent Skills Required
- `posthog-instrumentation` (existing) — identify/capture/reset patterns
- `verify-posthog-instrumentation` (existing, installed Feature 59) — post-deploy verification
- `check-posthog-loading` (existing, installed Feature 59) — SDK load checks
- `liveblocks-best-practices` (existing) — provider ownership boundary (`lib/liveblocks/provider.tsx`)
- `clerk-nextjs-patterns` (existing) — `useUser()` contract
- Context7 CLI (`context7-cli` skill) — mandatory before any PostHog/Clerk/Liveblocks API change
