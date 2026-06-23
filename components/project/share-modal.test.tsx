import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShareModal } from "./share-modal";
import { ProjectMemberRole } from "@/lib/generated/prisma/enums";

global.fetch = vi.fn();
global.confirm = vi.fn();

describe("ShareModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockMembers = [
    {
      id: "u1",
      user: { name: "Owner", email: "owner@test.com" },
      role: ProjectMemberRole.OWNER,
      joinedAt: new Date(),
    },
    {
      id: "m1",
      user: { name: "Collaborator", email: "collab@test.com" },
      role: ProjectMemberRole.COLLABORATOR,
      joinedAt: new Date(),
    },
  ];

  it("shows invite form for owner", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockMembers,
    } as Response);

    render(
      <ShareModal
        projectId="proj-1"
        userRole={ProjectMemberRole.OWNER}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/invite by email/i)).toBeInTheDocument();
    });
  });

  it("hides invite form for collaborator", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockMembers,
    } as Response);

    render(
      <ShareModal
        projectId="proj-1"
        userRole={ProjectMemberRole.COLLABORATOR}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Project Members")).toBeInTheDocument();
    });

    expect(screen.queryByLabelText(/invite by email/i)).not.toBeInTheDocument();
  });

  it("displays member list with roles", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockMembers,
    } as Response);

    render(
      <ShareModal
        projectId="proj-1"
        userRole={ProjectMemberRole.OWNER}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Owner")).toBeInTheDocument();
      expect(screen.getByText("Collaborator")).toBeInTheDocument();
    });
  });

  it("handles successful invite", async () => {
    vi.mocked(fetch).mockImplementation((url) => {
      if (typeof url === "string" && url.includes("/members") && !url.includes("m1")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: "m2" }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockMembers,
      } as Response);
    });

    render(
      <ShareModal
        projectId="proj-1"
        userRole={ProjectMemberRole.OWNER}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/invite by email/i)).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/invite by email/i);
    await userEvent.type(input, "new@test.com");
    await userEvent.click(screen.getByRole("button", { name: "" }));

    await waitFor(() => {
      expect(screen.getByText(/invited successfully/i)).toBeInTheDocument();
    });
  });

  it("shows error for invalid invite", async () => {
    vi.mocked(fetch).mockImplementation((url) => {
      if (typeof url === "string" && url.includes("/members") && !url.includes("m1")) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ message: "User not found. They must sign up first." }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockMembers,
      } as Response);
    });

    render(
      <ShareModal
        projectId="proj-1"
        userRole={ProjectMemberRole.OWNER}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/invite by email/i)).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/invite by email/i);
    await userEvent.type(input, "nonexistent@test.com");
    await userEvent.click(screen.getByRole("button", { name: "" }));

    await waitFor(() => {
      expect(screen.getByText(/user not found/i)).toBeInTheDocument();
    });
  });

  it("handles member removal", async () => {
    vi.mocked(confirm).mockReturnValue(true);
    vi.mocked(fetch).mockImplementation((url, options) => {
      if (options?.method === "DELETE") {
        return Promise.resolve({ ok: true } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockMembers,
      } as Response);
    });

    render(
      <ShareModal
        projectId="proj-1"
        userRole={ProjectMemberRole.OWNER}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Collaborator")).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByRole("button");
    const removeButton = removeButtons.find((btn) =>
      btn.querySelector("svg")?.classList.contains("lucide-trash-2")
    );

    if (removeButton) {
      await userEvent.click(removeButton);
      expect(confirm).toHaveBeenCalled();
    }
  });

  it("owner cannot remove themselves", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockMembers,
    } as Response);

    render(
      <ShareModal
        projectId="proj-1"
        userRole={ProjectMemberRole.OWNER}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Owner")).toBeInTheDocument();
    });

    const allButtons = screen.getAllByRole("button");
    const ownerRow = screen.getByText("Owner").closest("div");
    const removeInOwnerRow = ownerRow?.querySelector('[class*="lucide-trash"]');

    expect(removeInOwnerRow).not.toBeInTheDocument();
  });
});
