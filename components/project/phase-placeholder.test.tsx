import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { PhasePlaceholder } from "./phase-placeholder";

vi.mock("@/components/project/project-header", () => ({
  ProjectHeader: ({ description }: any) => <div>{description}</div>,
}));

describe("PhasePlaceholder", () => {
  it("derives the phase prefix from the phase id, not a hardcoded number", () => {
    render(
      <PhasePlaceholder
        phaseId="architecture"
        title="Architecture"
        description="Proposed stack and trade-offs."
        emptyTitle="No architecture yet"
        emptyMessage="Coming soon."
        icon={<span />}
      />,
    );
    // architecture is the 4th phase in PROJECT_PHASES.
    expect(
      screen.getByText("Phase 4 of 8 — Proposed stack and trade-offs."),
    ).toBeInTheDocument();
  });

  it("numbers the export phase last", () => {
    render(
      <PhasePlaceholder
        phaseId="export"
        title="Export"
        description="Package checklist."
        emptyTitle="Nothing yet"
        emptyMessage="Coming soon."
        icon={<span />}
      />,
    );
    expect(
      screen.getByText("Phase 8 of 8 — Package checklist."),
    ).toBeInTheDocument();
  });
});
