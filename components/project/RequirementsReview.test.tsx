import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RequirementsReview } from "./RequirementsReview";

describe("RequirementsReview", () => {
  const mockInitialData = {
    id: "req-1",
    content: {
      functional: ["User can log in", "User can view dashboard"],
      nonFunctional: ["System must support 1000 concurrent users"],
      hidden: ["Email validation required"],
      scale: { users: "1000", requests: "10000/day" },
      adrs: [
        {
          id: "adr-1",
          title: "Use PostgreSQL",
          decision: "PostgreSQL for primary database",
          rationale: "Strong ACID compliance and performance",
          date: "2024-01-01",
        },
      ],
    },
    updatedAt: "2024-01-02T00:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders all requirement sections", () => {
    render(
      <RequirementsReview projectId="proj-1" initialData={mockInitialData} />
    );

    expect(screen.getByText("Functional Requirements")).toBeInTheDocument();
    expect(screen.getByText("Non-Functional Requirements")).toBeInTheDocument();
    expect(screen.getByText("Hidden Requirements")).toBeInTheDocument();
    expect(screen.getByText("Scale Estimates")).toBeInTheDocument();
    expect(
      screen.getByText("Architecture Decision Records")
    ).toBeInTheDocument();
  });

  it("displays functional requirements content", () => {
    render(
      <RequirementsReview projectId="proj-1" initialData={mockInitialData} />
    );

    const textarea = screen.getAllByRole("textbox")[0];
    expect(textarea).toHaveValue(
      "User can log in\nUser can view dashboard"
    );
  });

  it("updates local state when editing", () => {
    render(
      <RequirementsReview projectId="proj-1" initialData={mockInitialData} />
    );

    const textarea = screen.getAllByRole("textbox")[0];
    fireEvent.change(textarea, {
      target: { value: "New requirement\nAnother requirement" },
    });

    expect(textarea).toHaveValue("New requirement\nAnother requirement");
  });

  it("calls API when saving changes", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ id: "req-1", content: {}, updatedAt: new Date() }),
    } as Response);

    render(
      <RequirementsReview projectId="proj-1" initialData={mockInitialData} />
    );

    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/requirements/proj-1",
        expect.objectContaining({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        })
      );
    });
  });

  it("shows success message after successful save", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ id: "req-1", content: {}, updatedAt: new Date() }),
    } as Response);

    render(
      <RequirementsReview projectId="proj-1" initialData={mockInitialData} />
    );

    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/saved successfully/i)).toBeInTheDocument();
    });
  });

  it("shows error message on save failure", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
    } as Response);

    render(
      <RequirementsReview projectId="proj-1" initialData={mockInitialData} />
    );

    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to save/i)).toBeInTheDocument();
    });
  });

  it("displays ADRs correctly", () => {
    render(
      <RequirementsReview projectId="proj-1" initialData={mockInitialData} />
    );

    expect(screen.getByText("Use PostgreSQL")).toBeInTheDocument();
    expect(
      screen.getByText(/PostgreSQL for primary database/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Strong ACID compliance and performance/)
    ).toBeInTheDocument();
    expect(screen.getByText("2024-01-01")).toBeInTheDocument();
  });

  it("shows item counts in badges", () => {
    render(
      <RequirementsReview projectId="proj-1" initialData={mockInitialData} />
    );

    expect(screen.getByText("2 items")).toBeInTheDocument(); // functional
    const oneItemBadges = screen.getAllByText("1 items");
    expect(oneItemBadges.length).toBeGreaterThanOrEqual(1); // nonFunctional and hidden
  });
});
