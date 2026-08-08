# Feature 72 - Global Theme and Contrast Fix

## Type

ENHANCEMENT

## What This Delivers

Revamps the global theme, colors, and contrast using Foundrie AI Skills guidelines. Implements premium HSL-tailored color palettes, fixes project card opacity issues, applies vibrant glassmorphism effects, and curates typography for maximum readability. After this feature, the entire Foundrie app reflects a cohesive, high-end dark theme with excellent contrast and visual hierarchy.

## Dependencies

- Feature 01 (Design System) - base tokens and components
- Feature 69 (Dashboard Project Cards UI) - project card redesign
- Foundrie AI Skills - premium color and design patterns
- `inspo/` folder - visual reference screenshots

## Context To Read First

- `context/ui-tokens.md`
- `context/ui-rules.md`
- `context/ui-registry.md`
- `project-kit/skills/foundrie-ai-skill/SKILL.md`
- `project-kit/skills/minimalist-skill/SKILL.md`
- `project-kit/examples/floria-full.webp`
- `inspo/*.png` - all inspiration screenshots

## Context7 Docs To Check

```bash
npx ctx7 library tailwindcss "HSL color system and theme configuration"
npx ctx7 library tailwindcss "backdrop blur and glassmorphism utilities"
```

## Files Owned

None - this feature updates global theme files.

## Files

MODIFY: `app/globals.css` - global color variables and theme tokens
MODIFY: `tailwind.config.ts` - HSL color palette and utilities
MODIFY: `lib/design-system.ts` - update color token contracts
MODIFY: `components/ui/card.tsx` - fix opacity and contrast
MODIFY: `components/project/ProjectCard.tsx` - apply new theme tokens
UPDATE: `lib/design-system.test.ts` - test color contrast ratios

## Implementation Notes

**CRITICAL CONTRACT SYNCHRONIZATION GATE**: Before implementation and before marking this feature done, compare this spec against the current codebase, Prisma schema, context files, AGENTS.md, and every dependent future spec. If the implementation changes or corrects any contract, update this spec, all affected later specs, relevant context files, AGENTS.md, and progress-tracker.md in the same branch.

### HSL Color Palette

```css
/* app/globals.css */
:root {
  /* Premium dark theme - HSL for easy manipulation */
  --background: 222 47% 11%;        /* Deep slate */
  --foreground: 210 40% 98%;        /* Near white */
  
  --card: 222 47% 14%;               /* Slightly lighter than bg */
  --card-foreground: 210 40% 98%;
  
  --primary: 142 76% 36%;            /* Foundrie green */
  --primary-foreground: 144 61% 90%;
  
  --secondary: 217 91% 60%;          /* Vibrant blue accent */
  --secondary-foreground: 210 40% 98%;
  
  --muted: 217 33% 17%;              /* Subtle backgrounds */
  --muted-foreground: 215 16% 65%;   /* Dimmed text */
  
  --accent: 142 76% 36%;             /* Same as primary */
  --accent-foreground: 144 61% 90%;
  
  --border: 217 33% 20%;             /* Subtle borders */
  --input: 217 33% 20%;
  --ring: 142 76% 36%;               /* Focus rings */
  
  /* Semantic colors */
  --success: 142 76% 36%;
  --warning: 38 92% 50%;
  --error: 0 84% 60%;
  --info: 217 91% 60%;
}
```

### Glassmorphism Utilities

```typescript
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      backgroundImage: {
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.glass': {
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      });
    },
  ],
};
```

### Fixed Project Card Opacity

```tsx
// components/project/ProjectCard.tsx
<Card className="glass hover:bg-white/10 transition-all duration-300">
  <CardHeader>
    <CardTitle className="text-foreground">{project.name}</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-muted-foreground">{project.description}</p>
  </CardContent>
</Card>
```

### Typography Curation

```css
/* app/globals.css */
body {
  font-family: 'Inter', system-ui, sans-serif;
  font-feature-settings: 'cv05', 'cv11'; /* OpenType features */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Geist', 'Inter', system-ui, sans-serif;
  letter-spacing: -0.02em; /* Tighter headings */
}
```

### Contrast Validation

All color combinations must meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text). Test with:

```bash
npm run test:contrast
```

## Out of Scope

- Component-specific refinements (Features 73-81 handle individual component upgrades)
- Animation implementation (Feature 68)
- Canvas/diagram theming (Feature 78)

## Future Modifications

- Features 73-82 will apply these tokens to specific components
- Feature 82 (Enforce UI Consistency Guards) will prevent non-tokenized colors

## Quality Gates

- Run `npm run sync:check` and ensure it passes
- Run `npm run security:all` and ensure it passes
- Run `npm run test` and ensure contrast ratios pass
- Run `npm run build` and ensure it passes

## Acceptance Criteria

- [ ] HSL color palette implemented in `globals.css`
- [ ] Tailwind config uses HSL color tokens
- [ ] All semantic colors defined (success, warning, error, info)
- [ ] Glassmorphism utilities available (`glass` class)
- [ ] Project card opacity fixed with proper contrast
- [ ] Typography curated with Inter/Geist fonts
- [ ] All text meets WCAG AA contrast ratios (4.5:1 normal, 3:1 large)
- [ ] No hardcoded hex/rgb colors in components (use tokens)
- [ ] Dark theme is cohesive across entire app
- [ ] Focus rings use primary color with sufficient contrast
- [ ] Hover states are subtle and consistent
- [ ] `context/ui-tokens.md` updated with new color palette
- [ ] Contrast tests pass
- [ ] `context/progress-tracker.md` is updated to mark this feature DONE and point Current Goal/Next Up at Feature 73
- [ ] All quality gates pass
- [ ] CodeRabbit review completed and all findings resolved (recommended quality gate)

## Setup Instructions

No new external accounts or API keys required. This feature updates global CSS and Tailwind configuration.

For any technology, tool, or package we are using in this spec, if it requires creating an account, getting API keys, or external setup, instruct the AI agent to give step-by-step instructions on how to get started with it and how to get everything needed.
