import { describe, it, expect, vi, beforeEach } from "vitest";
import { auth } from "@clerk/nextjs/server";
import { render, screen } from "@testing-library/react";
import AppLayout from "@/app/(app)/layout";
import DashboardClonePage from "@/app/dashboard-clone/page";

vi.mock("@clerk/nextjs/server", () => ({
  auth: {
    protect: vi.fn(),
  },
}));

vi.mock("@/components/app-shell/top-nav", () => ({
  TopNav: () => <div data-testid="top-nav">TopNav</div>,
}));

vi.mock("@/components/dashboard-clone/MotionProvider", () => ({
  MotionProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="motion-provider">{children}</div>,
}));

vi.mock("@/components/dashboard-clone/DashboardClone", () => ({
  DashboardClone: () => <div data-testid="dashboard-clone">DashboardClone</div>,
}));

describe("Auth Protection in Server Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("AppLayout", () => {
    it("blocks rendering and throws when unauthenticated", async () => {
      vi.mocked(auth.protect).mockImplementationOnce(() => {
        throw new Error("NEXT_REDIRECT");
      });

      await expect(AppLayout({ children: <div>Child</div> })).rejects.toThrow("NEXT_REDIRECT");
      expect(auth.protect).toHaveBeenCalledTimes(1);
    });

    it("renders children when authenticated", async () => {
      vi.mocked(auth.protect).mockResolvedValueOnce(undefined as never);

      const ui = await AppLayout({ children: <div data-testid="child">Child</div> });
      render(ui);
      
      expect(screen.getByTestId("top-nav")).toBeInTheDocument();
      expect(screen.getByTestId("child")).toBeInTheDocument();
      expect(auth.protect).toHaveBeenCalledTimes(1);
    });
  });

  describe("DashboardClonePage", () => {
    it("blocks rendering and throws when unauthenticated", async () => {
      vi.mocked(auth.protect).mockImplementationOnce(() => {
        throw new Error("NEXT_REDIRECT");
      });

      await expect(DashboardClonePage()).rejects.toThrow("NEXT_REDIRECT");
      expect(auth.protect).toHaveBeenCalledTimes(1);
    });

    it("renders content when authenticated", async () => {
      vi.mocked(auth.protect).mockResolvedValueOnce(undefined as never);

      const ui = await DashboardClonePage();
      render(ui);
      
      expect(screen.getByTestId("motion-provider")).toBeInTheDocument();
      expect(screen.getByTestId("dashboard-clone")).toBeInTheDocument();
      expect(auth.protect).toHaveBeenCalledTimes(1);
    });
  });
});
