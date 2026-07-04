import { gsap } from '@/lib/gsap-config';

/**
 * Dashboard animation utilities using GSAP
 * Follows ui-rules.md: purposeful motion, < 500ms duration, 60fps performance
 */

/**
 * Fade in elements with stagger for sequential reveals
 */
export function fadeInStagger(elements: string | Element | Element[], options?: {
  delay?: number;
  stagger?: number;
  duration?: number;
}) {
  return gsap.from(elements, {
    opacity: 0,
    y: 20,
    duration: options?.duration ?? 0.4,
    delay: options?.delay ?? 0,
    stagger: options?.stagger ?? 0.1,
    ease: 'power2.out',
    force3D: true,
  });
}

/**
 * Slide in from left with fade
 */
export function slideInLeft(element: string | Element, options?: {
  delay?: number;
  duration?: number;
}) {
  return gsap.from(element, {
    opacity: 0,
    x: -30,
    duration: options?.duration ?? 0.3,
    delay: options?.delay ?? 0,
    ease: 'power2.out',
    force3D: true,
  });
}

/**
 * Hover lift effect for interactive cards
 */
export function hoverLift(element: Element, lift: boolean) {
  return gsap.to(element, {
    y: lift ? -4 : 0,
    duration: 0.2,
    ease: 'power2.out',
    force3D: true,
  });
}

/**
 * Glow pulse animation for status indicators
 */
export function glowPulse(element: string | Element) {
  return gsap.to(element, {
    opacity: 0.6,
    duration: 0.8,
    repeat: -1,
    yoyo: true,
    ease: 'power1.inOut',
  });
}

/**
 * Underline animation for section headers
 */
export function underlineExpand(element: string | Element, expand: boolean) {
  return gsap.to(element, {
    scaleX: expand ? 1 : 0,
    duration: 0.3,
    transformOrigin: 'left center',
    ease: 'power2.out',
  });
}

/**
 * Grid item reveal with scale + fade
 */
export function gridReveal(elements: string | Element | Element[], options?: {
  delay?: number;
  stagger?: number;
}) {
  return gsap.from(elements, {
    opacity: 0,
    scale: 0.9,
    duration: 0.4,
    delay: options?.delay ?? 0,
    stagger: options?.stagger ?? 0.08,
    ease: 'back.out(1.2)',
    force3D: true,
  });
}
