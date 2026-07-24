# Feature 59 - Liveblocks reset on sign out

## Description
Call `posthog.reset()` on every mount when signed out in `lib/liveblocks/provider.tsx`.

## Feature 57 Defense-in-Depth Note
Feature 57 (PostHog `before_send` global scrub) is the primary privacy guard and already zeros `properties`, `$set`, and `$set_once` on every outbound browser event including any residual `posthog.reset()` or `posthog.identify()` call. This spec (59) adds an explicit reset-at-boundary behavior; the two combine as a two-layer defense. Feature 57 operates on the wire payload; Feature 59 operates on the in-memory PostHog client state at session boundary (signed-out mount).

## Files Owned
- `lib/liveblocks/provider.tsx`

## Out of Scope
- Changes to other Liveblocks providers.

## Acceptance Criteria
- A `useEffect` block in `lib/liveblocks/provider.tsx` calls `posthog.reset()` when the user is signed out.
- `npm run sync:check`, `npm run security:all`, `npm run test`, and `npm run build` succeed.

## Implementation Plan
1. Open `lib/liveblocks/provider.tsx`.
2. Add the `useEffect` block to handle sign out.
3. Run the validation pipeline.
