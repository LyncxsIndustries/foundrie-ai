import { describe, it, expect } from "vitest";

import { PLAN_LIMITS, canCreateProject } from "./plan-limits";

describe("PLAN_LIMITS", () => {
  it("caps FREE and leaves paid tiers uncapped", () => {
    expect(PLAN_LIMITS.FREE.maxProjects).toBe(3);
    expect(PLAN_LIMITS.PRO.maxProjects).toBe(Infinity);
    expect(PLAN_LIMITS.ENTERPRISE.maxProjects).toBe(Infinity);
  });
});

describe("canCreateProject", () => {
  it("allows a FREE user under the limit", () => {
    expect(canCreateProject("FREE", 0)).toBe(true);
    expect(canCreateProject("FREE", 2)).toBe(true);
  });

  it("blocks a FREE user at or over the limit", () => {
    expect(canCreateProject("FREE", 3)).toBe(false);
    expect(canCreateProject("FREE", 4)).toBe(false);
  });

  it("always allows paid tiers", () => {
    expect(canCreateProject("PRO", 1000)).toBe(true);
    expect(canCreateProject("ENTERPRISE", 1_000_000)).toBe(true);
  });
});
