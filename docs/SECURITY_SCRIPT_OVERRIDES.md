# Security Script Overrides — Feature 62

## File Ownership
- Owner: Foundrie dependency security gate
- Implementation: `package.json` (`scripts.security:*`, `overrides`, `allowScripts`, `engines`), `.npmrc` (`strict-allow-scripts`)
- Lockfile: `package-lock.json`
- Related specs: Feature 52 (introduced executable `security:all`), Feature 62 (this file — no-ignore gate + sharp/OTel overrides)

## What Changed

| Field | Before (master) | After (Feature 62) |
|---|---|---|
| `scripts.security:deps` | `npm audit --audit-level=high` | unchanged — **locked invariant**: no ignore/suppress flags |
| `overrides.sharp` | `^0.35.0` | `0.35.3` (exact) |
| `overrides.@opentelemetry/core` | (absent) | `>=2.8.0 <3.0.0-0` (resolves to 2.10.0) |
| `allowScripts` sharp key | `sharp@0.34.5` | `sharp@0.35.3` (aligned with override) |
| `engines.node` | (absent) | `>=20.17.0` (sharp@0.35.x floor) |
| `.npmrc` `strict-allow-scripts` | (absent) | `true` |

## Why (Context7)

### npm (`/npm/cli`)
- Gate severity via `--audit-level=high`.
- Official suppress path is `--audit-level=none` (always exit 0) — **forbidden** in Foundrie and generated projects for high/critical.
- There is no `npm audit --ignore` flag in current npm CLI docs; Feature 62 wording means “no ignore/suppress mechanism that hides high/critical CVEs.”
- `strict-allow-scripts=true` fails install when a dependency has install scripts not covered by `allowScripts`.

### sharp (`/lovell/sharp`)
- Pin exact `0.35.3` (2026-07-01 security hardening changelog).
- Keep `allowScripts` key version-matched with the override pin (policy/inventory alignment; sharp v0.35+ removed its install script).

### `@opentelemetry/core` (`/open-telemetry/opentelemetry-js`)
- Range `>=2.8.0 <3.0.0-0` under Trigger.dev’s OTel tree (2.x-only); registry latest at change time: `2.10.0`.

## Validation Checklist
1. `npm run security:deps` exits 0 with no high/critical advisories.
2. `npm ls sharp` shows `sharp@0.35.3 overridden`.
3. `npm ls @opentelemetry/core` shows a 2.x version ≥2.8.0 (currently `2.10.0`).
4. Grep gate: `package.json` `security:deps` must not contain `audit-level=none` or advisory-ignore flags.
5. Hard Rule 0 gates: `sync:check` → `security:all` → `test` → `build`.

## Generated Project Rule
Exported TypeScript projects must ship the same `security:deps` / `security:all` scripts **without** ignore/suppress flags that hide high/critical CVEs, document any transitive `overrides` with Context7/npm evidence, keep OTel overrides major-bounded, enable `strict-allow-scripts`, and enforce Node >=20.17.0 via `engines.node` and npm >=10.0.0 via `engines.npm` (npm 11+ features like `strict-allow-scripts` and `allowScripts` are enforced locally/CI only).

## References
- [package.json](../package.json)
- [Feature 62 spec](../project-kit/feature-specs/62-security-script-fix.md)
- [code-standards.md Dependency Security](../project-kit/context/code-standards.md)
- [research/NPM_SECURITY_OVERRIDE_AUDIT.md](../research/NPM_SECURITY_OVERRIDE_AUDIT.md)
- AGENTS.md Hard Rule 0 / 14
- Context7: `/npm/cli`, `/lovell/sharp`, `/open-telemetry/opentelemetry-js`
