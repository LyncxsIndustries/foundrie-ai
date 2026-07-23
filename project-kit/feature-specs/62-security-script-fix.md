# Feature 62 - Security script fix

## Description
Update `package.json` to remove the `npm audit --ignore` flag, bump `@opentelemetry/core` to `>= 2.8.0`, and align sharp overrides.

## Files Owned
- `package.json`

## Out of Scope
- Other dependency bumps.

## Acceptance Criteria
- The `scripts.security:deps` and dependency lists in `package.json` are updated as specified.
- `npm run sync:check`, `npm run security:all`, `npm run test`, and `npm run build` succeed.

## Implementation Plan
1. Edit `package.json`.
2. Run the validation pipeline.
