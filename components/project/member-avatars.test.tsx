import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemberAvatars } from "./member-avatars";
import { ProjectMemberRole } from "@/lib/generated/prisma/enums";

global.fetch = vi.fn();

describe("MemberAvatars", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response);

    render(<MemberAvatars projectId="proj-1" onOpenModal={vi.fn()} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("renders member count", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: "u1",
          user: { name: "Owner", email: "owner@test.com" },
          role: ProjectMemberRole.OWNER,
          joinedAt: new Date(),
        },
        {
          id: "m1",
          user: { name: "Member", email: "member@test.com" },
          role: ProjectMemberRole.COLLABORATOR,
          joinedAt: new Date(),
        },
      ],
    } as Response);

    render(<MemberAvatars projectId="proj-1" onOpenModal={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("2 members")).toBeInTheDocument();
    });
  });

  it("shows overflow indicator for >4 members", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => Array.from({ length: 7 }, (_, i) => ({
        id: `m${i}`,
        user: { name: `User ${i}`, email: `user${i}@test.com` },
        role: ProjectMemberRole.COLLABORATOR,
        joinedAt: new Date(),
      })),
    } as Response);

    render(<MemberAvatars projectId="proj-1" onOpenModal={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("+3")).toBeInTheDocument();
    });
  });

  it("calls onOpenModal when clicked", async () => {
    const onOpenModal = vi.fn();
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

    render(<MemberAvatars projectId="proj-1" onOpenModal={onOpenModal} />);

    await waitFor(() => {
      expect(screen.getByText("1 member")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button"));
    expect(onOpenModal).toHaveBeenCalledOnce();
  });

  it("handles fetch error gracefully", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

    render(<MemberAvatars projectId="proj-1" onOpenModal={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole("button")).not.toBeDisabled();
    });
  });
});
