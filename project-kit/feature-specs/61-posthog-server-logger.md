# Feature 61 - PostHog server logger

## Description
Replace `console.warn` with `logger.warn` in `lib/posthog-server.ts`. Wrap capture calls in try/catch and log via `logger.error`.

## Feature 60 Dependency Note
Feature 60 scrubbed client `posthog.identify` person props to empty `email`/`name` in `lib/liveblocks/provider.tsx`. This Feature 61 file owns **server** logging only (`lib/posthog-server.ts` / `posthog-node`). Do not reintroduce client identify PII here. Server capture payloads must remain PII-free by construction (no client `before_send` on the Node SDK).

## Dependencies
- Feature 56+ PostHog client/server env contract (`NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST`).
- Existing structured `logger` in `lib/logger.ts` (Hard Rule 15 — structured JSON logging only).
- Existing `posthog-node` client module at `lib/posthog-server.ts`.

## Future Modifications
- Server-side GeoIP disable remains a PostHog project settings / infra change (audit Q-01); not this file.
- Optional `captureImmediate` path for true serverless drain is deferred unless a future spec requires it.

## Setup Instructions (external account & API keys)
No new external account or API-key setup is required by this spec. It only replaces `console.warn`/`console` error paths with the structured `logger` in the existing PostHog server module. PostHog server credentials remain owned by their prior setup specs.

For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed. (PostHog: create a project at https://app.posthog.com → Project Settings → Project API Key / Host. No new keys for this logging-only change.)

## Files Owned
- `lib/posthog-server.ts`
- `lib/posthog-server.test.ts`

## Out of Scope
- Changes to the client logger / `instrumentation-client.ts` / Liveblocks provider.
- Changing PostHog init options (`flushAt`, `flushInterval`, `enableExceptionAutocapture`) beyond error-handling.

## Acceptance Criteria
- `lib/posthog-server.ts` uses `logger.warn` and `logger.error` for error handling and warnings.
- Missing env vars in non-production emit `logger.warn` (not `console.warn`) and disable the client.
- `captureServerEvent` wraps `capture` + `flush` in try/catch; failures log via `logger.error` and never throw to callers.
- Unit tests cover missing-env warn, happy-path capture+flush, flush rejection, and sync capture throw.
- `npm run sync:check`, `npm run security:all`, `npm run test`, and `npm run build` succeed.

## Implementation Plan
1. Open `lib/posthog-server.ts`.
2. Replace console warns and add try/catch blocks around capture/flush.
3. Add `lib/posthog-server.test.ts` covering warn/error paths.
4. Run the validation pipeline.

## Version Research
- Context7 library checked: `/posthog/posthog-js` (monorepo hosting `packages/node` — preferred over deprecated `/posthog/posthog-node` standalone repo)
- Secondary library ID: `/posthog/posthog-node` (legacy; redirects to posthog-js monorepo)
- Context7 queries executed:
  - `posthog-node PostHog class capture flush shutdown error handling Node.js server SDK`
  - `posthog-node flush method Promise reject network failure EventMessage capture properties`
- Official sources:
  - https://github.com/posthog/posthog-js/blob/main/packages/node/src/client.ts (`capture`, `_shutdown`, enqueue/flush)
  - https://github.com/posthog/posthog-js/blob/main/packages/node/src/types.ts (`EventMessage`)
  - Installed types: `node_modules/posthog-node/dist/client.d.ts` → `flush(): Promise<void>`

## Context7 Findings — Server Capture + Structured Logger (Feature 61)

| API | Official contract (Context7 / types) | Foundrie adoption |
|-----|--------------------------------------|-------------------|
| `capture(props: EventMessage): void` | Sync fire-and-forget; queues for batch delivery; returns immediately | Call inside try; may throw on invalid prep / warn paths |
| `flush(): Promise<void>` | Async drain of queued events; can reject on network/transport failure | `await` inside same try; rejection → `logger.error`, swallow |
| `captureImmediate` | Async immediate HTTP send (no queue) | Not adopted — existing `flushAt: 1` + explicit `flush()` matches prior contract |
| `EventMessage.properties` | `Record<string \| number, any>` (nested allowed) | Keep Foundrie surface as `Record<string, boolean \| number \| string>` — PII-free by construction |
| Missing token/host | N/A (app-level) | Non-prod: `logger.warn` + `client = null`; prod: silent disable (unchanged) |

**Why try/catch around both**: Context7 shows `capture()` is synchronous queueing; delivery failures surface on `flush()` (Promise). Sync throws from capture prep must also be swallowed so route handlers / Trigger tasks never fail solely because analytics delivery failed (Hard Rule 15 + product reliability).

**Why `logger` not `console.*`**: AGENTS.md Hard Rule 15 and `code-standards.md` require structured JSON logging only. `lib/logger.ts` emits JSON with `trace_id` / level / message to stdout|stderr.

## Agent Skills Required
- `posthog-instrumentation` (existing) — capture / identify / reset patterns
- `verify-posthog-instrumentation` (existing, Feature 59) — post-deploy event verification
- `check-posthog-loading` (existing, Feature 59) — SDK load consistency checks
- `context7-cli` / `context7-mcp` / `find-docs` — mandatory before any PostHog SDK API change
- Structured logging uses project `lib/logger.ts` (no separate logger skill)

## Generated Project Contract
Exported / generated apps that include PostHog Node SDK wrappers MUST:
1. Use structured JSON logging (`logger.warn` / `logger.error`), never bare `console.warn` / `console.error` for analytics failure paths.
2. Wrap `capture` + `flush` (or `captureImmediate`) in try/catch so analytics outages do not fail product requests.
3. Keep server event properties PII-free by construction (no browser `before_send` on `posthog-node`).
4. Document Context7 library IDs `/posthog/posthog-js` (Node package) in their `library-docs.md`.

## Quality Gates (mandatory, AGENTS.md Hard Rule 0)
1. `npm run sync:check`
2. `npm run security:all`
3. `npm run test`
4. `npm run build`
