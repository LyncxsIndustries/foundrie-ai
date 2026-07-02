# UI Tokens

## Contract Synchronization Gate

Any implementation change that corrects or changes a contract must be reflected in the same branch across the affected feature spec, dependent future specs, relevant context files, root AGENTS.md, and progress-tracker.md. Contracts include Prisma fields and relations, route signatures, auth helper signatures, AI task names and callAI/callAIStream request/response shapes, status enums, storage paths, generated file structure, package versions, environment variables, and file ownership. A feature is not ready for review while later specs or context still describe stale fields, old API shapes, or invalid contracts.

## Purpose

This document defines the design system tokens for Foundrie AI. All colors, typography, spacing, radius, shadows, and motion values are centralized here. UI components must reference these tokens exclusively—no hardcoded values.

## Color Palette (Lynx Theme Pro)

### Core Colors

```typescript
export const colors = {
  // Background layers
  background: {
    base: '#0f0f0f',          // Canvas, page background
    surface: '#1a1a1a',        // Cards, panels, elevated surfaces
    surfaceElevated: '#2a2a2a', // Hover states, active elements
    surfaceHighlight: '#333333', // Selected, focused elements
  },

  // Primary accent (electric green)
  primary: {
    DEFAULT: '#00e676',         // Lynx signature green
    hover: '#00c962',           // Darker on hover
    active: '#00b356',          // Even darker when pressed
    muted: 'rgba(0, 230, 118, 0.1)', // Subtle background
    mutedHover: 'rgba(0, 230, 118, 0.2)', // Subtle hover
  },

  // Text hierarchy
  text: {
    primary: '#f5f5f5',         // Headlines, primary content
    secondary: '#b0b0b0',       // Labels, secondary content
    muted: '#6b7280',           // Placeholders, disabled text
    inverse: '#0f0f0f',         // Text on light backgrounds
  },

  // Borders & dividers
  border: {
    DEFAULT: '#2a2a2a',         // Default border color
    subtle: '#1f1f1f',          // Very subtle borders
    elevated: '#333333',        // Elevated surface borders
    focus: '#00e676',           // Focus rings
  },

  // Status colors
  status: {
    success: '#10b981',         // Green for success
    warning: '#f59e0b',         // Amber for warnings
    error: '#ef4444',           // Red for errors
    info: '#3b82f6',            // Blue for info
  },

  // Semantic overlays
  overlay: {
    light: 'rgba(255, 255, 255, 0.05)',
    medium: 'rgba(255, 255, 255, 0.1)',
    dark: 'rgba(0, 0, 0, 0.5)',
    darker: 'rgba(0, 0, 0, 0.8)',
  },
};
```

### Tailwind CSS Variables

```css
/* tailwind.config.ts */
module.exports = {
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0f0f0f',
          surface: '#1a1a1a',
          elevated: '#2a2a2a',
          highlight: '#333333',
        },
        primary: {
          DEFAULT: '#00e676',
          hover: '#00c962',
          active: '#00b356',
          muted: 'rgba(0, 230, 118, 0.1)',
        },
        text: {
          primary: '#f5f5f5',
          secondary: '#b0b0b0',
          muted: '#6b7280',
        },
        border: {
          DEFAULT: '#2a2a2a',
          subtle: '#1f1f1f',
          elevated: '#333333',
        },
      },
    },
  },
};
```

## Typography

### Font Families

```typescript
export const fonts = {
  heading: ['Inter', 'SF Pro Display', '-apple-system', 'sans-serif'],
  body: ['Inter', 'SF Pro Text', '-apple-system', 'sans-serif'],
  mono: ['JetBrains Mono', 'Fira Code', 'SF Mono', 'monospace'],
};
```

### Type Scale (1.25 Ratio)

```typescript
export const typography = {
  xs: {
    fontSize: '0.75rem',      // 12px
    lineHeight: '1rem',        // 16px
    fontWeight: 400,
  },
  sm: {
    fontSize: '0.875rem',     // 14px
    lineHeight: '1.25rem',     // 20px
    fontWeight: 400,
  },
  base: {
    fontSize: '1rem',          // 16px
    lineHeight: '1.5rem',      // 24px
    fontWeight: 400,
  },
  lg: {
    fontSize: '1.125rem',     // 18px
    lineHeight: '1.75rem',     // 28px
    fontWeight: 500,
  },
  xl: {
    fontSize: '1.25rem',      // 20px
    lineHeight: '1.75rem',     // 28px
    fontWeight: 600,
  },
  '2xl': {
    fontSize: '1.5rem',       // 24px
    lineHeight: '2rem',        // 32px
    fontWeight: 700,
  },
  '3xl': {
    fontSize: '1.875rem',     // 30px
    lineHeight: '2.25rem',     // 36px
    fontWeight: 700,
  },
  '4xl': {
    fontSize: '2.25rem',      // 36px
    lineHeight: '2.5rem',      // 40px
    fontWeight: 800,
  },
  '5xl': {
    fontSize: '3rem',         // 48px
    lineHeight: '1',           // tight
    fontWeight: 900,
  },
};
```

