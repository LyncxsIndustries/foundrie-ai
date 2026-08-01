# Dependency Upgrade Documentation

## File Relocation (2026-07-25)
This file was moved from `project-kit/docs/dependencies.md` → `docs/DEPENDENCIES_UPGRADE_NOTES.md` to eliminate a duplicate `docs/` folder hierarchy in Foundrie's root. The canonical docs root is `docs/` because it is a HARD CONTRACT per AGENTS.md Rule 16 (every generated project ZIP exports `docs/` as a required folder) and it already contained all 20 owner-facing operational docs (PostHog configuration, deployment, scaling, security, session logs, Trigger optimizations, environment setup guides). The orphan `project-kit/docs/` contained only this one file referenced exclusively by Feature 64, so it was renamed (for consistency with `docs/POSTHOG_DEFAULTS_UPGRADE_NOTES.md` naming) and merged.

## Overview
We addressed several deprecated and vulnerable dependencies that were flagged during the recent `npm install` run.

## Updated Packages
| Package            | Previous Spec | New Spec (override) | Reason |
|--------------------|----------------|---------------------|--------|
| `uuid`             | `^10.0.0` (deprecated) | `^11.0.2` | Latest stable version, removes deprecation warnings. |
| `glob`             | `^9.3.5` (security vulnerabilities) | `11.1.0` | Fixed known security issues; matches the version used in `devDependencies`. |
| `node-domexception`| `^1.0.0` (deprecated) | `^2.0.1` | Updated to the most recent version before deprecation; note that the package is still deprecated in favor of native `DOMException`. |
| `sharp` (Feature 62) | `^0.35.0` override + stale `allowScripts` `sharp@0.34.5` | `0.35.3` exact + `allowScripts["sharp@0.35.3"]` | Context7 `/lovell/sharp` v0.35.3 security hardening; align allowScripts key. |
| `@opentelemetry/core` (Feature 62) | unresolved transitive (e.g. 2.7.1) | `>=2.8.0` (resolves 2.10.0) | Context7 `/open-telemetry/opentelemetry-js` floor under Trigger.dev OTel tree. |

## Feature 62 Security Script Invariant
- `security:deps` stays `npm audit --audit-level=high`.
- Never add `--audit-level=none` or advisory-ignore flags that hide high/critical CVEs (Context7 `/npm/cli`).
- Operator doc: `docs/SECURITY_SCRIPT_OVERRIDES.md`. Research: `research/NPM_SECURITY_OVERRIDE_AUDIT.md`.

## Implementation Details
- Added an `overrides` section in `package.json` to enforce the specific versions above.
- Resolved a conflict for `glob` by aligning the override version (`11.1.0`) with the direct dev dependency version.
- Ran `npm install` to apply the overrides and verify that the project builds correctly.
- Post‑install script (`prisma generate`) ran successfully.
- Feature 62 additionally aligned sharp allowScripts and added the OTel core floor override.

## Post‑Upgrade Checks
- Ran `npm run sync:check` to ensure contract synchronization.
- Executed `npm run test` and `npm run build` – both passed without errors.
- Noted remaining moderate severity vulnerabilities; these can be addressed later with `npm audit fix`.
- Feature 62: `npm run security:all` passes with zero high/critical.

## Recommendations
- Consider migrating away from `node-domexception` entirely by using the native `DOMException` (available in Node.js v17+).
- Periodically run `npm audit` and apply fixes to keep dependencies up‑to‑date.
- Keep `allowScripts` keys version-aligned whenever `sharp` (or other native) overrides change.

## References
- npm package pages for the upgraded libraries.
- Project `AGENTS.md` which mandates keeping dependencies up‑to‑date and documenting changes.
- Context7: `/npm/cli`, `/lovell/sharp`, `/open-telemetry/opentelemetry-js`.
- Feature 62: `project-kit/feature-specs/62-security-script-fix.md`.
