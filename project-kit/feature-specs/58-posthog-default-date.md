# Feature 58 - PostHog default date

## Description
Change the default date in `instrumentation-client.ts` to `2026-05-30`.

## Files Owned
- `instrumentation-client.ts`

## Out of Scope
- Changes to date formatting.
- Enabling session recording or rageclick capture (these are config-presets only; actual enablement is project-level PostHog settings).
- Server-side posthog-node defaults (different SDK, owned by future spec).

## Acceptance Criteria
- The `defaults` property in `posthog.init()` call in `instrumentation-client.ts` is updated to `"2026-05-30"`.
- The value is a valid member of the upstream `ConfigDefaults` union type per Context7 `/posthog/posthog-js` types.
- `npm run sync:check`, `npm run security:all`, `npm run test`, and `npm run build` succeed.

## Implementation Plan
1. Open `instrumentation-client.ts`.
2. Update the `defaults` property value from `"2026-01-30"` to `"2026-05-30"` inside the `posthog.init()` config object.
3. Run the validation pipeline.

## Setup Instructions (external account & API keys)
No new account setup is required by this spec; it only changes a config default. For PostHog account/project creation instructions, see the Feature 57 spec "Setup Instructions" block or `docs/POSTHOG_PRIVACY_IMPLEMENTATION.md`.

## Version Research
- Context7 library checked: `/posthog/posthog-js`
- Context7 query executed: `defaults configuration parameter in posthog.init() function - what is the defaults option, what date format does it accept, and what does it control in the SDK behavior`
- Official source: https://github.com/posthog/posthog-js/blob/main/packages/types/src/posthog-config.ts (ConfigDefaults union), https://github.com/posthog/posthog-js/blob/main/packages/browser/src/posthog-core.ts (defaultsThatVaryByConfig function)
- Valid ConfigDefaults values (from upstream types, ordered newest → oldest): `'2026-06-25' | '2026-05-30' | '2026-01-30' | '2025-11-30' | '2025-05-24' | 'unset'`
- Adopted value: `'2026-05-30'` (2nd newest). Newest `'2026-06-25'` is SKIPPED because it adds `session_recording.streamNetworkBody: true`; streaming network request/response bodies may include sensitive headers/cookies and is unnecessary given the Feature 57 properties wipe. Reassess `'2026-06-25'` only in a future spec that explicitly enables session recording as an opt-in product feature.
- Compatibility notes: `defaults` is a monotonic opt-in mechanism. Every later date INCLUDES all behaviors of all earlier dates plus new ones. Setting `defaults` to `'unset'` or omitting it falls back to legacy (2025-pre) defaults and is NOT supported for Foundrie (would disable `capture_pageview: 'history_change'` from `'2025-05-24'` breaking SPA pageview tracking).

## Context7 Findings — ConfigDefaults Behavior Delta (2026-01-30 → 2026-05-30)
```typescript
// Source: packages/types/src/posthog-config.ts
export type ConfigDefaults = '2026-06-25' | '2026-05-30' | '2026-01-30' | '2025-11-30' | '2025-05-24' | 'unset'
```

Behavior change from `defaultsThatVaryByConfig(defaults)`:
| Config key            | 2026-01-30 value (previous)             | 2026-05-30 value (Feature 58)                                                              |
|-----------------------|-----------------------------------------|---------------------------------------------------------------------------------------------|
| `rageclick`           | `{ content_ignorelist: true }`          | `{ content_ignorelist: DEFAULT_CONTENT_IGNORELIST_WITH_STEPPERS, ignore_text_selection: true }` — suppresses more false positives (stepper clicks, text drags) |
| `session_recording`   | `{ strictMinimumDuration: true }`       | `{ strictMinimumDuration: true, canvasCapture: { resolutionScale: 0.6 } }` — enables <canvas/> capture at 0.6x scale IF session recording is enabled at project level |

Unchanged across both (inherited from earlier dates):
- `capture_pageview`: `'history_change'` (from 2025-05-24) — tracks pushState/replaceState/popstate for SPA
- `strictMinimumDuration` in session recording (from 2025-11-30) — discards sub-threshold recordings

**Privacy-relevant analysis for Foundrie**: Neither rageclick nor session_recording changes weaken the Feature 57 before_send envelope scrub. All three fields (`properties`, `$set`, `$set_once`) are still zeroed on every outbound event. Rageclick and session-recording data live inside the `properties` object on the event envelope and are therefore neutralized by Feature 57 regardless of the defaults preset. The preset upgrade only changes what the SDK would send IF the before_send hook were ever absent; in the actual production configuration, layer 2 of the defense matrix catches everything before the XHR.

## References
- Context7 `/posthog/posthog-js` — posthog-core.ts `defaultsThatVaryByConfig()` and posthog-config.ts `ConfigDefaults` type
- Feature 57 spec `57-posthog-before-send-hook.md` — 3-layer defense table and envelope wipe mechanism
- `research/POSTHOG_CONFIGURATION_AUDIT.md` §3 Default Init Config Values Audit
- `docs/POSTHOG_DEFAULTS_UPGRADE_NOTES.md` — detailed upgrade rationale and rollback procedure
