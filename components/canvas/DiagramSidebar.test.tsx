import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DiagramSidebar } from "./DiagramSidebar";

describe("DiagramSidebar", () => {
  it("renders category tabs", () => {
    render(<DiagramSidebar />);
    const tabs = screen.getByRole("tablist");
    expect(tabs).toBeInTheDocument();
  });

  it("renders diagram types for architectural category by default", () => {
    render(<DiagramSidebar />);
    const systemContextElements = screen.getAllByText(/System Context/i);
    expect(systemContextElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/Container \(C4 L2\)/i)).toBeInTheDocument();
  });

  it("calls onTypeSelect when diagram type is clicked", async () => {
    const user = userEvent.setup();
    const onTypeSelect = vi.fn();
    render(<DiagramSidebar onTypeSelect={onTypeSelect} />);
    
    const typeButton = screen.getByRole("button", { name: /System Context/i });
    await user.click(typeButton);
    
    expect(onTypeSelect).toHaveBeenCalledWith("system-context");
  });

  it("highlights selected diagram type", () => {
    render(<DiagramSidebar selectedType="system-context" />);
    const selectedButton = screen.getByRole("button", { name: /System Context/i });
    expect(selectedButton).toHaveClass("border-accent-primary");
  });

  it("shows shape palette placeholder when type is selected", () => {
    render(<DiagramSidebar selectedType="erd" />);
    expect(screen.getByText(/Shape Palette/i)).toBeInTheDocument();
    expect(screen.getByText(/Features 16-17/i)).toBeInTheDocument();
  });

  it("does not show shape palette when no type selected", () => {
    render(<DiagramSidebar />);
    expect(screen.queryByText(/Shape Palette/i)).not.toBeInTheDocument();
  });

  it("displays category info", () => {
    render(<DiagramSidebar />);
    expect(screen.getByText("Architectural")).toBeInTheDocument();
    expect(screen.getByText(/C4 context/i)).toBeInTheDocument();
  });
});
