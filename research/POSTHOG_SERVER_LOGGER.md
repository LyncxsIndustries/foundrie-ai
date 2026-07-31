# Research: PostHog Server Logger (Feature 61)

## Scope
Server-side PostHog (`posthog-node` via `lib/posthog-server.ts`) structured logging and capture failure isolation. Browser privacy layers (Features 57–60) are out of scope except as boundary notes.

## Evidence (Context7)

| # | Source | Finding |
|---|--------|---------|
| E-01 | `/posthog/posthog-js` → `packages/node/src/client.ts` `capture` | Sync fire-and-forget; queues `EventMessage`; returns `void` |
| E-02 | `node_modules/posthog-node/dist/client.d.ts` | `flush(): Promise<void>` — async drain |
| E-03 | `/posthog/posthog-js` → `packages/node/src/types.ts` `EventMessage` | `properties?: Record<string \| number, any>`; nested objects allowed |
| E-04 | `/posthog/posthog-js` → `captureImmediate` | Async immediate send alternative; not adopted (preserve `flushAt:1` + explicit flush) |
| E-05 | `/posthog/posthog-node` Context7 entry | Legacy standalone repo; superseded by posthog-js monorepo — prefer `/posthog/posthog-js` for docs |

## Decision Matrix

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| Keep `console.warn` | Zero code churn | Violates Hard Rule 15 / code-standards | Reject |
| `logger.warn` / `logger.error` | Structured JSON + `trace_id` | Requires import | **Adopt** |
| Switch to `captureImmediate` only | Single await surface | Changes delivery semantics vs existing flushAt:1 contract | Defer |
| Let flush rejection throw | Callers see analytics failure | Breaks product routes on PostHog outage | Reject — swallow after log |

## Privacy Boundary
Server SDK has no client `before_send`. Feature 61 does **not** add PII fields. Capture properties remain `Record<string, boolean | number | string>` and call sites must stay PII-free (Feature 60 dependency note). GeoIP enrichment (audit Q-01) remains a PostHog project settings concern, not this logger change.

## Contract Sync Footprint (Feature 61)

| Artifact | Change | Status |
|----------|--------|--------|
| `lib/posthog-server.ts` | `logger.warn` + try/catch `logger.error` | ✅ |
| `lib/posthog-server.test.ts` | NEW — 4 unit tests | ✅ |
| `project-kit/feature-specs/61-posthog-server-logger.md` | Version Research, Context7 Findings, Skills, Generated Project Contract | ✅ |
| `project-kit/feature-specs/62-security-script-fix.md` | Feature 61 predecessor note | ✅ |
| `project-kit/context/library-docs.md` | Server-Side Integration Pattern expanded | ✅ |
| `docs/POSTHOG_SERVER_LOGGER.md` | NEW | ✅ |
| `docs/POSTHOG_PRIVACY_IMPLEMENTATION.md` | Feature 61 boundary + checklist item | ✅ |
| `research/POSTHOG_SERVER_LOGGER.md` | NEW (this file) | ✅ |
| `research/POSTHOG_CONFIGURATION_AUDIT.md` | §5.5 footprint | ✅ |
| `project-kit/context/progress-tracker.md` | Feature 61 → DONE; Goal → 62 | ✅ (after gates) |
| Agent skills | Confirm posthog-instrumentation / verify / check-loading / context7 | ✅ |
| `.gitignore` | `.agents/**` + `!.agents/skills/**` un-ignore; `.claude/` ignore for ctx7 Claude mirrors | ✅ |
| `.agents/skills/posthog-instrumentation/SKILL.md` | Tracked agent skill required by Feature 61 | ✅ |

## References
- Feature 61 spec
- docs/POSTHOG_SERVER_LOGGER.md
- research/POSTHOG_CONFIGURATION_AUDIT.md
- AGENTS.md Hard Rules 0, 15, 20, 24
