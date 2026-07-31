# Feature 61 - PostHog server logger

## Description
Replace `console.warn` with `logger.warn` in `lib/posthog-server.ts`. Wrap capture calls in try/catch and log via `logger.error`.

## Files Owned
- `lib/posthog-server.ts`

## Out of Scope
- Changes to the client logger.

## Setup Instructions (external account & API keys)
No new external account or API-key setup is required by this spec. It only replaces `console.warn`/`console` error paths with the structured `logger` in the existing PostHog server module. PostHog server credentials remain owned by their prior setup specs.

## Feature 60 Dependency Note
Feature 60 scrubbed client `posthog.identify` person props to empty `email`/`name` in `lib/liveblocks/provider.tsx`. This Feature 61 file owns **server** logging only (`lib/posthog-server.ts` / `posthog-node`). Do not reintroduce client identify PII here. Server capture payloads must remain PII-free by construction (no client `before_send` on the Node SDK).

## Acceptance Criteria
- `lib/posthog-server.ts` uses `logger.warn` and `logger.error` for error handling and warnings.
- `npm run sync:check`, `npm run security:all`, `npm run test`, and `npm run build` succeed.

## Implementation Plan
1. Open `lib/posthog-server.ts`.
2. Replace console warns and add try/catch blocks.
3. Run the validation pipeline.
