# 09 - Web Research Connectors

## Type

NEW FEATURE

## What This Delivers

Optional research connectors for Tavily, Obscura, and Context7 so Foundrie collects source material from links, rendered pages, and current library documentation during planning, and synthesizes `research/PROJECT_RESEARCH.md`. Connectors degrade gracefully when unconfigured.

## Dependencies

- Feature 07 (Research Library) must be complete.
- `TAVILY_API_KEY` and `OBSCURA_ENDPOINT` are optional; the feature must work (in a degraded state) without them.

## Context To Read First

- `context/project-overview.md`
- `context/architecture-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`

## Context7 Docs To Check

- Tavily JS `/tavily-ai/tavily-js`
- Tavily MCP `/tavily-ai/tavily-mcp`
- Context7 skills docs
- Next.js `/vercel/next.js`

## Files Owned

- `app/api/research/[projectId]/links/route.ts`
- `app/api/research/[projectId]/synthesize/route.ts`
- `components/research/ResearchSourceList.tsx`
- `lib/research/providers/tavily.ts`
- `lib/research/providers/obscura.ts`
- `lib/research/providers/context7.ts`
- `lib/research/synthesize-research.ts`

## Files

CREATE: `app/api/research/[projectId]/links/route.ts`
CREATE: `app/api/research/[projectId]/synthesize/route.ts`
CREATE: `components/research/ResearchSourceList.tsx`
CREATE: `lib/research/providers/tavily.ts`
CREATE: `lib/research/providers/obscura.ts`
CREATE: `lib/research/providers/context7.ts`
CREATE: `lib/research/synthesize-research.ts`
MODIFY: `.env.example` - add `TAVILY_API_KEY` and `OBSCURA_ENDPOINT`.
MODIFY: `components/research/ResearchLibrary.tsx` - show sources and synthesis actions.

## Implementation

- Accept user-submitted links and source notes.
- Use Tavily for search/extract/crawl/map when `TAVILY_API_KEY` is configured.
- Use Obscura for JavaScript-rendered page scraping and screenshots when `OBSCURA_ENDPOINT` is configured.
- Store Context7 documentation findings as `ResearchSource` and `ResearchDocument` records.
- Persist source URL, provider, status, extracted title/content summary, screenshot Blob URL when captured, tags, and timestamps.
- Synthesize `research/PROJECT_RESEARCH.md` from conversation notes, uploaded assets, analyses, links, scraped summaries, and Context7 findings.
- Degrade gracefully when Tavily or Obscura is not configured.
- Preserve source attribution and avoid copying full copyrighted pages into generated specs.

## Out of Scope

- Scraping authenticated/private pages.
- Bypassing site access controls.
- Building a browser automation UI.
- Replacing Context7 for library documentation.
- Implementing generated project code.

## Future Modifications

- Feature 30 modification: Include synthesized research docs and captured assets in ZIP output.
- Feature 26 modification: Generated feature specs reference relevant research sources.

## Acceptance Criteria

- [ ] Owner can add links to the research library.
- [ ] Tavily-backed extraction works when `TAVILY_API_KEY` is configured.
- [ ] Obscura-backed rendered capture works when `OBSCURA_ENDPOINT` is configured.
- [ ] Missing connector credentials produce clear disabled states, not crashes.
- [ ] Research synthesis creates or updates `research/PROJECT_RESEARCH.md`.
- [ ] Source attribution is preserved.
- [ ] Non-owner access returns 404.
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at the next numbered spec, and is committed and pushed on this feature branch (never directly to `master`).
- [ ] `npm run build` passes once application code exists.
- We wait for the user to do CodeRabbit review in GitHub. While it's not mandatory, it is highly recommended because it catches issues early and acts as a quality gate. Ensure all other gates pass as indicated in the feature spec files. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.

## Implementation Notes

- **CRITICAL**: Any file or directory that should not be committed to GitHub (e.g. `.agents`, `.github`, API keys, local logs) MUST be explicitly added to `.gitignore` within this feature spec.
- **CRITICAL**: For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
- **CRITICAL**: Ensure that everything implemented and corrected in Foundrie as of now (e.g. structured logging, exact pinned versions, Next.js 16 proxy middleware, Prisma 7 driver adapters, Tailwind v4 tokens) is also baked into the generated projects, ensuring they are premium products.
