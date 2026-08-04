# Feature 64 - Dependencies.md cleanup

## Description
Clean up `docs/DEPENDENCIES_UPGRADE_NOTES.md` (blank line after heading, tidy wording).
This file was moved from `project-kit/docs/dependencies.md` during the 2026-07-25 docs-folder dedupe: Foundrie shipped with two duplicate `docs/` hierarchies (`docs/` root + `project-kit/docs/` orphan). The canonical docs root is `docs/` because it is a HARD CONTRACT per AGENTS.md Rule 16 (every ZIP exports `docs/` as a required folder) and already contained all 20 owner-facing operational docs (PostHog configuration, deployment, scaling, security, session logs, Trigger optimizations, environment setup guides). The orphan `project-kit/docs/` contained only 1 file (`dependencies.md`) referenced exclusively by this spec, so it was renamed (for consistency with `docs/POSTHOG_DEFAULTS_UPGRADE_NOTES.md` naming) and merged into the canonical root `docs/`, eliminating the duplicate hierarchy.

## Files Owned
- `docs/DEPENDENCIES_UPGRADE_NOTES.md`

## Out of Scope
- Changing the actual dependencies.

## Acceptance Criteria
- `docs/DEPENDENCIES_UPGRADE_NOTES.md` is reformatted correctly.
- `npm run sync:check`, `npm run security:all`, `npm run test`, and `npm run build` succeed.

## Implementation Plan
1. Open `docs/DEPENDENCIES_UPGRADE_NOTES.md`.
2. Apply the necessary formatting fixes.
3. Run the validation pipeline.
