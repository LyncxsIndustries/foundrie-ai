import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectHeader } from "./project-header";
import { ProjectMemberRole } from "@/lib/generated/prisma/enums";

global.fetch = vi.fn();

describe("ProjectHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response);
  });

  it("shows share button for owner", () => {
    render(<ProjectHeader projectId="proj-1" userRole={ProjectMemberRole.OWNER} />);
    expect(screen.getByRole("button", { name: /share/i })).toBeInTheDocument();
  });

  it("hides share button for collaborator", () => {
    render(<ProjectHeader projectId="proj-1" userRole={ProjectMemberRole.COLLABORATOR} />);
    expect(screen.queryByRole("button", { name: /share/i })).not.toBeInTheDocument();
  });

  it("renders member avatars", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response);

    render(<ProjectHeader projectId="proj-1" userRole={ProjectMemberRole.OWNER} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/view project members/i)).toBeInTheDocument();
    });
  });

  it("opens modal when share button clicked", async () => {
    render(<ProjectHeader projectId="proj-1" userRole={ProjectMemberRole.OWNER} />);

    const shareButton = screen.getByRole("button", { name: /share/i });
    await userEvent.click(shareButton);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("opens modal when avatars clicked", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: "u1",
          user: { name: "Owner", email: "owner@test.com" },
          role: ProjectMemberRole.OWNER,
          joinedAt: new Date(),
        },
      ],
    } as Response);

    render(<ProjectHeader projectId="proj-1" userRole={ProjectMemberRole.OWNER} />);

    await waitFor(() => {
      expect(screen.getByText("1 member")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByLabelText(/view project members/i));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });
});
