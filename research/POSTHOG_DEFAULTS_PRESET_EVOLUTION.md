# PostHog ConfigDefaults Preset Evolution — Research Matrix

- **Research Date**: 2026-07-25
- **Context7 Library ID**: `/posthog/posthog-js`
- **Context7 Queries Executed**:
  1. `defaults configuration parameter in posthog.init() function - what is the defaults option, what date format does it accept, and what does it control in the SDK behavior`
- **Primary Sources**:
  - posthog-js `packages/types/src/posthog-config.ts` — `ConfigDefaults` union type
  - posthog-js `packages/browser/src/posthog-core.ts` — `defaultConfig()` + `defaultsThatVaryByConfig()`
- **Purpose**: Full research matrix mapping every dated preset to every config-behavior delta. This artifact is used by Feature 58 (adopting 2026-05-30) and by any future spec that considers adopting a newer preset. It is also copied verbatim into every generated project ZIP under `research/` so downstream RUWA agents can audit preset decisions without re-running Context7.
- **Monotonicity guarantee** (from upstream source comments in posthog-core.ts): A later-dated preset ALWAYS includes EVERY behavior change from all earlier presets, plus its own new changes. The partial order is:
  `unset < 2025-05-24 < 2025-11-30 < 2026-01-30 < 2026-05-30 < 2026-06-25`

---

## 1. Full Preset × Config-Field Matrix

Legend:
- ✅ = this behavior is ON for this preset and all later presets
- — = this behavior is NOT defined by the preset (uses upstream defaultConfig)
- N/A = this config field is not varied by any preset (constant)

| Config field that varies | unset / legacy | 2025-05-24 | 2025-11-30 | 2026-01-30 | 2026-05-30 | 2026-06-25 |
|---|---|---|---|---|---|---|
| **capture_pageview** | `true` | `'history_change'` ✅ | `'history_change'` ✅ | `'history_change'` ✅ | `'history_change'` ✅ | `'history_change'` ✅ |
| **session_recording.strictMinimumDuration** | `false` | — | `true` ✅ | `true` ✅ | `true` ✅ | `true` ✅ |
| **rageclick** | `true` | — | `{ content_ignorelist: true }` ✅ | `{ content_ignorelist: true }` ✅ | `{ content_ignorelist: DEFAULT_CONTENT_IGNORELIST_WITH_STEPPERS, ignore_text_selection: true }` ✅ | `{ content_ignorelist: DEFAULT_CONTENT_IGNORELIST_WITH_STEPPERS, ignore_text_selection: true }` ✅ |
| **session_recording.canvasCapture** | absent | — | — | — | `{ resolutionScale: 0.6 }` ✅ | `{ resolutionScale: 0.6 }` ✅ |
| **session_recording.streamNetworkBody** | absent | — | — | — | — | `true` ✅ |
| **split_storage** | upstream default | — | — | — | — | — |
| **persistence_save_debounce_ms** | upstream default | — | — | — | — | — |
| **external_scripts_inject_target** | upstream default | — | — | — | — | — |
| **internal_or_test_user_hostname** | upstream default | — | — | — | — | — |
| **detect_google_search_app** | upstream default | — | — | — | — | — |
| **disable_capture_url_hashes** | upstream default | — | — | — | — | — |

### Notes on non-varied fields
The last five rows above are declared as return-type keys of `defaultsThatVaryByConfig()` but are currently set to the same value across every preset branch in the upstream implementation. They exist in the type signature as reserved slots for future preset evolution. A future posthog-js release MAY change one or more of these fields for a new dated preset without Foundrie adopting the new date yet. This is safe: if Foundrie stays on `'2026-05-30'` and posthog-js adds a `2026-09-01` preset that toggles `split_storage`, the `'2026-05-30'` path in `defaultsThatVaryByConfig()` continues to return the same value it returned before the bump. The preset mechanism isolates Foundrie from opt-in behavioral drift.

---

## 2. Per-Preset Behavior Descriptions

### 2.1 `unset` (legacy — do NOT use)
- `capture_pageview: true` — captures only full page loads. SPA navigation via pushState/replaceState is NOT captured automatically.
- No rageclick filtering; no session-recording strict minimum; no canvas capture.
- **Reason for deprecation**: Any Foundrie-generated web project that uses Next.js App Router is an SPA. Setting `defaults: undefined` (or omitting it) means most navigation between routes is not tracked as pageviews. Funnels are broken.

### 2.2 `2025-05-24` (minimum supported baseline)
- **capture_pageview**: `'history_change'` — initial page load + pushState + replaceState + popstate all fire a `$pageview`.
- This is the OLDEST preset that works correctly for SPAs.
- No session recording strict minimum, no rageclick filtering, no canvas capture.

### 2.3 `2025-11-30`
Everything from 2025-05-24, PLUS:
- **session_recording.strictMinimumDuration: true** — short recordings that do not meet a minimum duration threshold are discarded. This reduces noise from single-click bounces and accidental-open-immediate-close traffic.
- **rageclick: { content_ignorelist: true }** — common interactive elements that frequently trigger false-positive rageclick detection are ignored. A predefined "content ignorelist" (SDK internal list of CSS selectors) is applied.

### 2.4 `2026-01-30` (previous Foundrie — pre-Feature-58)
Everything from 2025-11-30, PLUS:
- No new fields; 2026-01-30 is effectively a rename/rollup of 2025-11-30 with identical `defaultsThatVaryByConfig()` output in the current SDK version.
- Upstream commit notes indicate 2026-01-30 was originally intended to carry additional fields that were later pushed forward to 2026-05-30; in the current tree, it behaves identically to 2025-11-30.
- **This is why Feature 58 was a small edit**: the code behavior delta between 2026-01-30 and 2026-05-30 is exactly the two items (rageclick upgrade, canvasCapture) from §1; everything else is already inherited from 2025-11-30.

