# Feature 56 - PostHog token guard

## Description
Add a client guard around line 10 in `instrumentation-client.ts` to reject sentinel tokens, and update `.env.example` to make the placeholder empty and reorder it.

## Files Owned
- `instrumentation-client.ts`
- `.env.example`

## Out of Scope
- Changing PostHog logic on the server.

## Acceptance Criteria
- `.env.example` placeholder is empty and reordered.
- `instrumentation-client.ts` rejects sentinel tokens.
- `npm run sync:check`, `npm run security:all`, `npm run test`, and `npm run build` succeed.

## Implementation Plan
1. Edit `.env.example` lines 29-30.
2. Edit `instrumentation-client.ts` to add the client guard.
3. Run the validation pipeline.
