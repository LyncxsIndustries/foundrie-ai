# Feature 59 - Liveblocks reset on sign out

## Description
Call `posthog.reset()` on every mount when signed out in `lib/liveblocks/provider.tsx`.

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