### 2.5 `2026-05-30` (current Foundrie — Feature 58)
Everything from 2026-01-30, PLUS:
- **rageclick: { content_ignorelist: DEFAULT_CONTENT_IGNORELIST_WITH_STEPPERS, ignore_text_selection: true }** —
  - `content_ignorelist: DEFAULT_CONTENT_IGNORELIST_WITH_STEPPERS` extends the base ignorelist to include number-input stepper buttons (the up/down `+`/`-` widgets on `<input type="number"/>`). Users rapidly clicking a stepper to adjust a numeric value were previously misflagged as frustrated, skewing rageclick metrics.
  - `ignore_text_selection: true` — click-drag sequences that resolve into a browser text-selection action are no longer counted as rageclick candidates. This is the dominant source of false positives on long-form or documentation-heavy pages.
- **session_recording.canvasCapture: { resolutionScale: 0.6 }** —
  - If session recording is ENABLED AT THE PROJECT LEVEL in PostHog settings, HTML `<canvas/>` elements in the DOM are captured in the recording at 60% of their natural device-pixel resolution.
  - 60% is a deliberate compromise between visual clarity and payload size. At 100% scale, canvas recordings of diagram-rich apps (like Foundrie's React Flow canvas) balloon recording payloads into multi-MB-per-minute ranges that stress the user's upload bandwidth. At 40% or below, diagram text becomes unreadable when reviewing recordings. 60% is the default recommended in PostHog's internal preset.
  - **Foundrie-specific privacy note**: Even with this config field set, the Feature 57 `before_send` wipes `properties.$snapshot_data` before the XHR is sent. No actual canvas pixel data leaves the browser.

### 2.6 `2026-06-25` (latest — DEFERRED by Feature 58)
Everything from 2026-05-30, PLUS:
- **session_recording.streamNetworkBody: true** —
  - Network request/response bodies captured by session recording are STREAMED during the recording session rather than batched at the end.
  - This reduces memory pressure on long sessions and prevents tab-crash OOMs when a session spans > 100 network requests with large JSON payloads.
  - **Deferral rationale**: Foundrie has no current roadmap item that enables session recording as an opt-in product feature. Streaming network bodies is performance-only; it changes nothing about WHAT is captured, only HOW it is transmitted. Adopting it now would:
    1. Force documentation of the network-body surface across all generated projects
    2. Increase audit burden for every downstream generated project
    3. Add no product benefit since session recording is not enabled by default in any project template
  - **Adoption trigger**: Adopt `2026-06-25` in a future spec that explicitly enables session recording UI + project-settings opt-in, with full contract-sync footprint across specs 57/58/59/60, docs, and research artifacts.

---

## 3. Preset Selection Decision Tree

For Foundrie itself or for a generated project deciding what `defaults` value to use:

```text
Start: Does the project need SPA pageview tracking?
  ├─ No (static HTML / multi-page server-rendered): Use 2025-05-24 minimum
  └─ Yes (Next.js / React Router / any SPA): MUST use 2025-05-24 or later
        │
        ▼
  Does the project use session recording at the PostHog project level?
  ├─ No: any preset ≥ 2025-05-24 is fine; adopt the latest that does NOT add unnecessary surface area → 2026-05-30
  └─ Yes:
        │
        ▼
      Is session stability (no OOM on >100 network requests) critical?
      ├─ No → 2026-05-30 (simpler audit surface)
      └─ Yes → 2026-06-25 (streamNetworkBody on; document the network-body surface)
```

### Foundrie-specific decision
Foundrie currently does NOT enable session recording in its production PostHog project settings (instrumentation is event-name-count telemetry only). Session recording would require a privacy-policy update, user-facing opt-in UI, and an explicit spec enabling the feature. Therefore: **Feature 58 selects 2026-05-30** per the middle branch of the tree.

---

## 4. Preset Audit Checklist for Future Specs

Any future spec that proposes a preset change (forward roll OR rollback) MUST:
1. [ ] Update this matrix file with the new preset's behavior delta
2. [ ] Update `docs/POSTHOG_DEFAULTS_UPGRADE_NOTES.md` with the delta and rollback procedure
3. [ ] Update `research/POSTHOG_CONFIGURATION_AUDIT.md` §3 defaults row
4. [ ] Update Feature 57/59/60 defense-in-depth notes (specs 57/59/60) to reference the new layering
5. [ ] Update `project-kit/context/library-docs.md` `### defaults preset policy` sub-section
6. [ ] Update `instrumentation-client.ts` line 19
7. [ ] Run all four gates 1–4 before any commit
8. [ ] IF the preset touches `session_recording.streamNetworkBody`, also add a threat-model note on network-body capture and confirm `before_send` property wipe covers the new envelope fields

---

## 5. References

- [AGENTS.md Hard Rule 0 (Contract Synchronization Gate)](../../AGENTS.md)
- [docs/POSTHOG_DEFAULTS_UPGRADE_NOTES.md](../docs/POSTHOG_DEFAULTS_UPGRADE_NOTES.md) (Feature 58 upgrade)
- [research/POSTHOG_CONFIGURATION_AUDIT.md](./POSTHOG_CONFIGURATION_AUDIT.md) §3 default values + §5.2 sync footprint
- [Feature 58 spec](../project-kit/feature-specs/58-posthog-default-date.md) Context7 Findings block
- Context7 library ID: `/posthog/posthog-js`
- Upstream type source: https://github.com/posthog/posthog-js/blob/main/packages/types/src/posthog-config.ts
- Upstream behavior source: https://github.com/posthog/posthog-js/blob/main/packages/browser/src/posthog-core.ts (search for `defaultsThatVaryByConfig`)
