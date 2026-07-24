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

## Version Research
- Context7 library checked: `/posthog/posthog-js`
- Context7 query executed: `before_send hook configuration scrub properties person_properties remove PII usage examples` followed by `BeforeSendFn type definition parameters event properties person_properties return type full signature`
- Official install / type source: https://github.com/posthog/posthog-js/blob/main/packages/types/src/posthog-config.ts (BeforeSendFn declaration), https://github.com/posthog/posthog-js/blob/main/packages/types/src/capture.ts (CaptureResult interface)
- Selected package version in project: `posthog-js@^1.300.0` (package.json), `posthog-node@^5.15.0`
- Compatibility notes: `before_send` is the CURRENTLY RECOMMENDED API; `sanitize_properties` is DEPRECATED per PostHog config types. Person properties in the browser event envelope are NOT transmitted as a top-level `person_properties` field — they travel as `$set` (persistent person props) and `$set_once` (first-seen-only person props: initial UTM, initial referrer). Any full person-property scrub MUST zero both fields.
- Reason for three-field wipe: CaptureResult envelope from Context7 contains `properties` (event-level auto-captured fields: $current_url, $pathname, $browser, $os, $geoip_*, $referrer, UTM params, any custom PII leaked into URL), `$set` (ongoing person properties: email, name set via identify), `$set_once` (first-seen person properties: `$initial_utm_source`, `$initial_referrer`, `$initial_referring_domain`). Zeroing only `properties` and a notional top-level `person_properties` would leave `$set` / `$set_once` person PII in the outbound payload. The three-field wipe is the minimal change that satisfies the feature-spec wording "removes or redacts any `properties` and `person_properties`" against the actual SDK envelope.

## Context7 Findings — BeforeSendFn & CaptureResult Shape
```
before_send?: BeforeSendFn | BeforeSendFn[]
type BeforeSendFn = (event: CaptureResult) => CaptureResult | null
interface CaptureResult {
  uuid: string
  event: EventName
  properties: Properties    // event-level auto-captured + custom
  $set?: Properties          // person properties (persisted)
  $set_once?: Properties     // person properties (set-once)
  $unset?: string[]
  timestamp?: Date
}
```
Returning `null` drops the event. Returning the mutated event continues with the scrubbed payload. Arrays form a left-to-right chain. Throws also drop the event.
Implementation used (includes mandatory null-guard to satisfy BeforeSendFn `event` parameter possibly being `null`):
```
before_send: (event) => {
  if (!event) return null
  event.properties = {}
  event.$set = {}
  event.$set_once = {}
  return event
}
```
