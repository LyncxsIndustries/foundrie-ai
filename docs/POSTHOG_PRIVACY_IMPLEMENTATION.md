# PostHog Privacy Implementation — Foundrie AI Runtime

## File Ownership
- Owner: Foundrie runtime operations team
- Consumed by: Runtime on-call, code reviewers evaluating any instrumentation-client.ts change, release QA performing PII-leak regression testing
- Related specs: Feature 56 (token guard, gate), Feature 57 (before_send global scrub, THIS FILE), Feature 59 (sign-out reset, boundary), Feature 60 (identify call-site scrub)

## Three-Layer Privacy Defense
All browser-sourced PostHog events pass through three cooperating layers before any payload reaches the network. A failure in any single layer is mitigated by the remaining two.

| Layer | Spec # | Point of execution                     | What it removes                                                                           |
|-------|--------|----------------------------------------|-------------------------------------------------------------------------------------------|
| 1     | 60     | `posthog.identify()` call site         | No email / name / raw user attributes are passed at invoker time                          |
| 2     | 57     | `posthog.init()` global `before_send`  | Envelope fields `properties`, `$set`, `$set_once` zeroed to `{}` on EVERY browser event  |
| 3     | 59     | signed-out `lib/liveblocks/provider.tsx` mount | In-memory PostHog person state cleared via `posthog.reset()`                    |

