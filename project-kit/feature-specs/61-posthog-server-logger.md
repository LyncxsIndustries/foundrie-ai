# Feature 61 - PostHog server logger

## Description
Replace `console.warn` with `logger.warn` in `lib/posthog-server.ts`. Wrap capture calls in try/catch and log via `logger.error`.

## Files Owned
- `lib/posthog-server.ts`

## Out of Scope
- Changes to the client logger.

## Acceptance Criteria
- `lib/posthog-server.ts` uses `logger.warn` and `logger.error` for error handling and warnings.
- `npm run sync:check`, `npm run security:all`, `npm run test`, and `npm run build` succeed.

## Implementation Plan
1. Open `lib/posthog-server.ts`.
2. Replace console warns and add try/catch blocks.
3. Run the validation pipeline.
