import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { ProjectCard } from "./project-card";

const baseProject = {
  id: "p1",
  name: "Foundrie",
  description: "A pre-IDE architectural workspace.",
  status: "DIAGRAM_GENERATION" as const,
  diagramCount: 10,
  completedDiagramCount: 4,
  featureSpecCount: 3,
  updatedAt: new Date("2026-06-10T00:00:00Z"),
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

describe("ProjectCard", () => {
  it("links to the project overview", () => {
    render(<ProjectCard project={baseProject} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/projects/p1");
  });

  it("shows the project name and updated date", () => {
    render(<ProjectCard project={baseProject} />);
    expect(screen.getByText(baseProject.name)).toBeInTheDocument();
    expect(
      screen.getByText(`Updated ${dateFormatter.format(baseProject.updatedAt)}`),
    ).toBeInTheDocument();
  });

  it("shows the status label and phase position", () => {
    render(<ProjectCard project={baseProject} />);
    expect(screen.getAllByText("Diagram Generation").length).toBeGreaterThan(0);
    // DIAGRAM_GENERATION -> diagrams phase, position 5 of 8.
    expect(screen.getByText("Phase 5 of 8")).toBeInTheDocument();
  });

  it("renders denormalized counters without loading child collections", () => {
    render(<ProjectCard project={baseProject} />);
    expect(screen.getByText("4/10 diagrams")).toBeInTheDocument();
    expect(screen.getByText("3 specs")).toBeInTheDocument();
  });

  it("falls back to placeholder text when there is no description", () => {
    render(<ProjectCard project={{ ...baseProject, description: null }} />);
    expect(screen.getByText("No description yet.")).toBeInTheDocument();
  });
});
