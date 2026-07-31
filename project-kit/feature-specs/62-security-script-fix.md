# Feature 62 - Security script fix

## Description
Update `package.json` to remove the `npm audit --ignore` flag, bump `@opentelemetry/core` to `>= 2.8.0`, and align sharp overrides.

## Feature 61 Predecessor Note
Feature 61 replaced `console.warn` with structured `logger.warn` / `logger.error` in `lib/posthog-server.ts` and wrapped `capture`+`flush` in try/catch. This Feature 62 owns **`package.json` security scripts/overrides only**. Do not reopen PostHog server logging here. Generated projects must still bake Hard Rule 0 gates (`security:all` without ignore flags that hide high/critical CVEs) per AGENTS.md.

## Files Owned
- `package.json`

## Out of Scope
- Other dependency bumps.
- PostHog server/client instrumentation (`lib/posthog-server.ts`, `instrumentation-client.ts`).

## Setup Instructions (external account & API keys)
No new external account or API-key setup is required by this spec. It only adjusts npm security scripts and dependency overrides. For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.

## Acceptance Criteria
- The `scripts.security:deps` and dependency lists in `package.json` are updated as specified.
- `npm run sync:check`, `npm run security:all`, `npm run test`, and `npm run build` succeed.

## Implementation Plan
1. Edit `package.json`.
2. Run the validation pipeline.

## Quality Gates (mandatory, AGENTS.md Hard Rule 0)
1. `npm run sync:check`
2. `npm run security:all`
3. `npm run test`
4. `npm run build`
