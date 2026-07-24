# Feature 57 - PostHog before_send hook

## Description
Add a `before_send` hook to the PostHog client initialization in `instrumentation-client.ts` that scrubs all automatically captured event and person properties before they are sent to PostHog. This ensures no PII is leaked.

## Files Owned
- `instrumentation-client.ts`

## Out of Scope
- Changing existing analytics event payloads beyond scrubbing.

## Acceptance Criteria
- The `posthog.init` call includes a `before_send` function that receives the event payload and scrubs all three actual browser CaptureResult envelope fields — `properties`, `$set`, and `$set_once` — to empty objects `{}`. Person properties in posthog-js travel as `$set` (persisted person props written by identify) and `$set_once` (first-seen-only person props such as initial UTM / initial referrer); there is no top-level `person_properties` key in the real browser CaptureResult (Context7: `/posthog/posthog-js` `CaptureResult` declaration confirmed this envelope shape). The semantic intent "removes or redacts any `properties` and `person_properties`" is therefore satisfied by zeroing all three fields.
- Falsy / null `event` input returns `null` (mandatory null-guard; `BeforeSendFn` parameter may be `null` per posthog-js types; TS strict mode enforces this).
- All existing tests continue to pass.
- A focused regression test verifies: null-input drop + populated-event three-field scrub.
- `npm run sync:check`, `npm run security:all`, `npm run test`, and `npm run build` succeed.

## Implementation Plan
1. Open `instrumentation-client.ts`.
2. Extend the `posthog.init` configuration object with a `before_send` property.
3. Line 1 of the hook body: `if (!event) return null;` — mandatory null-guard.
4. Inside the hook body (non-null path): set `event.properties = {}`, `event.$set = {}`, `event.$set_once = {}`. Person props are split across $set and $set_once in the actual SDK envelope; there is no top-level `event.person_properties` field to zero.
5. Return the mutated event.
6. Add `instrumentation-client.before_send.test.ts` regression test covering null-input and populated three-field scrub.
7. Run the validation pipeline.

## Setup Instructions (external account & API keys)
**Authoritative guard / sentinel-check and `.env.example` placeholder handling are owned by **Feature 56 — PostHog token guard** (see `project-kit/feature-specs/56-posthog-token-guard.md`, Files Owned: `instrumentation-client.ts` + `.env.example`). Follow that spec for sentinel-token guard and `.env.example` edits.

For any AI agents implementing this spec or any downstream PostHog-bearing spec:

1. **Create a PostHog account** (if none): browse to https://posthog.com and click Sign up) — free tier is sufficient for Foundrie-style projects with <1M events/month.
2. **Create a new project** inside your PostHog organization; pick the correct region for your data-residency requirement (US vs EU). Project name: e.g. "Foundrie AI Production".
3. **Retrieve project credentials** from PostHog → Project → Settings → Project variables:
   - **Project Token** — value is `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` in your env file (browser-visible; prefix `NEXT_PUBLIC_` is required for Next.js to bundle it).
   - **Project API Key** — value is `POSTHOG_API_KEY` (server-only; posthog-node only; DO NOT prefix with NEXT_PUBLIC).
   - **API Host** — from the same Settings card, copy the "Client" host URL; this is `NEXT_PUBLIC_POSTHOG_HOST` (EU self-host or US `https://us.i.posthog.com`, EU `https://eu.i.posthog.com`; never `app.posthog.com` which is the UI dashboard).
4. Paste the three values into `.env.local` (dev) or your deployment platform's env-var panel; never commit them.
5. PostHog project → Project Settings → Data Pipelines: (optional, recommended) disable **Server-side GeoIP enrichment** if even coarse city-level inference from IP is unwanted; this eliminates the one privacy-relevant server-side enrichment that runs outside the browser envelope wipe of the current client before_send scrub in this spec.
6. Project settings → Ingestion filter events endpoint: run `npm run dev` once to boot Foundrie, open DevTools → Network, and verify `/e/` POSTs are accepted (HTTP 200) and payload bodies have `properties: {} / $set: {} / $set_once: {}`.

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
