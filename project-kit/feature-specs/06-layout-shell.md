# Feature 06 - Layout Shell

## Type

NEW FEATURE

## What This Delivers

The authenticated app shell: a sidebar + top nav layout, the dashboard with project cards and phase statuses, the project route group with empty phase pages (overview, discovery, requirements, architecture, diagrams, specs, research, export), and `ProjectPhaseNav`. After this feature, an authenticated user can navigate the 8-phase project workspace structure.

## Dependencies

- Feature 04 (Project CRUD) must be complete (project APIs and auth helpers exist).
- Feature 01 (Design System) provides the token system and primitives.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Next.js `/vercel/next.js`
- shadcn/ui `/shadcn-ui/ui`

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `app/(app)/layout.tsx`
- `app/(app)/dashboard/page.tsx`
- `app/(app)/projects/[projectId]/page.tsx` and the empty phase pages
- `components/project/ProjectPhaseNav.tsx`

## Files

CREATE: `app/(app)/layout.tsx` - sidebar and top nav shell.
CREATE: `app/(app)/dashboard/page.tsx` - project cards and phase statuses.
CREATE: project route group pages: overview, discovery, requirements, architecture, diagrams, specs, research, export.
CREATE: `components/project/ProjectPhaseNav.tsx` - 8-phase navigation reflecting the discovery protocol.
MODIFY: `context/progress-tracker.md` - mark feature progress.

## Implementation Notes

- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens) is also baked into the generated projects, ensuring they are premium products.


- Dashboard data uses the indexed project list path from Feature 03 (`userId`, `updatedAt`, denormalized counters). Use cursor pagination; never offset.
- Fetch summaries only; do not load heavy child collections (diagrams, specs, conversation JSON) on the dashboard.
- `ProjectPhaseNav` reflects the 8 phases and shows the active phase. The diagram phase is highlighted as the diagram-first gate.
- Responsive behavior must not turn the app into a landing page. Keep the dark workspace feel.
- Every async surface has loading, error, and empty states.

## Out of Scope

- Discovery chat, requirements generation, diagram generation, specs, ZIP, and research logic (later features).
- Collaboration UI and shared-project indicators (Features 39, 42).

## Future Modifications

- Feature 10+: Phase pages gain real content as each phase feature ships.
- Feature 39: Dashboard adds a shared-projects section.
- Feature 42: Project shell adds the sharing UI entry point.

## Acceptance Criteria

- [ ] Authenticated users see the app shell with sidebar and top nav.
- [ ] Dashboard renders project cards with phase statuses using indexed, paginated queries.
- [ ] The project route group renders all phase pages.
- [ ] `ProjectPhaseNav` shows all 8 phases and the active phase.
- [ ] No heavy child collections are loaded on the dashboard.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
