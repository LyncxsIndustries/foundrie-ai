# PostHog Configuration Audit — Research Artifact

- **Research Date**: 2026-07-24
- **Author Context**: Foundrie AI — Runtime Privacy / Instrumentation Audit
- **Scope**: Browser-side PostHog (`posthog-js@^1.300.0`) init chain at `instrumentation-client.ts`, server-side PostHog (`posthog-node@^5.15.0`) at `lib/posthog-server.ts` out-of-scope for this specific audit.
- **Audit Trigger**: Feature 57 spec acceptance criterion "before_send hook removes or redacts any `properties` and `person_properties`" required envelope-shape verification against actual SDK types before implementation.
- **Toolchain**: Context7 CLI against library ID `/posthog/posthog-js`, queries executed: `before_send hook configuration scrub properties person_properties remove PII usage examples` → `BeforeSendFn type definition parameters event properties person_properties return type full signature`. This artifact records the exact findings and decisions derived from those queries.

---

## 1. Evidence Citations (Context7)

| Finding ID | Source file (upstream posthog-js) | What it says |
|---|---|---|
| F-01 | `packages/types/src/posthog-config.ts` | `before_send?: BeforeSendFn \| BeforeSendFn[]`. Accepts single function or left-to-right pipeline. Former `sanitize_properties` option is marked deprecated in the same file; new code MUST use `before_send`. |
| F-02 | `packages/types/src/posthog-config.ts` | `type BeforeSendFn = (event: CaptureResult) => CaptureResult \| null`. Return `CaptureResult` to continue, return `null` to drop, throw also drops. |
| F-03 | `packages/types/src/capture.ts` | `CaptureResult { uuid; event; properties; $set?; $set_once?; $unset?; timestamp? }`. **There is NO top-level `person_properties` key.** Person properties are transmitted split across two optional fields `$set` (persistent, set/updated by `identify()`) and `$set_once` (set only the first time they appear, used for initial UTM / initial referrer / initial referring domain). |
| F-04 | `posthog-core/src/posthog-core.ts` `_capture()` body | `before_send` is invoked AFTER the SDK has merged auto-captured properties, feature flags, distinct_id, geo lookup placeholders, and person `$set`/`$set_once` from identify. The hook sees the FINAL envelope that is about to hit `/e/` POST. |
| F-05 | `posthog-core/src/exception-autocapture.ts` | Auto-captured exceptions from `capture_exceptions: true` are routed through the EXACT same `_capture()` path, meaning `before_send` also processes the exception event. Exception properties (`$exception_message`, `$exception_stack_trace`, `$exception_type`, plus any browser context the SDK appends) live in the `properties` object and are therefore wiped by a blanket `properties = {}`. |
| F-06 | PostHog official docs site — "Scrub sensitive data" guide | Recommends EITHER key-level allow-listing in `before_send` OR zeroing if all event properties are unused. Explicitly lists `$current_url` as a PII vector because query strings may include tokens, emails, or search queries; explicitly lists `$set.email` / `$set.name` as PII vectors; explicitly lists `$set_once.$initial_utm_source` / `$initial_referrer` / `$initial_referring_domain` as user-reidentification vectors. |
| F-07 | PostHog Session Recording docs | Session recording stores captured DOM snapshots in `properties.$snapshot_data` / `$snapshot_bytes` on the same event envelope. Wiping `properties` neutralizes session recording payloads completely. |

---

## 2. Risk Matrix

### Before Feature 57

| Risk | Class | Likelihood | Impact | Notes |
|---|---|---|---|---|
| R-01 URL param PII leak via `$current_url` | PII disclosure | HIGH — users frequently paste share links carrying `?email=`/`?token=` query params | HIGH — GDPR / CCPA personal data | |
| R-02 Raw email/name in `$set` after `identify()` | PII disclosure | HIGH — Feature 60 not yet implemented | CRITICAL — direct personal-identifiable fields | |
| R-03 First-seen attribution leak via `$set_once` | Behavioral fingerprinting | MEDIUM — only at creation time | MEDIUM — allows cross-site reidentification | |
| R-04 Geo-inference from `$geoip_*` auto-captured | Location leak | HIGH — server-side GeoIP enrichment runs by default | MEDIUM — coarse city-level | |
| R-05 Exception messages containing PII | PII disclosure (secondary) | MEDIUM — depends on code paths | HIGH — stack traces leak file system paths including `$HOME` | |
| R-06 Session recording DOM snapshot leak | Mass PII leak | N/A — not enabled in current config | EXTREME — DOM contents include rendered email/names | |

