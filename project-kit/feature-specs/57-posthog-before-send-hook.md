# Feature 57 - PostHog before_send hook

## Description
Add a `before_send` hook to the PostHog client initialization in `instrumentation-client.ts` that scrubs all automatically captured event and person properties before they are sent to PostHog. This ensures no PII is leaked.

## Files Owned
- `instrumentation-client.ts`

## Out of Scope
- Changing existing analytics event payloads beyond scrubbing.

## Acceptance Criteria
- The `posthog.init` call includes a `before_send` function that receives the event payload, removes or redacts any `properties` and `person_properties`, and returns the sanitized event.
- All existing tests continue to pass.
- `npm run sync:check`, `npm run security:all`, `npm run test`, and `npm run build` succeed.

## Implementation Plan
1. Open `instrumentation-client.ts`.
2. Extend the `posthog.init` configuration object with a `before_send` property.
3. Inside the hook, set `event.properties = {}` and `event.person_properties = {}` (or alternatively delete sensitive keys if any are known).
4. Return the modified event.
5. Run the validation pipeline.

## References
- PostHog SDK documentation for `before_send` hook.
- ARTKINS_STYLE_GUIDE.md for security and privacy requirements.
