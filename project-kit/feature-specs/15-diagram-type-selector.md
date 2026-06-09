# Feature 15 - Diagram Type Selector

## Type

NEW FEATURE

## What This Delivers

Category and diagram-type selection with filtered shape libraries: `DIAGRAM_CATEGORIES`, `SHAPE_LIBRARIES`, and a diagram sidebar grouping structural, behavioral, architectural, data, and infrastructure types. The palette filters by the selected type, and the active type persists in diagram state. This is the manual counterpart to the 12-diagram generated suite.

## Dependencies

- Feature 14 (React Flow Canvas) must be complete.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- React Flow `/xyflow/web`
- shadcn/ui `/shadcn-ui/ui`

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `lib/diagrams/categories.ts`
- `lib/diagrams/shape-libraries.ts`
- `components/canvas/DiagramSidebar.tsx`

## Files

CREATE: `lib/diagrams/categories.ts` - `DIAGRAM_CATEGORIES`.
CREATE: `lib/diagrams/shape-libraries.ts` - `SHAPE_LIBRARIES` per diagram type.
CREATE: `components/canvas/DiagramSidebar.tsx` - grouped category/type selector with filtered palette.

## Implementation Notes

- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens) is also baked into the generated projects, ensuring they are premium products.


- Categories: structural (class, component, object, deployment, package), behavioral (use case, sequence, activity, state machine), architectural (C4 context, C4 container, C4 component, microservices map, system context), data (DFD L0, DFD L1, ER), infrastructure (AWS architecture, network).
- Map each diagram type to its shape library exposing node and edge definitions. Filter the palette by the selected type.
- Persist the active diagram type in project/diagram state. Use tabs or segmented controls for category selection.
- The selector aligns with the 12 generated diagram types so manual and generated diagrams share shape vocabulary.

## Out of Scope

- The node and edge renderers themselves (Features 16–17) and generation (Features 18–19).

## Future Modifications

- Features 16–17: Selecting a shape places the corresponding custom node/edge.
- Feature 18: The planner uses these categories/types when planning the diagram suite.

## Acceptance Criteria

- [ ] `DIAGRAM_CATEGORIES` and `SHAPE_LIBRARIES` exist and cover all five categories.
- [ ] The sidebar groups types by category and filters the palette by the selected type.
- [ ] The active diagram type persists in diagram state.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