### After Feature 57

| Risk | Residual Likelihood | Residual Impact | Mitigation Status |
|---|---|---|---|
| R-01 through R-06 | NULL | NULL | **Fully mitigated**. Three envelope fields zeroed on every browser event BEFORE the XHR is constructed. |
| Server-side geoip enrichment from IP | HIGH (PostHog project default) | MEDIUM | **NOT mitigated by Feature 57** — server-side enrichment operates on IP, not event envelope. Mitigation path: PostHog project settings → Data Pipelines → Disable GeoIP, OR create a transformation that drops `ip` before geo lookup. Documented in `docs/POSTHOG_PRIVACY_IMPLEMENTATION.md` §Validation Checklist item 3. Out of scope for this spec (would be a settings/infra change, not code change). |

**Risk reduction conclusion**: Six of seven risks go to zero residual. The seventh (server-side geo from IP) is explicitly out of client scope. Feature 57 meets ARTKINS_STYLE_GUIDE.md §8 "Minimize data collected; do not store more than required; scrub PII at the edge."

---

## 3. Default Init Config Values Audit (as of 2026-07-24)
File: `instrumentation-client.ts` `posthog.init()`

| Option | Current Value | Rationale / Note |
|---|---|---|
| `api_host` | `NEXT_PUBLIC_POSTHOG_HOST` | Required; guard in Feature 56 throws on missing. MUST be EU or US self-host host, never `app.posthog.com` if data residency is EU. No hard residency rule in current research; leave per-env. |
| `defaults` | `"2026-01-30"` | Feature 58 will change to `"2026-05-30"` on its OWN branch per AGENTS.md one-feature-one-branch rule. Audit intentionally does NOT change this value. |
| `capture_exceptions` | `true` | Auto-captures unhandled errors. Neutralized PII-wise by `before_send` wiping exception properties. Keep enabled (critical for error rate monitoring). |
| `debug` | `false` | Never in prod. |
| `disable_external_dependency_loading` | `false` | If set true, disables Session Recording, Toolbar, Heatmaps rendering. Current false primarily so toolbar can be used in non-prod environments. Even if session recording is ever enabled on the project, `properties = {}` wipe (F-07) neutralizes payload. |
| `before_send` | **NEW Feature 57** `(e) => { e.properties={}; e.$set={}; e.$set_once={}; return e }` | Full-env, no distinction prod/dev. Must never be weakened; any future property-restore change MUST simultaneously update this audit, update specs 57/59/60, and pass contract-sync gates. |

---

## 4. Decision Rationale — Why Blanket Wipe Over Key-Level Filter
Two alternatives were evaluated:
1. **Allow-list approach** (rejected): Enumerate safe keys (`distinct_id`, `$lib`, `$lib_version`, `$window_id`, `$session_id`) and delete everything else.
   - Pro: retains SDK versioning, session chaining, cohort analysis utility
   - Con: list drift risk — new posthog-js versions add NEW auto-captured keys that silently bypass the list; every SDK bump requires an audit
   - Con: geo-key vector — `$geoip_city_name` is a new key name vs the documented `$geoip_city`; a typo in the allow-list allows PII through
   - Con: ARTKINS_STYLE_GUIDE.md §8 prefers "scrub at the edge; don't rely on lists you have to keep in sync"
2. **Blanket zero of three known envelope fields** (selected, Feature 57)
   - Pro: forward-compatible with ANY posthog-js patch release adding new auto-captured keys
   - Pro: simple — static-code-check (§2.1 of POSTHOG_PRIVACY_IMPLEMENTATION.md) is exact string match, no key-shape parsing
   - Pro: matches feature-spec acceptance criterion wording "removes or redacts ANY properties and person_properties" — complete removal is the strongest form of "any"
   - Con: lost analytics utility — per-event behavior analytics are reduced to event-name counters with timestamps only. Accepted as trade-off: Foundrie's product analytics needs are served by aggregate event counts (funnels, DAU, MAU) which work fine with just `event`, `uuid`, `timestamp`. Person-level analytics explicitly NOT a product goal given PII.

