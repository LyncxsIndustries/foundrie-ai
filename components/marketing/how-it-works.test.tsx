import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HowItWorks } from "./how-it-works";

describe("HowItWorks", () => {
  it("renders the main heading", () => {
    render(<HowItWorks />);
    expect(screen.getByText("How Foundrie Works")).toBeInTheDocument();
  });

  it("renders all the steps", () => {
    render(<HowItWorks />);
    expect(screen.getByText("Discovery Interview")).toBeInTheDocument();
    expect(screen.getByText("Diagram-First Architecture")).toBeInTheDocument();
    expect(screen.getByText("Implementation Package")).toBeInTheDocument();
  });
});
