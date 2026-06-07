import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SurfaceLoading, SurfaceError, SurfaceEmpty } from "./surface-states";

describe("SurfaceLoading", () => {
  it("exposes an accessible busy state", () => {
    const { container } = render(<SurfaceLoading />);
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.getByText("Loading")).toBeInTheDocument();
  });
});

describe("SurfaceError", () => {
  it("renders as an alert with the provided message", () => {
    render(<SurfaceError message="Boom" />);
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(screen.getByText("Boom")).toBeInTheDocument();
  });

  it("renders a retry button only when onRetry is provided", () => {
    const { rerender } = render(<SurfaceError />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    const onRetry = vi.fn();
    rerender(<SurfaceError onRetry={onRetry} retryLabel="Try again" />);
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });

  it("invokes onRetry when the recovery action is clicked", async () => {
    const onRetry = vi.fn();
    render(<SurfaceError onRetry={onRetry} />);
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe("SurfaceEmpty", () => {
  it("renders the title and optional message", () => {
    render(<SurfaceEmpty title="No projects" message="Create one" />);
    expect(
      screen.getByRole("heading", { name: "No projects" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Create one")).toBeInTheDocument();
  });

  it("renders an action node when provided", () => {
    render(
      <SurfaceEmpty title="Empty" action={<button>New project</button>} />,
    );
    expect(
      screen.getByRole("button", { name: "New project" }),
    ).toBeInTheDocument();
  });
});