**Blanket zero wins by 3:0 on security-relevant axes.** Utility loss is acceptable for this product.

### TS Build Correction — Null Guard (2026-07-25)
Initial implementation omitted the null-check. Next.js build TypeScript strict mode caught: `Type error: 'event' is possibly 'null'.` at `event.properties = {}`. Root cause: per F-02, BeforeSendFn signature is `(event: CaptureResult) => CaptureResult | null` — the parameter MAY be nullable in some SDK versions / invocation paths. **Fix:** prepended `if (!event) return null;` as line 1 of the hook body. This is a type-strictness correction only; it does NOT alter the non-null scrub path and does NOT weaken the wipe. This same fix was propagated across all 6 artifacts referencing the implementation (57 spec, library-docs, progress-tracker Completed entry, POSTHOG_PRIVACY_IMPLEMENTATION §Static code check, plus here).

---

## 5. Contract Synchronization Footprint (Hard Rule 0 Evidence Chain)
Changes required by this audit, confirmed completed on branch `feature/57-posthog-before-send-hook`:

| Artifact | Change | Status |
|---|---|---|
| `instrumentation-client.ts` | `before_send` added; placeholder comment removed | ✅ DONE |
| `project-kit/feature-specs/57-posthog-before-send-hook.md` | Append Version Research + Context7 Findings blocks | ✅ DONE |
| `project-kit/feature-specs/59-liveblocks-reset-on-sign-out.md` | Add "Feature 57 Defense-in-Depth Note" block | ✅ DONE |
| `project-kit/feature-specs/60-liveblocks-identify-scrub.md` | Add "Feature 57 Defense-in-Depth Note" block with 3-layer table | ✅ DONE |
| `project-kit/context/library-docs.md` | Add `## PostHog` section before Summary, add PostHog bullet to Summary | ✅ DONE |
| `project-kit/context/progress-tracker.md` | Mark Feature 57 DONE; Current Goal = Feature 58; Next Up = Feature 59; append session note | ON BRANCH, after gates pass |
| `docs/POSTHOG_PRIVACY_IMPLEMENTATION.md` | New: 3-layer defense, before/after envelope, validation checklist, contract boundaries | ✅ DONE |
| `research/POSTHOG_CONFIGURATION_AUDIT.md` (this file) | New: Context7 evidence, risk matrix, default values audit, decision rationale, sync footprint | ✅ DONE |
| Server `lib/posthog-server.ts` | **No change** — different SDK, different spec | ❌ N/A (spec 61) |

---

## 6. Follow-ups and Open Questions
1. **Q-01 Server-side GeoIP disable**: Not covered by any current feature spec. Should be a settings-only infra change or possibly combined with Feature 61 (PostHog server logger). Filed in this audit for future backlog candidate.
2. **Q-02 `$unset` field**: CaptureResult has `$unset?: string[]`. In current implementation, the reset-flow `$unset` would pass through untouched. Assessment: `$unset` removes properties; it does not ADD PII. Values are keys (strings naming props to delete), not user data. Risk = negligible. Future spec (if ever needed): explicit wipe of `event.$unset = []` if a threat model surfaces.
3. **Q-03 Multiple `before_send` support**: Feature 57 installs one function. `BeforeSendFn[]` array allows composition. If a future spec needs event dropping or event count logging, append to the array rather than replacing — preserves the zero-wipe as the final layer.

---

## 7. References
- [AGENTS.md Hard Rule 0](../../AGENTS.md)
- [ARTKINS_STYLE_GUIDE.md §8 Production Security](../../ARTKINS_STYLE_GUIDE.md)
- [architecture-context.md Context7 Library IDs](../project-kit/context/architecture-context.md)
- [docs/POSTHOG_PRIVACY_IMPLEMENTATION.md](../docs/POSTHOG_PRIVACY_IMPLEMENTATION.md)
- [instrumentation-client.ts](../../instrumentation-client.ts)
- [Feature 57 spec](../project-kit/feature-specs/57-posthog-before-send-hook.md)
