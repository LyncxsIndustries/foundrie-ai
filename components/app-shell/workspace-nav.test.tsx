import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { WorkspaceNav } from "./workspace-nav";

const pathname = vi.hoisted(() => ({ value: "/dashboard" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.value,
}));

beforeEach(() => {
  pathname.value = "/dashboard";
});

describe("WorkspaceNav", () => {
  it("renders the dashboard link", () => {
    render(<WorkspaceNav />);
    expect(screen.getByRole("link", { name: /Dashboard/ })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });

  it("marks the dashboard active on the dashboard path", () => {
    render(<WorkspaceNav />);
    expect(screen.getByRole("link", { current: "page" })).toHaveTextContent(
      "Dashboard",
    );
  });

  it("does not mark the dashboard active on unrelated project routes", () => {
    pathname.value = "/projects/p1";
    render(<WorkspaceNav />);
    expect(
      screen.queryByRole("link", { current: "page" }),
    ).not.toBeInTheDocument();
  });

  it("invokes onNavigate when a link is chosen", async () => {
    const onNavigate = vi.fn();
    render(<WorkspaceNav onNavigate={onNavigate} />);
    await userEvent.click(screen.getByRole("link", { name: /Dashboard/ }));
    expect(onNavigate).toHaveBeenCalledOnce();
  });
});
