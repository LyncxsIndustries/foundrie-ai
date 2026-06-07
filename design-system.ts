/**
 * Foundrie design-system token contract.
 *
 * Single source of truth for non-color design tokens (typography, spacing,
 * radius, and motion). Color tokens live as CSS custom properties in
 * `app/globals.css`; this file covers the values that components and motion
 * code reference by name so durations and easings are never inlined ad hoc
 * (per ui-context.md motion rules).
 */

/** Font family CSS variables wired up in `app/layout.tsx`. */
export const fontFamily = {
  sans: "var(--font-sans)",
  mono: "var(--font-mono)",
} as const;

/**
 * Type scale in rem. Sizes are fixed and never scaled with viewport width
 * (ui-context.md). Letter spacing stays at 0.
 */
export const fontSize = {
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
  "4xl": "2.25rem",
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const lineHeight = {
  tight: 1.2,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
} as const;

export const letterSpacing = {
  /** Foundrie keeps tracking at 0 unless a local component has a reason. */
  base: "0",
} as const;

/** Spacing scale in rem, aligned to a 4px base unit. */
export const spacing = {
  px: "1px",
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
} as const;

/** Radius scale; mirrors the `--radius-*` tokens derived in globals.css. */
export const radius = {
  sm: "calc(var(--radius) * 0.6)",
  md: "calc(var(--radius) * 0.8)",
  lg: "var(--radius)",
  xl: "calc(var(--radius) * 1.4)",
  full: "9999px",
} as const;

/** Minimum interactive target size in px (WCAG 2.5.5). */
export const minTouchTargetPx = 44;

/**
 * Motion durations in seconds (GSAP) and milliseconds (Framer Motion / CSS).
 * Referenced by name so timing stays consistent across the app.
 */
export const duration = {
  instant: { s: 0.1, ms: 100 },
  fast: { s: 0.2, ms: 200 },
  base: { s: 0.3, ms: 300 },
  slow: { s: 0.5, ms: 500 },
  slower: { s: 0.8, ms: 800 },
} as const;

/**
 * Easing curves. `gsap` values are GSAP ease strings; `cubicBezier` values are
 * the equivalent control points for Framer Motion and CSS transitions.
 */
export const easing = {
  standard: { gsap: "power2.out", cubicBezier: [0.4, 0, 0.2, 1] },
  emphasized: { gsap: "power3.inOut", cubicBezier: [0.4, 0, 0.2, 1] },
  decelerate: { gsap: "power2.out", cubicBezier: [0, 0, 0.2, 1] },
  accelerate: { gsap: "power2.in", cubicBezier: [0.4, 0, 1, 1] },
} as const;

export type DurationToken = keyof typeof duration;
export type EasingToken = keyof typeof easing;

export const designSystem = {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  spacing,
  radius,
  minTouchTargetPx,
  duration,
  easing,
} as const;

export default designSystem;
