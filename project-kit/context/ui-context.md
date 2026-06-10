# UI Context

## Contract Synchronization Gate

Any implementation change that corrects or changes a contract must be reflected in the same branch across the affected feature spec, dependent future specs, relevant context files, root AGENTS.md, and progress-tracker.md. Contracts include Prisma fields and relations, route signatures, auth helper signatures, AI task names and callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, and file ownership. A feature is not ready for review while later specs or context still describe stale fields, old API shapes, or invalid contracts.


## Theme

Foundrie AI uses a dark, technical, diagram-first workspace. The product should feel like a professional engineering surface: dense enough for real planning, calm enough for long sessions, and visually structured enough for complex diagrams.

The primary experience is not a marketing page. After sign-in, users land in working surfaces: dashboard, discovery chat, requirements review, architecture canvas, diagram generation, specs review, research library, and export. Foundrie targets Awwwards-level quality on its marketing and onboarding surfaces using GSAP, while keeping the working canvas calm and functional.

## 60-Second First Value

Onboarding is designed so an engineer experiences value within 60 seconds: open → "What are you building?" → type a description → first discovery question (or starter templates) → Foundrie actively shaping the plan. Progressive disclosure introduces the diagram canvas (day 3), GitHub integration (week 1), and collaboration/reference repos (week 2). Always show which discovery phase the session is in (e.g., "Phase 6 of 8 — Architecture Diagramming").

## Visual Inspiration

The product borrows the clarity of system-design roadmaps and educational architecture diagrams: labeled sections, connected flows, compact panels, visible hierarchy. The canvas supports both free-form diagramming and generated structured maps without feeling like a decorative card.

## Color Tokens

All colors are defined as CSS custom properties in `globals.css` and mapped through Tailwind. Components must not use raw hex values except where defining the token palette.

| Role | CSS Variable | Value |
|---|---|---|
| Page background | `--bg-base` | `#07090b` |
| Canvas background | `--bg-canvas` | `#0b0f12` |
| Surface | `--bg-surface` | `#11161a` |
| Elevated surface | `--bg-elevated` | `#171d22` |
| Subtle surface | `--bg-subtle` | `#20272d` |
| Border | `--border-default` | `#2b343b` |
| Strong border | `--border-strong` | `#3f4b54` |
| Primary text | `--text-primary` | `#eef5f2` |
| Secondary text | `--text-secondary` | `#b9c7c1` |
| Muted text | `--text-muted` | `#7e8c86` |
| Brand accent | `--accent-primary` | `#00d18f` |
| Brand dim | `--accent-primary-dim` | `rgba(0, 209, 143, 0.14)` |
| Intelligence accent | `--accent-ai` | `#70a5ff` |
| Diagram yellow | `--diagram-yellow` | `#f3d34a` |
| Diagram blue | `--diagram-blue` | `#4fa3ff` |
| Diagram green | `--diagram-green` | `#62c073` |
| Diagram purple | `--diagram-purple` | `#9b8cff` |
| Error | `--state-error` | `#ff5a66` |
| Success | `--state-success` | `#34d399` |
| Warning | `--state-warning` | `#fbbf24` |

## Typography

| Role | Font | Notes |
|---|---|---|
| UI text | Geist Sans or equivalent | loaded through `next/font` |
| Code and diagrams | Geist Mono or equivalent | used for specs, labels, snippets |

Do not scale font size with viewport width. Keep letter spacing at `0` unless a local component has a specific reason.

## Motion (GSAP and Framer Motion)

- GSAP is mandatory for Awwwards-level marketing/onboarding surfaces. Framer Motion handles in-app transitions and progress states.
- GSAP rules: register plugins at module level; use `useLayoutEffect`; scope with `gsap.context()`; always `return () => ctx.revert()`; animate only `transform` and `opacity` with `force3D: true`; lazy-load plugins with dynamic imports.
- Motion tokens (durations and easings) are defined in the design system and referenced by name, never inlined ad hoc.
- Motion must serve UX. No decorative glow, float, or pulse with no purpose.

## Layout Patterns

- Dashboard: project list and phase status, not a hero page.
- Project shell: left project/phase navigation, main content, optional right inspector.
- Discovery: split chat and structured requirements summary, with the active phase indicator.
- Requirements: document review with editable sections and status.
- Architecture: full-viewport canvas with floating panels over the canvas; the diagram-first approval surface lives here.
- Diagrams: category selector, shape library, canvas, generation progress panel, diagram version history.
- Specs: document tabs/list with preview and edit surfaces.
- Research: research library with uploader, source list, visual reference grid, motion plan viewer.
- Export: package checklist, ZIP status, and download action.

## Canvas

- Canvas fills the available viewport. The dotted/grid background feels infinite and flush with the app background.
- Floating panels overlay the canvas; they never push or shrink it. No card-like canvas wrapper with heavy shadow, radius, or padding.
- Generation progress appears as a floating panel showing the current step and recoverable failure states.
- Viewport changes are intentional; dropping or generating content does not unexpectedly zoom unless the user requested fit-to-view.
- Multi-user presence: live cursors, selections, and "who holds the input" are shown via Liveblocks and degrade gracefully when realtime auth/connection fails.

## Diagram Visual Language

### Structural
- Class/interface/abstract nodes use compartment layouts. Component/package/deployment nodes use clear containers. Inheritance and dependency edges use UML-appropriate markers.

### Behavioral
- Sequence lifelines are tall vertical structures; activation bars are narrow and aligned; messages are horizontal, labeled, and distinct by sync/async/return. Activity/state diagrams use compact, readable flow nodes.

### Architectural
- C4 nodes distinguish person, system, container, database, and external system. Microservice maps use strong service boundaries and consistent spacing.

### Data
- ER diagrams use entity boxes, relationship diamonds or labeled edges, and crow's-foot markers. DFD diagrams distinguish external entities, processes, data stores, and flows.

### Infrastructure
- AWS/network diagrams prioritize clarity over vendor icon decoration. Icons are inlined as base64 SVGs (not external URLs) so html-to-image PNG capture does not break on CORS. Labels and grouping matter more than visual noise.

## Components

- shadcn/ui for primitives. Lucide React for icons. Framer Motion for sidebar transitions, progress states, and phase transitions. React Flow for the diagram canvas. GSAP for marketing/onboarding motion. Tooltips for icon-only controls.

## Interaction Rules

- Buttons use icons when the action has a familiar symbol. Numeric values use inputs, sliders, or steppers. Diagram category selection uses tabs or segmented controls. Binary settings use switches or checkboxes.
- Long-running generation always shows progress, the current step, and recoverable failure states.
- Users can inspect and edit generated documents and diagrams before export; diagrams must be explicitly approved (diagram-first gate) before specs are generated.
- All buttons disable immediately on click and re-enable only on error (idempotency). The AI input field follows the queue state machine (FREE → TYPING → SUBMITTED → RUNNING → BATCH_TAKEN) in collaborative sessions, with a queue-position indicator when AI providers are busy.
- Every async surface has loading (skeleton), error (recoverable), and empty states. Interactive elements meet a 44×44px minimum touch target and provide proper ARIA and keyboard support.
