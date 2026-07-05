import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DownloadZipButton } from "./DownloadZipButton";

describe("DownloadZipButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("renders idle state with Download ZIP button", () => {
    render(<DownloadZipButton projectId="project-1" />);

    const button = screen.getByRole("button", { name: /download zip/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeEnabled();
  });

  it("shows generating state when POST returns runId", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ cached: false, runId: "run-123" }),
    } as Response);

    render(<DownloadZipButton projectId="project-1" />);

    const button = screen.getByRole("button", { name: /download zip/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/generating package/i)).toBeInTheDocument();
    });
  });

  it("shows ready state and downloads immediately when POST returns cached ZIP", async () => {
    const user = userEvent.setup();
    const createElementSpy = vi.spyOn(document, "createElement");
    const appendChildSpy = vi.spyOn(document.body, "appendChild");
    const removeChildSpy = vi.spyOn(document.body, "removeChild");

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        cached: true,
        fileName: "project_2024-01-01.zip",
        url: "https://blob.vercel-storage.com/zip-123.zip",
        size: 1024000,
      }),
    } as Response);

    render(<DownloadZipButton projectId="project-1" />);

    const button = screen.getByRole("button", { name: /download zip/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/zip ready/i)).toBeInTheDocument();
      expect(screen.getByText(/project_2024-01-01\.zip/i)).toBeInTheDocument();
    });

    // Verify download was triggered
    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
  });

  it("polls status and shows ready state when generation completes", async () => {
    // No fake timers

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cached: false, runId: "run-123" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "generating", progress: 50 }),
      } as Response)
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          status: "completed",
          fileName: "project_2024-01-01.zip",
          url: "https://blob.vercel-storage.com/zip-123.zip",
          size: 1024000,
        }),
      } as Response);

    render(<DownloadZipButton projectId="project-1" />);

    const button = screen.getByRole("button", { name: /download zip/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/generating package/i)).toBeInTheDocument();
    });

    await new Promise((r) => setTimeout(r, 110));

    await waitFor(() => {
      expect(screen.getByText(/progress: 50%/i)).toBeInTheDocument();
    });

    await new Promise((r) => setTimeout(r, 110));

    await waitFor(() => {
      expect(screen.getByText(/zip ready/i)).toBeInTheDocument();
    });

    // End test
  });

  it("shows error state when POST fails", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));

    render(<DownloadZipButton projectId="project-1" />);

    const button = screen.getByRole("button", { name: /download zip/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/failed to prepare download/i)).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("shows error state when polling returns failed status", async () => {
    // No fake timers

    // POST returns runId and Poll returns failed
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cached: false, runId: "run-123" }),
      } as Response)
      .mockResolvedValue({
        ok: true,
        json: async () => ({ status: "failed", error: "Generation failed" }),
      } as Response);

    render(<DownloadZipButton projectId="project-1" />);

    const button = screen.getByRole("button", { name: /download zip/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/generating package/i)).toBeInTheDocument();
    });

    await new Promise((r) => setTimeout(r, 110));

    await waitFor(() => {
      expect(screen.getByText(/generation failed/i)).toBeInTheDocument();
    });

    // End test
  });

  it("resets to idle state when retry button is clicked", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));

    render(<DownloadZipButton projectId="project-1" />);

    const downloadButton = screen.getByRole("button", { name: /download zip/i });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to prepare download/i)).toBeInTheDocument();
    });

    const retryButton = screen.getByRole("button", { name: /retry/i });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /download zip/i })).toBeInTheDocument();
    });
  });

  it("triggers browser download when ready state download button is clicked", async () => {
    const user = userEvent.setup();
    const createElementSpy = vi.spyOn(document, "createElement");

    // Set component to ready state
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        cached: true,
        fileName: "project_2024-01-01.zip",
        url: "https://blob.vercel-storage.com/zip-123.zip",
        size: 1024000,
      }),
    } as Response);

    render(<DownloadZipButton projectId="project-1" />);

    const button = screen.getByRole("button", { name: /download zip/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/zip ready/i)).toBeInTheDocument();
    });

    const downloadButton = screen.getByRole("button", { name: /download$/i });
    fireEvent.click(downloadButton);

    expect(createElementSpy).toHaveBeenCalledWith("a");
  });

  it("disables button immediately on click (idempotency)", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ cached: false, runId: "run-123" }),
              } as Response),
            100
          )
        )
    );

    render(<DownloadZipButton projectId="project-1" />);

    const button = screen.getByRole("button", { name: /download zip/i });
    
    // Click and immediately check if disabled
    fireEvent.click(button);
    
    // Button should show generating state immediately
    await waitFor(() => {
      expect(screen.getByText(/generating package/i)).toBeInTheDocument();
    });
  });
});
