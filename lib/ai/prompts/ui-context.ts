/**
 * UI Context Generation Prompt
 * Generates context/ui-context.md for exported projects
 */

export function getUIContextPrompt(): string {
  return `You are generating a UI Context document for a software project. This document defines the design system, visual language, and interaction patterns that will guide implementation.

## Your Task

Generate a comprehensive \`context/ui-context.md\` file that covers:

1. **Design Tokens**
   - Color palette (primary, secondary, accent, neutral, semantic)
   - Typography scale (font families, sizes, weights, line heights)
   - Spacing scale (consistent spacing units)
   - Border radius values
   - Shadow definitions
   - Z-index scale

2. **Layout Patterns**
   - Grid system or layout primitives
   - Breakpoints for responsive design
   - Container widths
   - Common layout compositions

3. **Component Architecture**
   - Component categories (inputs, navigation, feedback, data display)
   - Naming conventions
   - Composition patterns
   - State variations (default, hover, active, disabled, error, loading)

4. **Accessibility Requirements**
   - Minimum touch target size (44×44px for mobile)
   - Color contrast ratios (WCAG AA minimum)
   - ARIA patterns for interactive components
   - Keyboard navigation requirements
   - Focus visible styles
   - Screen reader considerations

5. **Motion & Animation**
   - Easing functions (ease-in, ease-out, ease-in-out)
   - Duration scale (fast: 150ms, normal: 250ms, slow: 400ms)
   - Use cases for motion (feedback, transitions, attention)
   - Reduced motion preferences

6. **Interaction Rules**
   - Button behavior (click, loading, success, error)
   - Form validation (inline, on blur, on submit)
   - Loading states and skeletons
   - Error handling patterns
   - Empty states

7. **Performance Targets**
   - Core Web Vitals goals (LCP < 2.5s, FID < 100ms, CLS < 0.1)
   - Image optimization strategy
   - Code splitting approach

## CRITICAL INSTRUCTIONS

- **Platform-Adaptive**: Do NOT assume the project is web. Adapt tokens, layout, and interaction patterns to the actual platform (web, mobile native, desktop, CLI, etc.) based on the architecture context.

- **GSAP Rules (when applicable)**: If the architecture context mentions GSAP or animation library usage, include these rules:
  \`\`\`
  ### GSAP Animation Rules
  - Register all GSAP plugins at module level, not inside components
  - Use \`useLayoutEffect\` for animations that affect layout, \`useEffect\` for others
  - Always create a \`gsap.context()\` and return \`ctx.revert()\` in cleanup
  - Prefer \`transform\` and \`opacity\` for performance
  - Use \`force3D: true\` to enable hardware acceleration
  - Use \`ScrollTrigger\` for scroll-based animations with proper cleanup
  \`\`\`

- **Figma Integration (when applicable)**: If visual research includes Figma files or design system assets, note that tokens should be derived from those files and mention bidirectional sync expectations.

- **Research Citations**: When design decisions come from uploaded research, visual references, or motion analysis, cite the specific research file paths (e.g., \`research/visual/design-system.md\`, \`research/assets/brand-colors.png\`).

- **Stack-Specific Guidance**: Include setup instructions for the design system based on the chosen stack:
  - React: Mention component library (shadcn/ui, Radix, MUI, Chakra)
  - Tailwind: Explain token integration via config or CSS variables
  - Mobile: Platform design guidelines (iOS Human Interface, Material Design)
  - Desktop: Framework-specific patterns (Electron, Tauri)

- **No Over-Engineering**: Keep the design system minimal and practical. Don't define 20 color shades if 5 will do. Don't specify every possible component variant upfront.

## Output Format

Return ONLY the Markdown content for \`context/ui-context.md\`. The structure should be:

\`\`\`markdown
# UI Context

## Design System Overview
[Brief description of the visual direction and design philosophy]

## Design Tokens

### Colors
[Color palette with hex values and semantic names]

### Typography
[Font families, scale, weights]

### Spacing
[Spacing scale in consistent units]

### Radius
[Border radius values]

### Shadows
[Shadow definitions]

## Layout Patterns
[Grid system, breakpoints, container widths]

## Component Architecture
[Component categories, naming conventions, state variations]

## Accessibility
[Touch targets, contrast, ARIA, keyboard nav, focus styles]

## Motion & Animation
[Easing, durations, motion use cases, reduced motion]

## Interaction Rules
[Button behavior, form validation, loading/error/empty states]

## Performance
[Core Web Vitals targets, optimization strategies]

## Platform-Specific Guidance
[Setup instructions, library integration, platform guidelines]

## Research Basis
[Citations to visual research, motion analysis, and design decisions]
\`\`\`

Generate clear, actionable guidance that a coding agent can implement without ambiguity.`;
}
