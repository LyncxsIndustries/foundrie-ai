# Feature 58 - PostHog default date

## Description
Change the default date in `instrumentation-client.ts` to `2026-05-30`.

## Files Owned
- `instrumentation-client.ts`

## Out of Scope
- Changes to date formatting.

## Acceptance Criteria
- The constant definition in `instrumentation-client.ts` is updated to `2026-05-30`.
- `npm run sync:check`, `npm run security:all`, `npm run test`, and `npm run build` succeed.

## Implementation Plan
1. Open `instrumentation-client.ts`.
2. Update the default date constant.
3. Run the validation pipeline.