**Layer 2 (this file's subject) is the data-plane gate**. Layer 1 and 3 are control-plane mitigations; even if both fail (identify accidentally emits PII, reset not called on a provider unmount edge case), layer 2 still zeros every outbound browser payload.

## Event Envelope Schema — Pre-57 vs Post-57
Source: Context7 `/posthog/posthog-js` — CaptureResult interface from `packages/types/src/capture.ts`.

### Pre-Feature-57 (all browser events before this branch merged)
```json
{
  "uuid": "evt_123",
  "event": "$pageview",
  "properties": {
    "$current_url": "https://foundrie.ai/projects/proj_abc/discovery?email=leaked@example.com",
    "$pathname": "/projects/[projectId]/discovery",
    "$browser": "Chrome",
    "$browser_version": "125.0",
    "$os": "Linux",
    "$device_type": "Desktop",
    "$screen_height": 1200,
    "$screen_width": 1920,
    "$referrer": "$direct",
    "$referring_domain": "",
    "$geoip_country_code": "US",
    "$geoip_region_name": "California",
    "$geoip_city": "San Francisco",
    "$geoip_latitude": 37.7749,
    "$geoip_longitude": -122.4194,
    "$time": 1784920000,
    "utm_source": "twitter",
    "projectId": "proj_abc"
  },
  "$set": {
    "email": "leaked@example.com",
    "name": "Leaked User",
    "userId": "user_xyz"
  },
  "$set_once": {
    "$initial_utm_source": "twitter",
    "$initial_referrer": "https://t.co/abcd",
    "$initial_referring_domain": "t.co"
  },
  "timestamp": "2026-07-24T00:00:00.000Z"
}
```

### Post-Feature-57 (every browser event)
```json
{
  "uuid": "evt_123",
  "event": "$pageview",
  "properties": {},
  "$set": {},
  "$set_once": {},
  "timestamp": "2026-07-24T00:00:00.000Z"
}
```

Only event identity (`event`, `uuid`, `timestamp`) is retained. These fields carry no PII.

## Exceptions Coverage
`capture_exceptions: true` is enabled in `posthog.init()`. Uncaught errors and `$exception` synthetic events ALSO pass through the same `before_send` hook. The blanket `properties = {}` wipe removes:
- Error message (may contain PII: variable values, URLs, file paths with usernames)
- Stack trace lines (file system paths, source map URIs)
- Browser-provided context (exception line, column, column numbers typically benign but attached auto-properties wiped)

No separate `onXHRError` or sanitization hook is required.

## Session Recording Coverage
If PostHog session recording is ever enabled in the future, recorded data inside the event envelope appears as auto-captured properties (`$snapshot_bytes`, `$snapshot_data`, `$ce_time`, `$snapshot_source`). Because Feature 57 wipes the entire `properties` object unconditionally, session-recording payloads — including any DOM snapshots, keystrokes, network requests, field inputs captured by the recorder — would ALSO be zeroed out before leaving the browser. This means session recording CANNOT collect real user data unless layer 2 is explicitly weakened (rejected by this spec).

## Validation Checklist
This checklist must pass on every PR that touches `instrumentation-client.ts` or `lib/liveblocks/provider.tsx`:

1. **Static code check** — `before_send` exists in `posthog.init()` and body contains EXACTLY, in this order:
   - `if (!event) return null` (mandatory null-guard — BeforeSendFn parameter can be `null` per posthog-js types; TypeScript strict mode enforces this)
   - `event.properties = {}`
   - `event.$set = {}`
   - `event.$set_once = {}`
   - `return event`
   No other early-returns, no key-level filtering, no conditional logic that could skip a wipe.
2. **Network panel check (dev)** — Start dev server, open Chrome DevTools → Network, filter `POST` requests where URL path contains `/e/` or `/batch/`. Inspect Request Payload JSON. For every matching request:
   - `properties` key present and equals `{}` (length 0 keys)
   - `$set` key (if present) equals `{}`
   - `$set_once` key (if present) equals `{}`
3. **Person enrichment check (dashboard)** — In PostHog dashboard → Persons, inspect a recent active test user (post-merge). Confirm:
   - No email/name/identifier properties appear (only anonymous `distinct_id`)
   - No `$initial_utm_*` keys
   - No geo keys were enriched server-side (note: geo enrichment happens server-side from IP by default; if this is a concern, configure project-level data retention to drop geo fields in PostHog project settings, per `ARTKINS_STYLE_GUIDE.md` §8 "Do not store more than required")
4. **Regression guard** — Uninstall `before_send` locally, confirm properties ARE populated by default (this proves the hook is the difference maker). Then restore the hook and confirm re-wipe.
5. **Gate scripts (non-negotiable, per AGENTS.md Hard Rule 0)** — All four pass with exit 0:
   - `npm run sync:check`
   - `npm run security:all`
   - `npm run test`
   - `npm run build`

## Contract Boundaries
- **NOT touched by Feature 57**: server-side PostHog (`lib/posthog-server.ts`, `posthog-node@^5.15.0`). That SDK has NO `before_send` equivalent in the browser process; server payloads must be PII-free by construction.
- **NOT touched by Feature 57**: Route handlers, middleware, any Node-side process that imports `posthog` from the server package.
- **NOT weakened by any future spec without a PR that explicitly updates this document AND the Hard Rule 0 contract-sync list**. Feature 57 is marked as CANNOT-be-weakened in `library-docs.md` → PostHog → Client-Side Integration Pattern.

## References
- [instrumentation-client.ts](file:///home/artkins/Programming/WEB%20PROGRAMMING/NEXTJS/foundrie-ai/instrumentation-client.ts#L17-L29)
- [ARTKINS_STYLE_GUIDE.md §8 Production Security](file:///home/artkins/Programming/WEB%20PROGRAMMING/NEXTJS/foundrie-ai/ARTKINS_STYLE_GUIDE.md)
- [AGENTS.md Hard Rule 0 (contract synchronization)](file:///home/artkins/Programming/WEB%20PROGRAMMING/NEXTJS/foundrie-ai/AGENTS.md)
- [Feature 57 spec](file:///home/artkins/Programming/WEB%20PROGRAMMING/NEXTJS/foundrie-ai/project-kit/feature-specs/57-posthog-before-send-hook.md)
- [Feature 59 spec](file:///home/artkins/Programming/WEB%20PROGRAMMING/NEXTJS/foundrie-ai/project-kit/feature-specs/59-liveblocks-reset-on-sign-out.md)
- [Feature 60 spec](file:///home/artkins/Programming/WEB%20PROGRAMMING/NEXTJS/foundrie-ai/project-kit/feature-specs/60-liveblocks-identify-scrub.md)
- [library-docs.md PostHog section](file:///home/artkins/Programming/WEB%20PROGRAMMING/NEXTJS/foundrie-ai/project-kit/context/library-docs.md#L659-L731)
