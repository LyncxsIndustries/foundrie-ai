# Feature 21 - Canvas Export

## Type

NEW FEATURE

## What This Delivers

PNG capture of React Flow diagrams for ZIP inclusion: capture the diagram surface only (not UI panels), with bounds that include all nodes and edges, correct fonts, and the dark background. Diagrams also export to their format-specific files (Mermaid/SVG/DBML/OpenAPI JSON/XState) per the diagram suite contract.

## Dependencies

- Feature 19 (Sequential Generation) and Feature 20 (Diagram Storage) must be complete.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- html-to-image `/bubkoo/html-to-image`
- React Flow `/xyflow/web`

```bash
npx ctx7 library <library> "<specific question>"
npx ctx7 docs <libraryId> "<specific question>"
```

## Files Owned

- `lib/diagrams/capture.ts`
- `app/api/diagrams/[projectId]/[diagramId]/capture/route.ts`
- `lib/diagrams/export-formats.ts`

## Files

CREATE: `lib/diagrams/capture.ts` - html-to-image capture of the diagram surface.
CREATE: `app/api/diagrams/[projectId]/[diagramId]/capture/route.ts` - capture endpoint.
CREATE: `lib/diagrams/export-formats.ts` - Mermaid/SVG/DBML/OpenAPI/XState exporters per diagram type.

## Implementation Notes

- Use html-to-image (or Konva) to capture only the diagram surface, not UI panels. Ensure capture bounds include all relevant nodes and edges; handle fonts and the dark background correctly.
- html-to-image's known weakness is CORS on external images. Infrastructure node icons are inlined as base64 SVGs (Feature 16), so capture does not break — never load icons from external URLs.
- Produce the format-specific exports the ZIP contract expects: System Context/Container/Component/Sequence/DFD/Deployment/Feature DAG/Agent/Security as `.mermaid` + `.svg`; ERD as `.dbml` + `.png`; State Machine as `.mermaid` + `.json` (XState); API Map as `.yaml` (OpenAPI). The API Map's OpenAPI export is the authoritative API contract in the ZIP.
- Add tests or manual checks for readable PNG output.

## Out of Scope

- ZIP packaging (Feature 30) and storage persistence (Feature 20).

## Future Modifications

- Feature 30: The ZIP builder includes the captured PNGs and format-specific exports under `diagrams/`.

## Acceptance Criteria

- [ ] Capture produces a readable PNG of the diagram surface only, with correct fonts and dark background.
- [ ] Capture bounds include all nodes and edges; no external-URL icons (inlined SVG only).
- [ ] Format-specific exports are produced per the diagram suite contract (Mermaid/SVG/DBML/OpenAPI/XState).
- [ ] The API Map exports a valid OpenAPI YAML.
- [ ] Non-owner access returns 404.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
