import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeaturesGrid } from "./features-grid";

describe("FeaturesGrid", () => {
  it("renders the main heading", () => {
    render(<FeaturesGrid />);
    expect(screen.getByText("Premium Architecture, Zero Ambiguity")).toBeInTheDocument();
  });

  it("renders features", () => {
    render(<FeaturesGrid />);
    expect(screen.getByText("AI-Powered Discovery")).toBeInTheDocument();
    expect(screen.getByText("12 Diagram Types")).toBeInTheDocument();
    expect(screen.getByText("Context Files")).toBeInTheDocument();
    expect(screen.getByText("Feature DAG")).toBeInTheDocument();
    expect(screen.getByText("Real-Time Collaboration")).toBeInTheDocument();
    expect(screen.getByText("Research-Backed")).toBeInTheDocument();
  });
});
