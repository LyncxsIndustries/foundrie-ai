import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PricingTable } from "./pricing-table";

describe("PricingTable", () => {
  it("renders all pricing tiers", () => {
    render(<PricingTable />);
    expect(screen.getByText("FREE")).toBeInTheDocument();
    expect(screen.getByText("PRO")).toBeInTheDocument();
    expect(screen.getByText("TEAM")).toBeInTheDocument();
    expect(screen.getByText("ENTERPRISE")).toBeInTheDocument();
  });

  it("renders correct pricing", () => {
    render(<PricingTable />);
    expect(screen.getByText("$0")).toBeInTheDocument();
    expect(screen.getByText("$29")).toBeInTheDocument();
    expect(screen.getByText("$99")).toBeInTheDocument();
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });

  it("renders CTAs", () => {
    render(<PricingTable />);
    expect(screen.getAllByText("Get Started")).toHaveLength(1);
    expect(screen.getAllByText("Start Free Trial")).toHaveLength(2);
    expect(screen.getByText("Contact Sales")).toBeInTheDocument();
  });
});
