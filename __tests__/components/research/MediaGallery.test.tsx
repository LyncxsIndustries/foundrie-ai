import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MediaGallery } from "@/components/research/MediaGallery";

// Mock fetch
global.fetch = vi.fn();

describe("MediaGallery", () => {
  const mockFiles = [
    {
      id: "file1",
      fileName: "screenshot1.png",
      storageUrl: "https://example.com/screenshot1.png",
      mimeType: "image/png",
      category: "inspiration",
      tags: ["dark-theme", "dashboard"],
      aiDescription: "A dark-themed dashboard design",
      fileSize: 1024000,
      createdAt: new Date("2024-01-01"),
    },
    {
      id: "file2",
      fileName: "wireframe1.png",
      storageUrl: "https://example.com/wireframe1.png",
      mimeType: "image/png",
      category: "wireframes",
      tags: ["mobile", "onboarding"],
      aiDescription: null,
      fileSize: 512000,
      createdAt: new Date("2024-01-02"),
    },
  ];

  const mockOnRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when no files", () => {
    render(
      <MediaGallery files={[]} projectId="proj1" onRefresh={mockOnRefresh} />
    );

    expect(
      screen.getByText(/no research files uploaded yet/i)
    ).toBeInTheDocument();
  });

  it("renders files in grid", () => {
    render(
      <MediaGallery
        files={mockFiles}
        projectId="proj1"
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText("screenshot1.png")).toBeInTheDocument();
    expect(screen.getByText("wireframe1.png")).toBeInTheDocument();
  });

  it("filters files by search query", async () => {
    render(
      <MediaGallery
        files={mockFiles}
        projectId="proj1"
        onRefresh={mockOnRefresh}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search by filename or tags/i);
    fireEvent.change(searchInput, { target: { value: "wireframe" } });

    await waitFor(() => {
      expect(screen.queryByText("screenshot1.png")).not.toBeInTheDocument();
      expect(screen.getByText("wireframe1.png")).toBeInTheDocument();
    });
  });

  it("filters files by category", async () => {
    render(
      <MediaGallery
        files={mockFiles}
        projectId="proj1"
        onRefresh={mockOnRefresh}
      />
    );

    // Find category filter specifically by text content
    const categoryFilter = screen.getByRole("combobox", { name: /all categories/i });
    fireEvent.click(categoryFilter);

    // Select wireframes category
    const wireframesOption = await screen.findByText(/wireframes/i);
    fireEvent.click(wireframesOption);

    await waitFor(() => {
      expect(screen.queryByText("screenshot1.png")).not.toBeInTheDocument();
      expect(screen.getByText("wireframe1.png")).toBeInTheDocument();
    });
  });

  it("enters and exits selection mode", async () => {
    render(
      <MediaGallery
        files={mockFiles}
        projectId="proj1"
        onRefresh={mockOnRefresh}
      />
    );

    const selectButton = screen.getByRole("button", { name: /select/i });
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /exit selection/i })).toBeInTheDocument();
    });
  });
});
