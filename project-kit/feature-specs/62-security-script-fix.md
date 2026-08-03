# Feature 62 - Security script fix

## Description
Update `package.json` to keep `security:deps` free of ignore/suppress flags that hide high/critical CVEs, bump `@opentelemetry/core` via npm overrides to `>=2.8.0 <3.0.0-0`, and align `sharp` override + `allowScripts` keys to exact `0.35.3`.

## Dependencies
- Feature 61 (PostHog server logger) — predecessor; do not reopen PostHog files
- Feature 52 (historical introducer of `security:*` scripts) — Feature 62 is the sole **active** owner of `package.json` / `package-lock.json` for security scripts/overrides
- npm CLI (`/npm/cli`), sharp (`/lovell/sharp`), `@opentelemetry/core` (`/open-telemetry/opentelemetry-js`) — Context7-first version research

## Feature 61 Predecessor Note
Feature 61 replaced `console.warn` with structured `logger.warn` / `logger.error` in `lib/posthog-server.ts` and wrapped `capture`+`flush` in try/catch. This Feature 62 owns **`package.json` security scripts/overrides only**. Do not reopen PostHog server logging here. Generated projects must still bake Hard Rule 0 gates (`security:all` without ignore flags that hide high/critical CVEs) per AGENTS.md.

## Files Owned
- `package.json`
- `package-lock.json` (lockfile refresh for overrides)

## Files
MODIFY: `package.json` — `security:deps` invariant; `overrides.sharp` / `overrides["@opentelemetry/core"]`; `allowScripts` alignment; `engines.node`; `strict-allow-scripts` companion via `.npmrc`
MODIFY: `package-lock.json` — lockfile refresh for overrides
MODIFY: `.npmrc` — `strict-allow-scripts=true` (npm install/CI fail on unreviewed install scripts)

## Out of Scope
- Other dependency bumps.
- PostHog server/client instrumentation (`lib/posthog-server.ts`, `instrumentation-client.ts`).
- Remediating remaining **moderate** advisories (tracked separately; Hard Rule 14 gates on critical/high only).

## Setup Instructions (external account & API keys)
No new external account or API-key setup is required by this spec. It only adjusts npm security scripts and dependency overrides. For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.

### Technologies used (Context7-first)

| Technology | Context7 library ID | How to get started |
|---|---|---|
| npm CLI (`audit`, `overrides`, `allowScripts`) | `/npm/cli` | Bundled with Node.js. Verify with `node -v` / `npm -v`. No account required for local `npm audit`. |
| sharp (transitive via Next.js) | `/lovell/sharp` | Not a direct Foundrie dependency; remediated via `overrides.sharp`. Requires Node `>=20.9.0`. No API key. |
| `@opentelemetry/core` (transitive via Trigger.dev) | `/open-telemetry/opentelemetry-js` | Not a direct Foundrie dependency; remediated via `overrides["@opentelemetry/core"]`. No API key. |

## Version Research (Context7)

