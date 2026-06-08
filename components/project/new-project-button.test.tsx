import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NewProjectButton } from "./new-project-button";

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

beforeEach(() => {
  router.push.mockReset();
  router.refresh.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("NewProjectButton", () => {
  it("creates a project and routes to it on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ project: { id: "new1" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<NewProjectButton />);
    await userEvent.click(screen.getByRole("button", { name: /New project/ }));

    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith("/projects/new1");
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/projects",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("surfaces the API error and re-enables on failure", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Project limit reached for your plan." }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<NewProjectButton />);
    await userEvent.click(screen.getByRole("button", { name: /New project/ }));

    expect(
      await screen.findByText("Project limit reached for your plan."),
    ).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /New project/ })).toBeEnabled();
  });
});
