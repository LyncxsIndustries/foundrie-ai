# Foundrie AI - Project Research Corpus

**Consolidated Version**: 14.0.0 (cumulative)
**Last Synchronized**: 2026-06-06

This folder is Foundrie AI's own research workspace. It mirrors the `research/` folder that Foundrie exports for generated projects. This file is the research index and usage contract; it is read before the six context files during every implementation session.

## Canonical Files

- `PROJECT_RESEARCH.md` — this research index and usage contract.
- `FOUNDRIE_RESEARCH.md` — the consolidated master product, architecture, AI, security, scale, lifecycle, ZIP, and roadmap research (flattens v1.0.0 → v14.0.0 into one current spec).
- `FOUNDRIE_V1.0.0.md` … `FOUNDRIE_V14.0.0.md` — the append-only versioned research history. Each documents only what changed in that release; all prior content remains in force. These are the authoritative changelog and detailed source for any single release.
- `../ARTKINS_STYLE_GUIDE.md` — the full engineering, UX, security, scalability, agent, and no-AI-slope policy every agent reads before implementation.

No empty asset folders are kept here. Supporting research folders are created only when real content exists.

## How the Versioned Corpus Works

The research corpus is **cumulative and append-only**. `FOUNDRIE_V1.0.0.md` is the foundation; every later version documents deltas while keeping all earlier content in force. `FOUNDRIE_RESEARCH.md` is the flattened, current, complete picture.

When two sources disagree, the higher-numbered versioned file wins, because the corpus is cumulative. Read a versioned file for the changelog, rationale, or exact wording of one release. Read `FOUNDRIE_RESEARCH.md` for the whole current state.

What materially changed across the corpus (and is now reflected in the context files and specs):

- **v2.0.0** replaced Foundrie's own single-language stack with a four-layer polyglot architecture (Rust execution + Python AI + TypeScript web + Go gateway) and made GSAP mandatory for Awwwards-level UI. The v1.0.0 Python/FastAPI + TypeScript/JSZip stack is deprecated.
- **v6.0.0** made Foundrie diagram-first: discovery is now 8 phases, no spec is written before all applicable diagrams are approved, and every ZIP includes `diagrams/`.
- **v3.0.0, v9.0.0, v12.0.0, v13.0.0** added seven-layer security, 22-step CI/CD, project-management documents, production logging discipline, and dependency security as mandatory generated scaffolding.
- **v11.0.0–v14.0.0** added scale architecture, pricing/Stripe, the three AI engineering disciplines (context/memory/harness with Mem0/FastMCP/Firecrawl), the client lifecycle, the three-category quality gate, the seven-section handoff, and the retrospective framework.

## Accepted Research Inputs

Foundrie accepts: image assets, screenshots, inspiration images, frame ZIPs, extracted frames, Markdown files, pasted notes, PDF/Word/Excel/PowerPoint research files, links, Tavily outputs, Obscura captures, Context7 findings, and AI/engineer research notes.

Raw animation files are rejected. Users provide extracted frames or frame ZIPs converted outside Foundrie.

## Storage Rule

When the app exists, files go to Vercel Blob. Neon stores metadata, extracted text, summaries, tags, source attribution, ownership, and Blob paths. All uploaded files pass the six-step file security pipeline before content is extracted.

## Conditional Generated Folders

Generated project exports create research subfolders only when populated — source summaries, uploaded assets, screenshots, inspirations, documents, frame ZIPs, extracted frames, browser captures, Context7 notes. Do not create placeholder folders or placeholder README files.

## How Agents Use Research

Before implementing a Foundrie feature:

1. Read `AGENTS.md`.
2. Read `ARTKINS_STYLE_GUIDE.md`.
3. Read this file.
4. Read `FOUNDRIE_RESEARCH.md` (and any versioned file relevant to the feature).
5. Read the active context files.
6. Read the current feature spec.
7. Use Context7 for current library/API behavior.
8. Present an implementation plan and wait for user approval before changing implementation-impacting files.

If a feature depends on research, cite the relevant `research/...` path in the feature notes or progress tracker.

## Current Research Themes

- Foundrie AI as a pre-IDE architectural workspace with a diagram-first generation contract.
- Four-layer polyglot architecture for Foundrie itself; dynamic, research-driven stacks for generated projects.
- 8-phase Socratic discovery with the three-level project classification and the hidden-requirements catalog.
- Clerk authentication with application-layer authorization, the two-role Owner/Collaborator model, and 404-on-ownership-failure.
- Multi-model AI rotation with a Rust key engine, NATS queuing, and tier-based model selection.
- Seven-layer security, 22-step CI/CD, dependency security, and production logging discipline baked into every generated project.
- Research-first planning with assets, frame ZIPs, Tavily, Obscura, Firecrawl, Context7, and AI synthesis.
- Diagram generation with React Flow, Liveblocks, sequential pipeline, versioning, PNG capture, and ZIP export.
- The three AI engineering disciplines (context, memory, harness) with Mem0, FastMCP, and Firecrawl.
- Scale, MongoDB training isolation, the data flywheel, pricing/Stripe, the client lifecycle, the three-category quality gate, the seven-section handoff, and the retrospective framework.
- Approval-gated implementation planning before any generated output or code execution.

## Research Rules

- Preserve source attribution for links, screenshots, captures, documents, and documentation findings.
- Distinguish user preference, source fact, AI inference, and unresolved questions.
- Keep `FOUNDRIE_RESEARCH.md`, the context files, and the feature specs synchronized when research changes architecture.
- Keep output direct and functional under `ARTKINS_STYLE_GUIDE.md`. No AI slope.