### npm (`/npm/cli`) — 2026-08-01
- Official gate: `npm audit --audit-level=high` fails the process on high/critical findings.
- There is **no** documented `npm audit --ignore` flag. Suppressing audit failures uses `--audit-level=none` (always exits 0). Foundrie **must not** use `--audit-level=none` or any advisory-ignore mechanism that hides high/critical CVEs (AGENTS.md Hard Rule 0 / 14).
- `package.json` `overrides` may pin exact versions or semver ranges for transitive packages ([npm package.json overrides docs](https://docs.npmjs.com/cli/v11/configuring-npm/package-json#overrides)).
- `strict-allow-scripts=true` turns unreviewed install scripts into hard install failures ([npm config](https://docs.npmjs.com/cli/v11/using-npm/config#strict-allow-scripts)).

### sharp (`/lovell/sharp`) — 2026-08-01
- Latest secure release at research time: **0.35.3** (changelog 2026-07-01) — dimension/bound checks, overflow hardening for `trim`/`clahe`/`extend`/etc.
- v0.35.0 breaking: Node `>=20.9.0`, install script removed.
- Contract: `overrides.sharp = "0.35.3"` (exact) and `allowScripts["sharp@0.35.3"] = true` must stay version-aligned; `engines.node` declares `>=20.9.0`.

### `@opentelemetry/core` (`/open-telemetry/opentelemetry-js`) — 2026-08-01
- Spec range: `>=2.8.0 <3.0.0-0` (2.x-only floor). Registry latest at research time: **2.10.0**.
- Resolved under `@trigger.dev/core` tree via override; `npm ls @opentelemetry/core` shows `2.10.0`.

## Implemented Contract (`package.json` / `.npmrc`)

```json
"engines": { "node": ">=20.9.0" },
"scripts": {
  "security:deps": "npm audit --audit-level=high",
  "security:all": "npm run security:sast && npm run security:deps && npm run security:secrets"
},
"overrides": {
  "sharp": "0.35.3",
  "@opentelemetry/core": ">=2.8.0 <3.0.0-0"
},
"allowScripts": {
  "sharp@0.35.3": true
}
```

```ini
# .npmrc
strict-allow-scripts=true
```

(`security:deps` already lacked ignore/suppress flags on master; Feature 62 locks that invariant and documents it.)

## Agent Skills (this feature)
- `.agents/skills/context7-cli` — fetch official npm/sharp/OTel docs before override changes
- `.agents/skills/find-docs` — general Context7 documentation lookup
- `.agents/skills/security-audit` — security auditing workflow (installed from `/davila7/claude-code-templates`)

## Generated Project Contract
Every Foundrie-exported TypeScript project MUST bake:
1. `security:deps` = `npm audit --audit-level=high` with **no** `--audit-level=none` and no advisory-ignore flags that hide high/critical CVEs.
2. `security:all` composing SAST + deps + secrets.
3. Exact/range npm `overrides` only for transitive CVEs when direct deps are current and `npm audit fix --force` would break ranges — record evidence in the feature spec / `docs/SECURITY_SCRIPT_OVERRIDES.md` equivalent. OpenTelemetry overrides must stay within a documented major (e.g. `>=2.8.0 <3.0.0-0`), never unbounded majors.
4. When overriding `sharp`, keep `allowScripts` key version-aligned with the override pin and declare `engines.node` compatible with sharp’s Node floor.
5. Enable `strict-allow-scripts=true` in `.npmrc` so CI/`npm install` fail on unreviewed install scripts.

## Acceptance Criteria
- [x] `scripts.security:deps` is `npm audit --audit-level=high` with no ignore/suppress flags.
- [x] `overrides["@opentelemetry/core"]` is `>=2.8.0 <3.0.0-0` (2.x-only).
- [x] `overrides.sharp` is exact `0.35.3` and `allowScripts["sharp@0.35.3"]` is `true`.
- [x] `engines.node` is `>=20.9.0`; `.npmrc` has `strict-allow-scripts=true`.
- [x] Contract sync applied across spec, context, docs, research, and progress tracker.
- [x] `npm run sync:check`, `npm run security:all`, `npm run test`, and `npm run build` succeed.

## Implementation Plan
1. Edit `package.json` overrides + allowScripts alignment + engines.
2. Enable `strict-allow-scripts` in `.npmrc`; refresh `package-lock.json`.
3. Sync docs/context/research/future-spec notes (Hard Rule 0).
4. Install/confirm agent skills; run the validation pipeline.

## Future Modifications
- Remediating remaining moderate advisories without breaking pinned ranges (out of Feature 62 scope).
- Feature 64 formatting cleanup of `docs/DEPENDENCIES_UPGRADE_NOTES.md` only.
- Revisit OTel pin if Trigger.dev adopts a 3.x line.

## Quality Gates (mandatory, AGENTS.md Hard Rule 0)
1. `npm run sync:check`
2. `npm run security:all`
3. `npm run test`
4. `npm run build`
