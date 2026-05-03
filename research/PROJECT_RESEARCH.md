# Foundrie AI - Project Research Corpus

This folder is Foundrie AI's own research workspace. It mirrors the `research/` folder that Foundrie exports for generated projects.

## Canonical Files

- `PROJECT_RESEARCH.md` - this research index and usage contract.
- `FOUNDRIE_RESEARCH.md` - master product, architecture, backend, auth, AI, research, ZIP, and roadmap research.
- `../ARTKINS_STYLE_GUIDE.md` - full engineering policy every agent must read before implementation.

No empty asset folders are kept here. Supporting research folders are created only when real content exists.

## Accepted Research Inputs

Foundrie accepts:

- image assets
- screenshots
- inspiration images
- frame ZIPs
- extracted frames
- Markdown files
- pasted notes
- PDF research files
- Word research files
- Excel research files
- PowerPoint research files
- links
- Tavily outputs
- Obscura captures
- Context7 findings
- AI and engineer research notes

Raw animation files are rejected. Users provide extracted frames or frame ZIPs.

## Storage Rule

When the app exists, files go to Vercel Blob. Neon stores metadata, extracted text, summaries, tags, source attribution, ownership, and Blob paths.

## Conditional Generated Folders

Generated project exports create research subfolders only when populated. Examples include source summaries, uploaded assets, screenshots, inspirations, documents, frame ZIPs, extracted frames, browser captures, and Context7 notes.

Do not create placeholder folders or placeholder README files.

## How Agents Use Research

Before implementing a Foundrie feature:

1. Read `AGENTS.md`.
2. Read `ARTKINS_STYLE_GUIDE.md`.
3. Read this file.
4. Read `FOUNDRIE_RESEARCH.md`.
5. Read the active context files.
6. Read the current feature spec.
7. Use Context7 for current library/API behavior.
8. Present an implementation plan and wait for user approval before changing implementation-impacting files.

If a feature depends on research, cite the relevant `research/...` path in the feature notes or progress tracker.

## Current Research Themes

- Foundrie AI as a pre-IDE architectural workspace.
- Full Artkins style policy as a root project artifact.
- Next.js 16 App Router with root-level folders.
- Clerk authentication with application-layer authorization.
- User ownership, plan gates, and intentionally minimal admin strategy.
- Multi-model AI rotation and task-specialized model routing.
- Research-first planning with image assets, screenshots, frame ZIPs, extracted frames, documents, pasted notes, Tavily, Obscura, Context7, and AI synthesis.
- Diagram generation with React Flow, Liveblocks, PNG capture, and ZIP export.
- Approval-gated implementation planning before generated output or code execution.

## Research Rules

- Preserve source attribution for links, screenshots, captures, documents, and documentation findings.
- Distinguish user preference, source fact, AI inference, and unresolved questions.
- Keep `FOUNDRIE_RESEARCH.md`, context files, and feature specs synchronized when research changes architecture.
- Keep output direct and functional under `ARTKINS_STYLE_GUIDE.md`.
