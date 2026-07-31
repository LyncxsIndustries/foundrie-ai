# PostHog Server Logger — Feature 61

## File Ownership
- Owner: Foundrie runtime observability / instrumentation
- Implementation: `lib/posthog-server.ts`
- Tests: `lib/posthog-server.test.ts`
- Related specs: Feature 56 (token/env), Features 57–60 (browser privacy), Feature 61 (this file — server structured logging)

## What Changed
Replaced bare `console.warn` with structured `logger.warn` when PostHog env vars are missing in non-production. Wrapped `posthog.capture` + `await posthog.flush()` in try/catch and log failures with `logger.error` so analytics outages never fail product code paths.

### Before
```typescript
console.warn("PostHog environment variables missing; PostHog client disabled.");
// ...
posthog.capture({ distinctId, event, properties });
await posthog.flush(); // rejection could bubble to callers
```

### After (Feature 61)
```typescript
logger.warn("PostHog environment variables missing; PostHog client disabled.");
// ...
try {
  posthog.capture({ distinctId, event, properties });
  await posthog.flush();
} catch {
  // Fixed category only — lib/logger.ts has no scrub/redact
  logger.error("PostHog capture error");
}
```

## Why (Context7 `/posthog/posthog-js` → `packages/node`)
- `capture(props: EventMessage): void` — sync fire-and-forget queue (Context7 client.ts).
- `flush(): Promise<void>` — drains the queue; network/transport failures reject the Promise (installed `posthog-node` typings).
- No browser `before_send` on the Node SDK — server payloads must stay PII-free by construction (see Feature 60 note on this file).

## Validation Checklist
1. Unit tests in `lib/posthog-server.test.ts` — missing-env warn, happy path, flush rejection, sync capture throw.
2. Grep gate: `lib/posthog-server.ts` must not contain `console.warn` / `console.error` / `console.log`.
3. Hard Rule 0 gates: `sync:check` → `security:all` → `test` → `build`.
4. Agent skills present under `.agents/skills/`: `posthog-instrumentation`, `check-posthog-loading`, `verify-posthog-instrumentation`, plus Context7 (`context7-cli` / `find-docs`). Claude Code mirrors under `.claude/` are gitignored (Hard Rule 21 — absolute-path symlinks are not portable).

## Generated Project Rule
Any Foundrie-exported project that ships a PostHog Node wrapper must mirror this pattern: structured logger + try/catch around capture/flush. Documented in Feature 61 Generated Project Contract and `library-docs.md` Server-Side Integration Pattern. Generated projects must also gitignore local `.claude/` skill mirrors when installing PostHog agent skills via Context7.

## References
- [lib/posthog-server.ts](../lib/posthog-server.ts)
- [lib/logger.ts](../lib/logger.ts)
- [Feature 61 spec](../project-kit/feature-specs/61-posthog-server-logger.md)
- [library-docs.md PostHog section](../project-kit/context/library-docs.md)
- [AGENTS.md Hard Rule 15](../AGENTS.md) (structured JSON logging)
- Context7: `/posthog/posthog-js` (Node package)
