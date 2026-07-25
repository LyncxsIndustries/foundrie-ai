# PostHog Defaults Preset Upgrade Notes 2026-01-30 → 2026-05-30

- **Upgrade Date**: 2026-07-25
- **Feature Spec**: Feature 58 — PostHog default date
- **Branch**: `feature/58-posthog-default-date`
- **Owner**: Instrumentation / privacy layer (browser-only; server posthog-node unaffected)
- **Research Basis**: Context7 CLI queries against library ID `/posthog/posthog-js` — see `research/POSTHOG_DEFAULTS_PRESET_EVOLUTION.md` for full preset matrix
- **Contract Boundary**: Browser `posthog.init()` in `instrumentation-client.ts` only. This change does NOT touch server SDKs, `before_send` behavior, or any capture-event route handler.

---

## 1. What Changed

### ConfigDefaults union (official upstream posthog-js types)
```typescript
// Source: posthog-js @ packages/types/src/posthog-config.ts
export type ConfigDefaults =
  | '2026-06-25'   // latest — DEFERRED by Feature 58
  | '2026-05-30'   // ADOPTED — Feature 58
  | '2026-01-30'   // previous — replaced
  | '2025-11-30'
  | '2025-05-24'
  | 'unset'
```

### Delta between 2026-01-30 → 2026-05-30
Computed from `defaultsThatVaryByConfig(defaults)` in posthog-js `packages/browser/src/posthog-core.ts`:

| Config field | 2026-01-30 (previous) | 2026-05-30 (current) | User impact |
|---|---|---|---|
| `rageclick` | `{ content_ignorelist: true }` | `{ content_ignorelist: DEFAULT_CONTENT_IGNORELIST_WITH_STEPPERS, ignore_text_selection: true }` | Fewer false-positive `$rageclick` events. Input stepper buttons (`+`/`-` on `<input type=number/>`) and text-selection drags are no longer misclassified as frustration signals. Product analytics funnel/cohort work on rageclick events becomes more accurate. |
| `session_recording` | `{ strictMinimumDuration: true }` | `{ strictMinimumDuration: true, canvasCapture: { resolutionScale: 0.6 } }` | `<canvas/>` elements (diagram React Flow canvas, any future HTML-canvas feature) captured at 60% resolution **IF** session recording is enabled in the PostHog project settings. In Foundrie, `before_send` (Feature 57) zeroes `properties.$snapshot_data` on every event, so no actual canvas pixel data ever reaches PostHog even when recording is enabled. See §3 "Privacy Impact" below. |

### Inherited behaviors (unchanged)
- `capture_pageview: 'history_change'` — from `2025-05-24`; tracks pushState/replaceState/popstate SPA navigation
- `session_recording.strictMinimumDuration: true` — from `2025-11-30`; discards recordings that do not meet minimum session length (reduces noise from single-page bounces)

---

## 2. Why Not 2026-06-25 (Latest Preset)

Newest preset `'2026-06-25'` additionally sets:
```typescript
session_recording: {
  strictMinimumDuration: true,
  canvasCapture: { resolutionScale: 0.6 },
  streamNetworkBody: true,   // ← NEW in 2026-06-25
}
```

**Decision**: DEFER `'2026-06-25'` to a future spec that explicitly enables session recording as an opt-in product feature. Rationale:
1. `streamNetworkBody: true` streams request/response bodies for network events recorded by session recording. This is **irrelevant** given the Feature 57 `properties = {}` wipe, but it adds a new surface area that must be audited and documented for every generated project.
2. Network bodies may contain auth headers, cookies, request IDs, or JSON payloads with PII if a misconfigured project ever simultaneously enables session recording AND removes the before_send wipe (a defense-in-depth failure).
3. No current Foundrie roadmap item requires network-body streaming in session recordings.
4. Any future `2026-06-25` adoption spec MUST simultaneously:
   - Update all four specs 57/58/59/60 defense-in-depth notes
   - Re-run all four gates 1–4 after the change
   - Update this upgrade notes document with the new delta

---

## 3. Privacy Impact Assessment

### Overall conclusion: No change to PII posture
The Feature 57 `before_send` wire-payload scrub operates AFTER `defaultsThatVaryByConfig()` constructs the config. No matter what `rageclick` or `session_recording` preset the SDK uses, all three envelope fields (`properties`, `$set`, `$set_once`) are zeroed before the XHR to `/e/` is constructed.

