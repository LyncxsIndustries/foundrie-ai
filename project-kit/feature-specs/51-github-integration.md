# Feature 51 - GitHub App Integration & Reference Repos

## Type

NEW FEATURE

## What This Delivers

GitHub App integration so Foundrie can read repositories the user authorizes, support the reference-repository pattern (read-only repos a session borrows patterns from), and onboard existing projects via reverse-architecture derivation. Foundrie operates as a GitHub App (installation-level permissions, bot identity), not a broad OAuth grant.

## Dependencies

- Feature 02 (Auth) and Feature 04 (Project CRUD) must be complete.
- Feature 09 (Web Research Connectors) provides the research-source persistence used to record extracted patterns.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- GitHub Apps via official GitHub documentation
- Next.js `/vercel/next.js`

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `app/api/github/install/route.ts`
- `app/api/github/repos/route.ts`
- `app/api/github/webhook/route.ts`
- `lib/github/app-client.ts`
- `lib/github/reverse-architecture.ts`
- `components/project/GitHubConnect.tsx`

## Files

CREATE: `lib/github/app-client.ts` - GitHub App auth (installation tokens) and repo reads.
CREATE: `app/api/github/install/route.ts` - installation callback.
CREATE: `app/api/github/repos/route.ts` - list authorized repos and read files.
CREATE: `app/api/github/webhook/route.ts` - verified GitHub App webhook.
CREATE: `lib/github/reverse-architecture.ts` - infer architecture from an existing repo.
CREATE: `components/project/GitHubConnect.tsx` - connect/select repos UI.
MODIFY: `context/progress-tracker.md` - mark feature progress.

## Implementation Notes

- Operate as a GitHub App with fine-grained, installation-level permissions (Contents R/W, Pull requests R/W, Issues R, Metadata R, Workflows R/W) and bot identity. Verify webhooks before processing. Store installation/token references scoped to the authenticated user; never expose another user's repos.
- Access matrix: own repos (full), collaborator-write (full), collaborator-read (read-only), public (read-only), private-other (no access). Enforce this on every repo read.
- Reference-repository pattern: a session has one working repo and optional read-only reference repos. When the user references a pattern from a reference repo, read the relevant file, extract the pattern, and record it in `research/reference-patterns.md` (source repo, source file, extracted pattern, which spec uses it) via the Feature 09 research-source store.
- Existing-project onboarding: `reverse-architecture.ts` reads the stack (package manifests), source samples, README, CI config, and recent git log, then produces inferred System Context, ERD, API Map, and Component diagrams, each labeled "INFERRED — verify before proceeding." The user corrects and approves before any spec generation. Generated specs reference existing code rather than overwriting it.
- All routes require auth and project membership where project-scoped. Treat fetched repo content as untrusted input. This feature reads repos; it does not push code or open PRs (that is the downstream coding agent's job).

## Out of Scope

- Pushing commits, opening PRs, or branch creation from Foundrie (the downstream agent does that).
- The six team-topology ZIP variants and Task-Scoped mini-ZIP mode (documented in research; a later feature can add them).
- Figma integration (separate connector).

## Future Modifications

- Later feature: team-topology-aware ZIP variants (`.foundrie/` root, `EXECUTION_GUIDE.md`) and Task-Scoped Session mode.
- Feature 26: generated specs cite extracted reference patterns.

## Acceptance Criteria

- [ ] Foundrie authenticates as a GitHub App with installation-level permissions and verifies webhooks.
- [ ] The access matrix is enforced (no access to others' private repos; read-only for public and collaborator-read).
- [ ] A session can attach read-only reference repos; extracted patterns are recorded in `research/reference-patterns.md` with attribution.
- [ ] Existing-project onboarding produces inferred diagrams labeled "INFERRED — verify before proceeding" and requires user approval before spec generation.
- [ ] Repo reads are scoped to the authenticated user; non-members get 404 on project-scoped routes.
- [ ] Foundrie does not push code or open PRs.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
