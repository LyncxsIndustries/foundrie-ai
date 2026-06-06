# 09 - Web Research Connectors

## Type

NEW FEATURE

## Goal

Add optional research connectors for Tavily, Obscura, and Context7 so Foundrie can collect source material from links, rendered pages, and current library documentation during project planning.

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
- [ ] `context/progress-tracker.md` is updated.
- [ ] `npm run build` passes once application code exists.
- All CodeRabbit reviews must pass. In case of errors, iterate and fix by checking official documentation from Context7 and all available skills. Do not rely on personal AI training data as it might be outdated. For every feature, always check documentation, skills, and research for all implementations.
