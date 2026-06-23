import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarketingNav } from "./marketing-nav";

describe("MarketingNav", () => {
  it("renders brand name", () => {
    render(<MarketingNav />);
    expect(screen.getByText("Foundrie")).toBeInTheDocument();
  });

  it("renders all navigation links", () => {
    render(<MarketingNav />);
    expect(screen.getByText("Pricing")).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Get Started")).toBeInTheDocument();
  });

  it("has correct link targets", () => {
    render(<MarketingNav />);
    const brandLink = screen.getByText("Foundrie").closest("a");
    expect(brandLink).toHaveAttribute("href", "/");
  });
});
