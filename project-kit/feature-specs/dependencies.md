# Dependency Upgrade Documentation

## Overview
We addressed several deprecated and vulnerable dependencies that were flagged during the recent `npm install` run.

## Updated Packages
| Package            | Previous Spec | New Spec (override) | Reason |
|--------------------|----------------|---------------------|--------|
| `uuid`             | `^10.0.0` (deprecated) | `^11.0.2` | Latest stable version, removes deprecation warnings. |
| `glob`             | `^9.3.5` (security vulnerabilities) | `11.1.0` | Fixed known security issues; matches the version used in `devDependencies`. |
| `node-domexception`| `^1.0.0` (deprecated) | `^2.0.1` | Updated to the most recent version before deprecation; note that the package is still deprecated in favor of native `DOMException`. |

## Implementation Details
- Added an `overrides` section in `package.json` to enforce the specific versions above.
- Resolved a conflict for `glob` by aligning the override version (`11.1.0`) with the direct dev dependency version.
- Ran `npm install` to apply the overrides and verify that the project builds correctly.
- Post‑install script (`prisma generate`) ran successfully.

## Post‑Upgrade Checks
- Ran `npm run sync:check` to ensure contract synchronization.
- Executed `npm run test` and `npm run build` – both passed without errors.
- Noted remaining moderate severity vulnerabilities; these can be addressed later with `npm audit fix`.

## Recommendations
- Consider migrating away from `node-domexception` entirely by using the native `DOMException` (available in Node.js v17+).
- Periodically run `npm audit` and apply fixes to keep dependencies up‑to‑date.

## References
- npm package pages for the upgraded libraries.
- Project `AGENTS.md` which mandates keeping dependencies up‑to‑date and documenting changes.
