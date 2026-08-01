# Feature 63 - Download zip button test

## Description
Add a Vitest + React Testing Library test for `components/project/DownloadZipButton.tsx`.

## Feature 62 Predecessor Note
Feature 62 locked `security:deps` to `npm audit --audit-level=high` (no ignore/suppress flags), pinned `sharp@0.35.3` + `@opentelemetry/core@>=2.8.0` overrides, and aligned `allowScripts`. This Feature 63 owns **only** `DownloadZipButton.test.tsx` — do not reopen `package.json` security scripts/overrides here. Gates still run Hard Rule 0 order including `security:all`.

## Files Owned
- `components/project/DownloadZipButton.test.tsx`

## Out of Scope
- Modifying the component itself.
- Dependency / security-script changes (Feature 62).

## Setup Instructions (external account & API keys)
No new external account or API-key setup is required. Tests use Vitest + React Testing Library already in the repo. For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.

## Acceptance Criteria
- A new test file `DownloadZipButton.test.tsx` is created with proper testing coverage.
- `npm run sync:check`, `npm run security:all`, `npm run test`, and `npm run build` succeed.

## Implementation Plan
1. Create `components/project/DownloadZipButton.test.tsx`.
2. Write tests using Vitest + RTL.
3. Run the validation pipeline.

## Quality Gates (mandatory, AGENTS.md Hard Rule 0)
1. `npm run sync:check`
2. `npm run security:all`
3. `npm run test`
4. `npm run build`
