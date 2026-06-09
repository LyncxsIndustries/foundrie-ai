# Feature 16 - Custom Node Types

## Type

NEW FEATURE

## What This Delivers

Type-aware React Flow node components for UML, C4, data, and infrastructure diagrams, registered as memoized `nodeTypes` defined outside render scope. Node data is schema-validated before rendering. These nodes back both manual diagramming and the 12 generated diagram types.

## Dependencies

- Feature 15 (Diagram Type Selector) must be complete (shape libraries exist).

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- React Flow `/xyflow/web`

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `components/canvas/nodes/**`
- `lib/diagrams/schemas/nodes.ts`

## Files

CREATE: one node component per major shape family under `components/canvas/nodes/`.
CREATE: `lib/diagrams/schemas/nodes.ts` - Zod schemas for node data.

## Implementation Notes

- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens) is also baked into the generated projects, ensuring they are premium products.


- Implement class/interface/abstract compartment nodes; sequence lifeline, actor, activation, and fragment nodes; ER entity, weak entity, attribute, and relationship nodes; C4 person, system, container, database, and external system nodes; microservice, gateway, message bus, database, load balancer, and cache nodes.
- Validate node data with Zod before rendering. Keep node renderers pure and visual; business logic belongs in hooks/helpers.
- Register `nodeTypes` outside render scope or memoized.
- Infrastructure node icons are inlined as base64 SVGs (not external URLs) so html-to-image PNG capture (Feature 21) does not break on CORS.
- Follow the diagram visual language in `ui-context.md`.

## Out of Scope

- Edge types (Feature 17), generation (Features 18–19), PNG capture (Feature 21).

## Future Modifications

- Feature 19: Generated diagrams instantiate these nodes from AI output.
- Feature 21: Nodes are captured to PNG; inlined SVG icons ensure clean capture.

## Acceptance Criteria

- [ ] Node components exist for class/interface/abstract, sequence, ER, C4, and microservice/infrastructure families.
- [ ] Node data is Zod-validated before rendering.
- [ ] `nodeTypes` are defined outside render scope or memoized.
- [ ] Infrastructure icons are inlined as base64 SVGs, not external URLs.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
