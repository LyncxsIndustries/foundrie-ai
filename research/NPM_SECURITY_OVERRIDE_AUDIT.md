# NPM Security Override Audit — Feature 62

## Purpose
Record Context7-backed evidence for Foundrie’s Feature 62 security-script and transitive-override contract so agents never reintroduce audit suppressors or misaligned sharp allowScripts keys.

## Evidence Citations (Context7, 2026-08-01)

| # | Source | Finding |
|---|---|---|
| 1 | `/npm/cli` — `audit-level` definition | Valid levels: `info` \| `low` \| `moderate` \| `high` \| `critical` \| `none`. `--audit-level=none` always exits 0 (suppresses failures). |
| 2 | `/npm/cli` — package.json `overrides` | Override values may be exact versions or semver ranges; used to force transitive package versions. |
| 3 | `/lovell/sharp` — changelog v0.35.3 | Latest secure release (2026-07-01) with bound checks / overflow hardening. |
| 4 | `/lovell/sharp` — changelog v0.35.0 | Breaking: Node ≥20.9.0; install script removed. |
| 5 | `/open-telemetry/opentelemetry-js` — `@opentelemetry/core` | Stable 2.x line; floor for Feature 62 is `>=2.8.0`; npm registry latest at audit: `2.10.0`. |
| 6 | Live `npm audit --audit-level=high` | Exit 0 after Feature 62 overrides; remaining advisories are moderate only (10). |
| 7 | Live `npm ls` | `sharp@0.35.3 overridden` (via Next.js); `@opentelemetry/core@2.10.0` under `@trigger.dev/core`. |

## Risk Matrix

| Risk | Pre-62 | Post-62 |
|---|---|---|
| Audit gate hides high/critical via suppress flags | Spec text warned about `--ignore`; gate already used `--audit-level=high` | Documented hard invariant: no `none` / no advisory-ignore |
| sharp allowScripts key drift (`0.34.5` vs `^0.35.0`) | Misaligned | `sharp` + `allowScripts["sharp@0.35.3"]` aligned |
| Stale `@opentelemetry/core` (<2.8.0) in Trigger tree | Possible via transitive resolve (`2.7.1` seen pre-override) | Forced `>=2.8.0` → `2.10.0` |

## Decision: Exact sharp pin vs caret
Chose exact `0.35.3` over `^0.35.0` so CI and local installs resolve the security-hardened patch deterministically and so `allowScripts` can name a single concrete version key.

## Decision: OTel range vs exact
Chose `>=2.8.0` (spec floor) rather than pinning exact `2.10.0` so Trigger.dev minor OTel bumps within the 2.x line can float while never resolving below the security floor. Revisit if a future OTel 3.x break appears.

## Contract Sync Footprint (Feature 62)
| Artifact | Role |
|---|---|
| `package.json` / `package-lock.json` | Implementation |
| `project-kit/feature-specs/62-security-script-fix.md` | Spec + Version Research |
| `project-kit/feature-specs/52-scope-change-protocol.md` | Historical gate note + Feature 62 extension pointer |
| `project-kit/feature-specs/63-download-zip-button-test.md` | Predecessor note |
| `project-kit/context/code-standards.md` | Dependency Security policy |
| `project-kit/context/library-docs.md` | npm security gate section |
| `project-kit/context/architecture-context.md` | Gate wording |
| `docs/SECURITY_SCRIPT_OVERRIDES.md` | Operator doc |
| `docs/DEPENDENCIES_UPGRADE_NOTES.md` | Override table extension |
| `research/NPM_SECURITY_OVERRIDE_AUDIT.md` | This file |
| `project-kit/context/progress-tracker.md` | Feature status |
| `.agents/skills/security-audit` + `skills-lock.json` | Agent skill for security workflows |
| `.gitignore` | Track `.agents/skills/**`; ignore `.claude/` |

## Follow-ups (out of Feature 62 scope)
- Address remaining moderate advisories (`esbuild`/`tsx`, `valibot`/`prisma`, MCP SDK via `shadcn`) without breaking pinned ranges.
- Feature 64 continues `docs/DEPENDENCIES_UPGRADE_NOTES.md` formatting cleanup only.

## Generated Project Rule
Generated projects must reproduce this audit pattern: Context7 evidence → `security:deps` without suppressors → documented overrides → Hard Rule 0 gate order.
