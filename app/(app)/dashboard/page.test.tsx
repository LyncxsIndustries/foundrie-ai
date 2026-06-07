import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardPage from "./page";

describe("DashboardPage", () => {
  it("renders the projects header", () => {
    render(<DashboardPage />);
    expect(
      screen.getByRole("heading", { name: "Projects" }),
    ).toBeInTheDocument();
  });

  it("shows the empty state when there are no projects", () => {
    render(<DashboardPage />);
    expect(
      screen.getByRole("heading", { name: "No projects yet" }),
    ).toBeInTheDocument();
  });
});
