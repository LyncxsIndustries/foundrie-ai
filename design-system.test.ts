import { describe, it, expect } from "vitest";
import designSystem, {
  duration,
  easing,
  minTouchTargetPx,
  fontFamily,
  radius,
} from "./design-system";

describe("design-system tokens", () => {
  it("exposes the sans and mono font CSS variables", () => {
    expect(fontFamily.sans).toBe("var(--font-sans)");
    expect(fontFamily.mono).toBe("var(--font-mono)");
  });

  it("enforces the 44px minimum touch target (WCAG 2.5.5)", () => {
    expect(minTouchTargetPx).toBe(44);
  });

  it("keeps duration tokens in sync across seconds and milliseconds", () => {
    for (const token of Object.values(duration)) {
      expect(token.ms).toBe(Math.round(token.s * 1000));
    }
  });

  it("provides both a GSAP ease and a cubic-bezier for every easing token", () => {
    for (const token of Object.values(easing)) {
      expect(typeof token.gsap).toBe("string");
      expect(token.cubicBezier).toHaveLength(4);
      for (const point of token.cubicBezier) {
        expect(typeof point).toBe("number");
      }
    }
  });

  it("derives radius tokens from the --radius custom property", () => {
    expect(radius.lg).toBe("var(--radius)");
    expect(radius.full).toBe("9999px");
  });

  it("aggregates all token groups on the default export", () => {
    expect(designSystem.duration).toBe(duration);
    expect(designSystem.easing).toBe(easing);
    expect(designSystem.fontFamily).toBe(fontFamily);
  });
});
