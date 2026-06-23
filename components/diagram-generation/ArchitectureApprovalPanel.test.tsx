import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArchitectureApprovalPanel } from "./ArchitectureApprovalPanel";

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ArchitectureApprovalPanel", () => {
  const baseDiagrams = [
    { id: "d1", name: "System Context", version: 1, status: "DONE" },
    { id: "d2", name: "Container", version: 1, status: "DONE" },
  ];

  it("renders PENDING status when not approved", () => {
    render(
      <ArchitectureApprovalPanel
        projectId="p1"
        diagrams={baseDiagrams}
        isApproved={false}
        onApproved={vi.fn()}
      />
    );

    expect(screen.getByText("PENDING")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Approve Architecture/ })).toBeEnabled();
  });

  it("renders APPROVED status when approved", () => {
    render(
      <ArchitectureApprovalPanel
        projectId="p1"
        diagrams={baseDiagrams}
        isApproved={true}
        onApproved={vi.fn()}
      />
    );

    expect(screen.getByText("APPROVED")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Approve Architecture/ })).not.toBeInTheDocument();
  });

  it("disables button when diagrams are not all DONE", () => {
    const mixed = [
      { id: "d1", name: "System Context", version: 1, status: "DONE" },
      { id: "d2", name: "Container", version: 1, status: "GENERATING" },
    ];

    render(
      <ArchitectureApprovalPanel
        projectId="p1"
        diagrams={mixed}
        isApproved={false}
        onApproved={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /Approve Architecture/ })).toBeDisabled();
  });

  it("calls onApproved after successful POST", async () => {
    const onApproved = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "plan-1", status: "APPROVED" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <ArchitectureApprovalPanel
        projectId="p1"
        diagrams={baseDiagrams}
        isApproved={false}
        onApproved={onApproved}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /Approve Architecture/ }));

    await waitFor(() => {
      expect(onApproved).toHaveBeenCalled();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/diagrams/p1/approve",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("shows error message when POST fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Internal error" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <ArchitectureApprovalPanel
        projectId="p1"
        diagrams={baseDiagrams}
        isApproved={false}
        onApproved={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /Approve Architecture/ }));

    expect(await screen.findByText("Internal error")).toBeInTheDocument();
  });

  it("disables button when no diagrams exist", () => {
    render(
      <ArchitectureApprovalPanel
        projectId="p1"
        diagrams={[]}
        isApproved={false}
        onApproved={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /Approve Architecture/ })).toBeDisabled();
    expect(screen.getByText("No diagrams generated yet.")).toBeInTheDocument();
  });
});