### Per-upgrade-item privacy evaluation
| Upgrade item | What SDK would normally send | Feature 57 before_send effect | Residual risk |
|---|---|---|---|
| `rageclick.content_ignorelist` expanded | Better-filtered `$rageclick` events in `properties` | `properties = {}` wipe removes the rageclick event's own properties regardless of ignorelist | NONE — no additional PII surfaced |
| `session_recording.canvasCapture` enabled | DOM snapshot data and canvas pixel data in `properties.$snapshot_data` / `properties.$snapshot_bytes` | `properties = {}` wipe empties `$snapshot_data` and `$snapshot_bytes` entirely before XHR | NONE — confirmed in `research/POSTHOG_CONFIGURATION_AUDIT.md` F-07 |
| `streamNetworkBody: true` (deferred, NOT adopted) | Request/response bodies recorded in session recording | Would still be wiped by `properties = {}` but adds documentable surface area | NONE IF adopted; deferred anyway pending explicit session-recording enablement spec |

### Validation checklist after merge
1. **Static code check**: Confirm `cat instrumentation-client.ts | grep -n 'defaults:'` shows exactly one `defaults: "2026-05-30"` and no stray `2026-01-30` or `2026-06-25` literals remain.
2. **Network check (dev)**: Boot `npm run dev`, open DevTools → Network, filter by `/e/`, capture a `$pageview`, confirm body JSON `defaults` reflected config is not present in the payload (SDK uses it only locally), and the three scrub fields are `{}` as always.
3. **Type check**: `npm run build` must pass with TypeScript strict mode — this implicitly confirms the string literal `"2026-05-30"` is assignable to `ConfigDefaults` type when posthog-js types resolve (Next.js build-time type-check of the init call).
4. **Runtime check (non-prod only)**: Set `debug: true` in a dev-only throwaway edit, confirm no SDK console warnings about "invalid defaults value" are emitted, then revert the debug flag before committing.

---

## 4. Rollback Procedure

If any post-upgrade regression is detected (unlikely — preset is monotonic), rollback is a single-line revert:

```bash
# On the affected branch, edit instrumentation-client.ts
# Line 19:
- defaults: "2026-05-30",
+ defaults: "2026-01-30",

# Then re-run all four gates:
npm run sync:check
npm run security:all
npm run test
npm run build
```

Rollback does NOT require any changes to `before_send`, feature specs 57/59/60, or generated files — it only reverts the rageclick/session-recording preset to their Jan-30 state. The expanded Feature 58 defense-in-depth notes in specs 59/60 remain correct even on rollback (they describe a four-layer scenario where layer 3 is benign even when not active).

### Post-rollback contract cleanup (only if rollback becomes permanent)
If the rollback is permanent (not just hotfix-then-retry), also revert these documentation/audit artifacts:
1. `research/POSTHOG_CONFIGURATION_AUDIT.md` §3 defaults row back to the 2026-01-30 value + note the rollback reason
2. `project-kit/context/library-docs.md` `### defaults preset policy` section — retain the table but mark "Currently reverted; 2026-05-30 not in use"
3. Feature 58 spec Version Research — append "Rollback: YYYY-MM-DD, reason: <reason>"
4. Progress tracker session notes — record the rollback

---

## 5. Generated Project Impact

Every project ZIP exported by Foundrie that includes PostHog MUST inherit:
1. `defaults: "2026-05-30"` in their generated `instrumentation-client.ts`
2. This `POSTHOG_DEFAULTS_UPGRADE_NOTES.md` file copied to the generated project's `docs/` folder
3. The full `research/POSTHOG_DEFAULTS_PRESET_EVOLUTION.md` copied to the generated project's `research/` folder
4. The four-spec defense-in-depth layering (57/58/59/60 patterns) adapted to the generated project's equivalent instrumentation file
5. The 2026-06-25 deferral rationale preserved as a note — generated projects should NOT blindly adopt the latest preset; they should only upgrade the defaults date on a future spec that explicitly documents the delta

---

## 6. References

- [AGENTS.md Hard Rule 0 (Contract Synchronization Gate)](../../AGENTS.md)
- [instrumentation-client.ts](../../instrumentation-client.ts) line 19
- [Feature 58 spec](../project-kit/feature-specs/58-posthog-default-date.md)
- [Feature 57 spec](../project-kit/feature-specs/57-posthog-before-send-hook.md) (before_send wipe)
- [research/POSTHOG_CONFIGURATION_AUDIT.md](../research/POSTHOG_CONFIGURATION_AUDIT.md) §3 + §5.2
- [research/POSTHOG_DEFAULTS_PRESET_EVOLUTION.md](../research/POSTHOG_DEFAULTS_PRESET_EVOLUTION.md) (full preset matrix)
- Context7 library ID `/posthog/posthog-js` — sources for ConfigDefaults + defaultsThatVaryByConfig
