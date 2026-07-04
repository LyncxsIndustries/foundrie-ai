import { gsap } from '@/lib/gsap-config';
import { RefObject } from 'react';

/**
 * Magnetic button interaction
 * Creates smooth mouse-following effect within button bounds
 * Follows ui-rules.md animation patterns
 */

const MAGNETIC_STRENGTH = 0.4; // How strongly button follows cursor (0-1)
const ANIMATION_DURATION = 0.4; // Smooth follow duration

export interface MagneticOptions {
  strength?: number;
  duration?: number;
}

/**
 * Apply magnetic hover effect to a button element
 * Returns cleanup function
 */
export function useMagneticHover(
  elementRef: RefObject<HTMLElement>,
  options?: MagneticOptions
) {
  const strength = options?.strength ?? MAGNETIC_STRENGTH;
  const duration = options?.duration ?? ANIMATION_DURATION;

  const handleMouseMove = (e: MouseEvent) => {
    const element = elementRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;

    gsap.to(element, {
      x: deltaX,
      y: deltaY,
      duration,
      ease: 'power2.out',
      force3D: true,
    });
  };

  const handleMouseLeave = () => {
    const element = elementRef.current;
    if (!element) return;

    gsap.to(element, {
      x: 0,
      y: 0,
      duration,
      ease: 'power2.out',
      force3D: true,
    });
  };

  const element = elementRef.current;
  if (element) {
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }

  return () => {};
}

/**
 * Hook variant for React components
 * Use inside useEffect with proper cleanup
 */
export function createMagneticEffect(
  element: HTMLElement | null,
  options?: MagneticOptions
) {
  if (!element) return () => {};

  const strength = options?.strength ?? MAGNETIC_STRENGTH;
  const duration = options?.duration ?? ANIMATION_DURATION;

  const handleMouseMove = (e: MouseEvent) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;

    gsap.to(element, {
      x: deltaX,
      y: deltaY,
      duration,
      ease: 'power2.out',
      force3D: true,
    });
  };

  const handleMouseLeave = () => {
    gsap.to(element, {
      x: 0,
      y: 0,
      duration,
      ease: 'power2.out',
      force3D: true,
    });
  };

  element.addEventListener('mousemove', handleMouseMove);
  element.addEventListener('mouseleave', handleMouseLeave);

  return () => {
    element.removeEventListener('mousemove', handleMouseMove);
    element.removeEventListener('mouseleave', handleMouseLeave);
  };
}
