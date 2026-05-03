# UI Context

## Theme

Foundrie AI uses a dark, technical, diagram-first workspace. The product should feel like a professional engineering surface: dense enough for real planning, calm enough for long sessions, and visually structured enough for complex diagrams.

The primary experience is not a marketing page. After sign-in, users should land in working surfaces: dashboard, discovery chat, requirements review, architecture canvas, diagram generation, specs review, and export.

## Visual Inspiration

The product can borrow the clarity of system-design roadmaps and educational architecture diagrams: labeled sections, connected flows, compact panels, and visible hierarchy. The canvas should support both free-form diagramming and generated structured maps without feeling like a decorative card.

## Color Tokens

All colors must be defined as CSS custom properties in `globals.css` and mapped through Tailwind. Components must not use raw hex values except where defining the token palette.

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

## Layout Patterns

- Dashboard: project list and phase status, not a hero page.
- Project shell: left project/phase navigation, main content, optional right inspector.
- Discovery: split chat and structured requirements summary.
- Requirements: document review with editable sections and status.
- Architecture: full-viewport canvas with floating panels over the canvas.
- Diagrams: category selector, shape library, canvas, generation progress panel.
- Specs: document tabs/list with preview and edit surfaces.
- Export: package checklist, ZIP status, and download action.

## Canvas

- Canvas fills available viewport.
- Dotted/grid background must feel infinite and flush with the app background.
- Floating panels overlay the canvas; they do not push or shrink it.
- No card-like canvas wrapper with heavy shadow, radius, or padding.
- Generation progress can appear as a floating panel.
- Viewport changes must be intentional; dropping or generating content should not unexpectedly zoom unless the user requested fit-to-view.

## Diagram Visual Language

### Structural

- Class/interface/abstract nodes use compartment layouts.
- Component/package/deployment nodes use clear containers.
- Inheritance and dependency edges use UML-appropriate markers.

### Behavioral

- Sequence lifelines are tall vertical structures.
- Activation bars are narrow and aligned to lifelines.
- Messages are horizontal, labeled, and visually distinct by sync/async/return.
- Activity/state diagrams use compact, readable flow nodes.

### Architectural

- C4 nodes must distinguish person, system, container, database, and external system.
- Microservice maps use strong service boundaries and consistent spacing.

### Data

- ER diagrams use entity boxes, relationship diamonds or labeled edges, and crow's-foot markers.
- DFD diagrams distinguish external entities, processes, data stores, and flows.

### Infrastructure

- AWS/network diagrams should prioritize clarity over vendor icon decoration.
- Use restrained iconography; labels and grouping matter more than visual noise.

## Components

- shadcn/ui for primitives.
- Lucide React for icons.
- Framer Motion for sidebar transitions, progress states, and phase transitions.
- React Flow for diagram canvas.
- Use tooltips for icon-only controls.

## Interaction Rules

- Buttons use icons when the action has a familiar symbol.
- Numeric values use inputs, sliders, or steppers.
- Diagram category selection uses tabs or segmented controls.
- Binary settings use switches or checkboxes.
- Long-running generation always shows progress, current step, and recoverable failure states.
- Users should be able to inspect and edit generated documents before export.
