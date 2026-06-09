# 08 - Visual and Motion Research Analysis

## Type

NEW FEATURE

## What This Delivers

Analysis of uploaded visual and motion references so Foundrie turns screenshots, inspiration images, frame ZIPs, and extracted frame sequences into implementation-ready design and animation guidance, persisted as research documents and asset summaries.

## Dependencies

- Feature 07 (Research Library) must be complete (assets exist to analyze).
- Feature 05 (AI Rotation Engine) provides vision-capable model routing with graceful fallback.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- GSAP `/websites/gsap`
- GSAP React `/greensock/react`
- Vercel Storage / Blob `/vercel/storage`

## Files Owned

- `app/api/research/[projectId]/analyze/route.ts`
- `components/research/MotionPlanViewer.tsx`
- `lib/research/visual-analysis.ts`
- `lib/research/motion-plan.ts`

## Files

CREATE: `app/api/research/[projectId]/analyze/route.ts`
CREATE: `components/research/MotionPlanViewer.tsx`
CREATE: `lib/research/visual-analysis.ts`
CREATE: `lib/research/motion-plan.ts`
MODIFY: `components/research/ResearchLibrary.tsx` - show analysis status and summaries.

## Implementation

- Analyze selected research assets through the model rotation engine.
- Use vision-capable model routing where available and fall back gracefully when not configured.
- For screenshots/images, summarize layout, hierarchy, typography, color, interaction intent, implementation risk, and asset paths.
- For frame ZIPs and extracted frame sequences, create a motion implementation plan: timeline, GSAP/ScrollTrigger scenes when relevant, frame preloading strategy, pinned sections, responsive fallbacks, accessibility notes, and performance budget.
- Persist analysis as `ResearchDocument` and update `ResearchAsset.aiSummary`.
- Keep source asset paths in every generated analysis so feature specs can reference them.

## Out of Scope

- Generating images or motion assets.
- Editing source assets.
- Building GSAP animations in the app itself.
- Web scraping.

## Future Modifications

- Feature 09: Web research can add external pages and captured screenshots to the same analysis pipeline.
- Feature 26 modification: Generated feature specs can reference these motion plans.

## Acceptance Criteria

- [ ] Owner can select research assets and generate analysis.
- [ ] Analysis records source asset paths.
- [ ] Image analysis produces implementation constraints, not only aesthetic labels.
- [ ] Frame-sequence analysis produces a concrete animation plan when motion is relevant.
- [ ] Missing vision/model support returns a recoverable error and does not corrupt asset records.
- [ ] No asset generation or web scraping is built in this feature.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes once application code exists.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
