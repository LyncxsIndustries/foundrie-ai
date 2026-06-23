import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NewProjectPage from "./page";

import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

describe("NewProjectPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders the form", () => {
    render(<NewProjectPage />);
    expect(screen.getByText("What are you building?")).toBeInTheDocument();
    expect(screen.getByLabelText(/Project Description/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Start Discovery/i })).toBeInTheDocument();
  });

  it("submits the form and redirects", async () => {
    const mockPush = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "123" }),
    });

    render(<NewProjectPage />);
    
    const textarea = screen.getByLabelText(/Project Description/i);
    fireEvent.change(textarea, { target: { value: "A cool new app" } });
    
    const button = screen.getByRole("button", { name: /Start Discovery/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "A cool new app" }),
      });
      expect(mockPush).toHaveBeenCalledWith("/projects/123/discovery");
    });
  });

  it("handles errors", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    render(<NewProjectPage />);
    
    const textarea = screen.getByLabelText(/Project Description/i);
    fireEvent.change(textarea, { target: { value: "A cool new app" } });
    
    const button = screen.getByRole("button", { name: /Start Discovery/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Failed to create project")).toBeInTheDocument();
    });
  });
});