## Spacing Scale

Based on 4px base unit (0.25rem).

```typescript
export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
};
```

## Border Radius

```typescript
export const radius = {
  none: '0',
  sm: '0.25rem',    // 4px
  DEFAULT: '0.5rem', // 8px
  md: '0.75rem',    // 12px
  lg: '1rem',       // 16px
  xl: '1.5rem',     // 24px
  '2xl': '2rem',    // 32px
  full: '9999px',   // Pill shape
};
```

## Shadows

### Elevation Shadows

```typescript
export const shadows = {
  subtle: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
  medium: '0 4px 6px -1px rgba(0,0,0,0.5), 0 2px 4px -1px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
  high: '0 20px 25px -5px rgba(0,0,0,0.7), 0 10px 10px -5px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
  glowPrimary: '0 0 20px rgba(0, 230, 118, 0.4), 0 0 40px rgba(0, 230, 118, 0.2)',
  glowError: '0 0 20px rgba(239, 68, 68, 0.4), 0 0 40px rgba(239, 68, 68, 0.2)',
};
```

### CSS Classes

```css
.shadow-subtle {
  box-shadow: 0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3);
}

.shadow-medium {
  box-shadow: 
    0 4px 6px -1px rgba(0,0,0,0.5),
    0 2px 4px -1px rgba(0,0,0,0.3),
    inset 0 1px 0 rgba(255,255,255,0.05);
}

.shadow-high {
  box-shadow:
    0 20px 25px -5px rgba(0,0,0,0.7),
    0 10px 10px -5px rgba(0,0,0,0.4),
    inset 0 1px 0 rgba(255,255,255,0.08);
}

.glow-primary {
  box-shadow:
    0 0 20px rgba(0, 230, 118, 0.4),
    0 0 40px rgba(0, 230, 118, 0.2);
}
```

## Glass Morphism

```typescript
export const glass = {
  light: {
    background: 'rgba(26, 26, 26, 0.5)',
    backdropFilter: 'blur(8px) saturate(150%)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  medium: {
    background: 'rgba(26, 26, 26, 0.7)',
    backdropFilter: 'blur(12px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  heavy: {
    background: 'rgba(26, 26, 26, 0.9)',
    backdropFilter: 'blur(16px) saturate(200%)',
    border: '1px solid rgba(255,255,255,0.12)',
  },
};
```

### CSS Classes

```css
.glass-light {
  background: rgba(26, 26, 26, 0.5);
  backdrop-filter: blur(8px) saturate(150%);
  border: 1px solid rgba(255,255,255,0.08);
}

.glass-medium {
  background: rgba(26, 26, 26, 0.7);
  backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.1);
}

.glass-heavy {
  background: rgba(26, 26, 26, 0.9);
  backdrop-filter: blur(16px) saturate(200%);
  border: 1px solid rgba(255,255,255,0.12);
}
```

## Motion & Animation

### Durations

```typescript
export const duration = {
  instant: '0ms',
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
  slower: '800ms',
};
```

### Easing Functions

```typescript
export const easing = {
  // Standard easing
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',

  // GSAP easing (use with GSAP animations)
  power1: 'power1.out',
  power2: 'power2.out',
  power3: 'power3.out',
  back: 'back.out(1.7)',
  elastic: 'elastic.out(1, 0.5)',
};
```

### Common Transitions

```typescript
export const transitions = {
  button: 'all 150ms ease-out',
  card: 'all 300ms ease-out',
  modal: 'all 300ms ease-in-out',
  tooltip: 'opacity 150ms ease-out',
};
```

## Z-Index Scale

```typescript
export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,
};
```

## Responsive Breakpoints

```typescript
export const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet portrait
  lg: '1024px',  // Tablet landscape, small laptop
  xl: '1280px',  // Desktop
  '2xl': '1536px', // Large desktop
};
```

## Usage Guidelines

1. **Never hardcode values**: Always use tokens from this file.
2. **Component-specific tokens**: If a component needs a unique value, define it in the component file with a comment explaining why it deviates.
3. **Dark mode only**: Foundrie uses a dark-first design. No light mode tokens defined.
4. **Consistent naming**: Follow the established naming convention (e.g., `text.primary`, `shadow.medium`, `spacing.4`).
5. **Token updates**: When updating tokens, update this file first, then propagate to components. Never update tokens inline.

## File Reference

This token system is implemented in:
- `lib/design-tokens.ts` (TypeScript exports)
- `tailwind.config.ts` (Tailwind theme extension)
- Global CSS variables (for non-Tailwind usage)
