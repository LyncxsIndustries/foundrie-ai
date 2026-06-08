import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

import { ProjectPhaseNav } from "./ProjectPhaseNav";
import { PROJECT_PHASE_COUNT } from "./project-phases";

const pathname = vi.hoisted(() => ({ value: "/projects/p1" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.value,
}));

beforeEach(() => {
  pathname.value = "/projects/p1";
});

describe("ProjectPhaseNav", () => {
  it("renders all 8 phases", () => {
    render(<ProjectPhaseNav projectId="p1" status="DISCOVERY" />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(PROJECT_PHASE_COUNT);
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Export")).toBeInTheDocument();
  });

  it("marks the overview phase active at the project root path", () => {
    render(<ProjectPhaseNav projectId="p1" status="DISCOVERY" />);
    const active = screen.getByRole("link", { current: "page" });
    expect(active).toHaveTextContent("Overview");
  });

  it("marks the diagrams phase active on the diagrams route", () => {
    pathname.value = "/projects/p1/diagrams";
    render(<ProjectPhaseNav projectId="p1" status="DIAGRAM_GENERATION" />);
    const active = screen.getByRole("link", { current: "page" });
    expect(active).toHaveTextContent("Diagrams");
  });

  it("flags the diagram-first gate on the diagrams phase", () => {
    render(<ProjectPhaseNav projectId="p1" status="DISCOVERY" />);
    expect(screen.getByText("Diagram-first gate")).toBeInTheDocument();
  });

  it("points phase links at the project-scoped routes", () => {
    render(<ProjectPhaseNav projectId="p1" status="DISCOVERY" />);
    expect(screen.getByRole("link", { name: /Overview/ })).toHaveAttribute(
      "href",
      "/projects/p1",
    );
    expect(screen.getByRole("link", { name: /Export/ })).toHaveAttribute(
      "href",
      "/projects/p1/export",
    );
  });
});
