import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero } from "./hero";

describe("Hero", () => {
  it("renders main heading", () => {
    render(<Hero />);
    expect(
      screen.getByText(/From idea to implementation-ready architecture/i)
    ).toBeInTheDocument();
  });

  it("renders subtitle with key value prop", () => {
    render(<Hero />);
    expect(screen.getByText(/diagram-first package/i)).toBeInTheDocument();
  });

  it("renders CTA buttons", () => {
    render(<Hero />);
    expect(screen.getByText("Start Your Project")).toBeInTheDocument();
    expect(screen.getByText("View Pricing")).toBeInTheDocument();
  });
});
