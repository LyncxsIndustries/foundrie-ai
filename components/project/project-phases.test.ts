import { describe, it, expect } from "vitest";

import {
  PROJECT_PHASES,
  PROJECT_PHASE_COUNT,
  phaseForStatus,
  phaseHref,
  phasePosition,
  statusLabel,
} from "./project-phases";

describe("project phase model", () => {
  it("defines exactly 8 phases in flow order", () => {
    expect(PROJECT_PHASE_COUNT).toBe(8);
    expect(PROJECT_PHASES.map((p) => p.id)).toEqual([
      "overview",
      "discovery",
      "requirements",
      "architecture",
      "diagrams",
      "specs",
      "research",
      "export",
    ]);
  });

  it("marks only the diagram phase as the diagram-first gate", () => {
    const gates = PROJECT_PHASES.filter((p) => p.isGate);
    expect(gates).toHaveLength(1);
    expect(gates[0].id).toBe("diagrams");
  });

  it("maps every ProjectStatus to a phase", () => {
    expect(phaseForStatus("DISCOVERY")).toBe("discovery");
    expect(phaseForStatus("REQUIREMENTS")).toBe("requirements");
    expect(phaseForStatus("ARCHITECTURE")).toBe("architecture");
    expect(phaseForStatus("DIAGRAM_GENERATION")).toBe("diagrams");
    expect(phaseForStatus("SPEC_GENERATION")).toBe("specs");
    expect(phaseForStatus("COMPLETE")).toBe("export");
  });

  it("builds the overview href without a trailing segment", () => {
    const overview = PROJECT_PHASES[0];
    expect(phaseHref("abc", overview)).toBe("/projects/abc");
  });

  it("builds nested phase hrefs from the segment", () => {
    const diagrams = PROJECT_PHASES.find((p) => p.id === "diagrams")!;
    expect(phaseHref("abc", diagrams)).toBe("/projects/abc/diagrams");
  });

  it("reports 1-based phase positions", () => {
    expect(phasePosition("overview")).toBe(1);
    expect(phasePosition("export")).toBe(PROJECT_PHASE_COUNT);
  });

  it("throws for an unknown phase id", () => {
    expect(() => phasePosition("stale-phase" as never)).toThrow(
      /Unknown project phase: stale-phase/,
    );
  });

  it("renders human-friendly status labels", () => {
    expect(statusLabel("DIAGRAM_GENERATION")).toBe("Diagram Generation");
    expect(statusLabel("COMPLETE")).toBe("Complete");
  });
});
