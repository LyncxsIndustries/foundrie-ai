import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectSettings } from "./ProjectSettings";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const mockProject = {
  id: "proj-1",
  name: "Test Project",
  description: "Test description",
  status: "DISCOVERY",
  lastZipUrl: "https://blob.example.com/test.zip",
  lastZipFileName: "test.zip",
  lastZipGeneratedAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

describe("ProjectSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders project information", () => {
    render(<ProjectSettings project={mockProject} />);

    expect(screen.getByLabelText("Name")).toHaveValue("Test Project");
    expect(screen.getByLabelText("Description")).toHaveValue("Test description");
  });

  it("saves updated project information", async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ project: mockProject }), { status: 200 })
    );

    render(<ProjectSettings project={mockProject} />);

    const nameInput = screen.getByLabelText("Name");
    await user.clear(nameInput);
    await user.type(nameInput, "Updated Project");

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    await user.click(saveButton);

    // Wait for the API call
    await waitFor(
      () => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/projects/proj-1",
          expect.objectContaining({
            method: "PATCH",
            body: JSON.stringify({
              name: "Updated Project",
              description: "Test description",
            }),
          })
        );
      },
      { timeout: 15000 }
    );

    // Wait for success message with longer timeout
    await waitFor(
      () => {
        expect(screen.getByText("Project updated successfully")).toBeInTheDocument();
      },
      { timeout: 15000 }
    );
  }, 20000); // Increase test timeout to 20 seconds

  it("shows error on save failure", async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(null, { status: 500 })
    );

    render(<ProjectSettings project={mockProject} />);

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Failed to update project")).toBeInTheDocument();
    });
  });

  it("disables save button when name is empty", async () => {
    const user = userEvent.setup();
    render(<ProjectSettings project={mockProject} />);

    const nameInput = screen.getByLabelText("Name");
    await user.clear(nameInput);

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    expect(saveButton).toBeDisabled();
  });

  it("triggers requirements regeneration", async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: "run-1" }), { status: 202 })
    );

    render(<ProjectSettings project={mockProject} />);

    const regenerateButtons = screen.getAllByRole("button", {
      name: /regenerate/i,
    });
    await user.click(regenerateButtons[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/requirements/proj-1/generate",
        { method: "POST" }
      );
    });

    expect(
      screen.getByText("Requirements regeneration started")
    ).toBeInTheDocument();
  });

  it("clears ZIP metadata", async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );

    render(<ProjectSettings project={mockProject} />);

    const clearButton = screen.getByRole("button", { name: /clear zip/i });
    await user.click(clearButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/projects/proj-1/clear-zip",
        { method: "POST" }
      );
    });

    expect(screen.getByText("ZIP metadata cleared")).toBeInTheDocument();
  });

  it("disables clear ZIP button when no ZIP exists", () => {
    const projectWithoutZip = { ...mockProject, lastZipUrl: null };
    render(<ProjectSettings project={projectWithoutZip} />);

    const clearButton = screen.getByRole("button", { name: /clear zip/i });
    expect(clearButton).toBeDisabled();
  });

  it("shows delete confirmation dialog", async () => {
    const user = userEvent.setup();
    render(<ProjectSettings project={mockProject} />);

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    await user.click(deleteButton);

    expect(screen.getByText("Are you absolutely sure?")).toBeInTheDocument();
    expect(
      screen.getByText(/permanently delete the project/i)
    ).toBeInTheDocument();
  });

  it("deletes project on confirmation", async () => {
    const user = userEvent.setup();
    const mockPush = vi.fn();
    vi.mocked(global.fetch).mockResolvedValue(new Response(null, { status: 204 }));

    vi.doMock("next/navigation", () => ({
      useRouter: () => ({
        push: mockPush,
        refresh: vi.fn(),
      }),
    }));

    render(<ProjectSettings project={mockProject} />);

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    await user.click(deleteButton);

    const confirmButton = screen.getByRole("button", {
      name: /delete project/i,
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/projects/proj-1", {
        method: "DELETE",
      });
    });
  });
});
