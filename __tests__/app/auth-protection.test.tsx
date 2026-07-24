import { describe, it, expect, vi, beforeEach } from "vitest";
import { auth } from "@clerk/nextjs/server";
import { render, screen } from "@testing-library/react";
import AppLayout from "@/app/(app)/layout";
import DashboardClonePage from "@/app/dashboard-clone/page";

vi.mock("@clerk/nextjs/server", () => {
  const protect = vi.fn();
  return {
    auth: Object.assign(vi.fn(() => ({ protect })), { protect }),
  };
});

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
      const mockAuth = { userId: "user_123", sessionId: "sess_123" };
      vi.mocked(auth.protect).mockReturnValueOnce(mockAuth as any);

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
      const mockAuth = { userId: "user_123", sessionId: "sess_123" };
      vi.mocked(auth.protect).mockReturnValueOnce(mockAuth as any);

      const ui = await DashboardClonePage();
      render(ui);
      
      expect(screen.getByTestId("motion-provider")).toBeInTheDocument();
      expect(screen.getByTestId("dashboard-clone")).toBeInTheDocument();
      expect(auth.protect).toHaveBeenCalledTimes(1);
    });
  });

  describe("API Route Handler", () => {
    const dummyApiHandler = async () => {
      auth().protect();
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    };

    it("blocks request and throws when unauthenticated", async () => {
      vi.mocked(auth.protect).mockImplementationOnce(() => {
        throw new Error("NEXT_REDIRECT");
      });

      await expect(dummyApiHandler()).rejects.toThrow("NEXT_REDIRECT");
      expect(auth.protect).toHaveBeenCalledTimes(1);
    });

    it("processes request when authenticated", async () => {
      const mockAuth = { userId: "user_123", sessionId: "sess_123" };
      vi.mocked(auth.protect).mockReturnValueOnce(mockAuth as any);

      const response = await dummyApiHandler();
      expect(response.status).toBe(200);
      expect(auth.protect).toHaveBeenCalledTimes(1);
    });
  });
});
