import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkspaceShell, SurfaceHeader } from "./workspace-shell";

describe("WorkspaceShell", () => {
  it("renders main children", () => {
    render(
      <WorkspaceShell>
        <p>Main content</p>
      </WorkspaceShell>,
    );
    expect(screen.getByText("Main content")).toBeInTheDocument();
  });

  it("renders nav and inspector regions only when provided", () => {
    const { rerender } = render(
      <WorkspaceShell>
        <p>content</p>
      </WorkspaceShell>,
    );
    expect(screen.queryByText("Nav region")).not.toBeInTheDocument();

    rerender(
      <WorkspaceShell
        nav={<span>Nav region</span>}
        inspector={<span>Inspector region</span>}
      >
        <p>content</p>
      </WorkspaceShell>,
    );
    expect(screen.getByText("Nav region")).toBeInTheDocument();
    expect(screen.getByText("Inspector region")).toBeInTheDocument();
  });
});

describe("SurfaceHeader", () => {
  it("renders the title as a heading and optional description and actions", () => {
    render(
      <SurfaceHeader
        title="Projects"
        description="Your workspaces"
        actions={<button>New</button>}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Projects" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Your workspaces")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New" })).toBeInTheDocument();
  });
});
