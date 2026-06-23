import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CtaSection } from "./cta-section";

describe("CtaSection", () => {
  it("renders the heading and CTA", () => {
    render(<CtaSection />);
    expect(screen.getByText("Ready to build something?")).toBeInTheDocument();
    expect(screen.getByText("Start Your First Project")).toBeInTheDocument();
  });
});
