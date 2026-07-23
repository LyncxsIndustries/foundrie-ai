# Feature 60 - Liveblocks identify scrub

## Description
Remove raw email/name from the `posthog.identify` call in `lib/liveblocks/provider.tsx`.

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
