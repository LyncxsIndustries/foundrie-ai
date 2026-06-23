import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DiagramVersionHistory } from "./DiagramVersionHistory";

beforeEach(() => {
  vi.restoreAllMocks();
  window.confirm = vi.fn().mockReturnValue(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DiagramVersionHistory", () => {
  it("renders loading state then version list", async () => {
    const versions = [
      { id: "v1", diagramId: "d1", version: 1, pngStorageUrl: null, errorMessage: null, createdAt: "2026-06-20T00:00:00Z" },
      { id: "v2", diagramId: "d1", version: 2, pngStorageUrl: null, errorMessage: null, createdAt: "2026-06-21T00:00:00Z" },
    ];
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => versions,
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <DiagramVersionHistory
        projectId="p1"
        diagramId="d1"
        currentVersion={3}
        onRestored={vi.fn()}
      />
    );

    // Shows current version label
    expect(screen.getByText("(current: v3)")).toBeInTheDocument();

    // After loading, shows versions
    await waitFor(() => {
      expect(screen.getByText("Version 1")).toBeInTheDocument();
    });
    expect(screen.getByText("Version 2")).toBeInTheDocument();
  });

  it("shows empty state when no versions exist", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <DiagramVersionHistory
        projectId="p1"
        diagramId="d1"
        currentVersion={1}
        onRestored={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("No prior versions recorded.")).toBeInTheDocument();
    });
  });

  it("calls onRestored after successful restore", async () => {
    const versions = [
      { id: "v1", diagramId: "d1", version: 1, pngStorageUrl: null, errorMessage: null, createdAt: "2026-06-20T00:00:00Z" },
    ];
    const onRestored = vi.fn();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => versions }) // initial GET
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "d1", version: 2 }) }) // POST restore
      .mockResolvedValueOnce({ ok: true, json: async () => [] }); // re-fetch after restore
    vi.stubGlobal("fetch", fetchMock);

    render(
      <DiagramVersionHistory
        projectId="p1"
        diagramId="d1"
        currentVersion={2}
        onRestored={onRestored}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Version 1")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /Restore/ }));

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("Are you sure"));

    await waitFor(() => {
      expect(onRestored).toHaveBeenCalled();
    });
  });

  it("shows error on failed fetch", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <DiagramVersionHistory
        projectId="p1"
        diagramId="d1"
        currentVersion={1}
        onRestored={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Failed to load version history.")).toBeInTheDocument();
    });
  });
});
