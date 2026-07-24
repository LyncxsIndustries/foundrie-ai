# Feature 60 - Liveblocks identify scrub

## Description
Remove raw email/name from the `posthog.identify` call in `lib/liveblocks/provider.tsx`.

## Feature 57 Defense-in-Depth Note
Feature 57 (PostHog `before_send` global scrub) is the primary privacy guard and already zeros `properties`, `$set`, and `$set_once` on every outbound browser event, including payloads emitted by `posthog.identify()`. This spec (60) scrubbing at the identify call site acts as defense-in-depth **Layer 1**. Layer 1 = call-site scrub (Feature 60); Layer 2 = wire-payload scrub (Feature 57); Layer 3 = session-boundary reset (Feature 59). Even if layer 1 or 3 fails to execute on an edge case, layer 2 still removes all PII before the payload leaves the browser.

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
