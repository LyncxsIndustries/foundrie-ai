# Feature 59 - Liveblocks reset on sign out

## Description
Call `posthog.reset()` on every mount when signed out in `lib/liveblocks/provider.tsx`.

## Feature 57 Defense-in-Depth Note
Feature 57 (PostHog `before_send` global scrub) is the primary privacy guard and already zeros `properties`, `$set`, and `$set_once` on every outbound browser event including any residual `posthog.reset()` or `posthog.identify()` call. This spec (59) adds an explicit reset-at-boundary behavior; the two combine as a two-layer defense. Feature 57 operates on the wire payload; Feature 59 operates on the in-memory PostHog client state at session boundary (signed-out mount).

## Feature 58 Defense-in-Depth Note
Feature 58 (PostHog `defaults` preset bump to `"2026-05-30"`) upgrades `session_recording` configuration from `{ strictMinimumDuration: true }` → `{ strictMinimumDuration: true, canvasCapture: { resolutionScale: 0.6 } }` and `rageclick` ignorelist. If session recording is ever enabled at the PostHog project level, canvas elements (diagram canvas, future HTML canvases) will be captured, AND the Feature 57 `before_send` `properties = {}` wipe simultaneously zeros `$snapshot_data` before the payload leaves the browser (confirmed in `research/POSTHOG_CONFIGURATION_AUDIT.md` F-07). This spec's `posthog.reset()` also clears the in-memory recording state at sign-out, adding a fourth layer: (1) no-email-at-identify (spec 60), (2) wire-payload scrub (spec 57), (3) canvas-capture-enabled-by-defaults (spec 58, benign due to layer 2), (4) in-memory state reset (spec 59).

## Dependencies
- Feature 57 (PostHog before_send hook) — primary wire-payload privacy guard; this spec adds session-boundary reset only.
- Existing Liveblocks provider in `lib/liveblocks/provider.tsx` (prior Liveblocks features).

## Future Modifications
- none.

## Setup Instructions (external account & API keys)
No new external account or API-key setup is required by this spec. It only calls `posthog.reset()` in the existing Liveblocks provider. Liveblocks and PostHog credentials remain owned by their prior setup specs.

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
