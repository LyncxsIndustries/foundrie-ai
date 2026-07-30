import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";

const useUserMock = vi.hoisted(() => vi.fn());
const posthogReset = vi.hoisted(() => vi.fn());
const posthogIdentify = vi.hoisted(() => vi.fn());

vi.mock("@clerk/nextjs", () => ({
  useUser: () => useUserMock(),
}));

vi.mock("@liveblocks/react", () => ({
  LiveblocksProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="liveblocks-provider">{children}</div>
  ),
}));

vi.mock("posthog-js", () => ({
  default: {
    reset: posthogReset,
    identify: posthogIdentify,
  },
}));

import { LiveblocksReactProvider } from "./provider";

beforeEach(() => {
  useUserMock.mockReset();
  posthogReset.mockReset();
  posthogIdentify.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("LiveblocksReactProvider — Feature 59 signed-out reset", () => {
  it("calls posthog.reset() on every signed-out mount even when never identified in this session", async () => {
    useUserMock.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      user: null,
    });

    render(
      <LiveblocksReactProvider>
        <span>child</span>
      </LiveblocksReactProvider>,
    );

    await waitFor(() => {
      expect(posthogReset).toHaveBeenCalledTimes(1);
    });
    expect(posthogIdentify).not.toHaveBeenCalled();
  });

  it("does not call posthog.reset() while Clerk auth is still loading", async () => {
    useUserMock.mockReturnValue({
      isLoaded: false,
      isSignedIn: undefined,
      user: undefined,
    });

    render(
      <LiveblocksReactProvider>
        <span>child</span>
      </LiveblocksReactProvider>,
    );

    await waitFor(() => {
      expect(useUserMock).toHaveBeenCalled();
    });
    expect(posthogReset).not.toHaveBeenCalled();
    expect(posthogIdentify).not.toHaveBeenCalled();
  });

  it("identifies when signed in and resets when transitioning to signed out", async () => {
    useUserMock.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      user: {
        id: "user_abc",
        fullName: "Test User",
        primaryEmailAddress: { emailAddress: "test@example.com" },
      },
    });

    const { rerender } = render(
      <LiveblocksReactProvider>
        <span>child</span>
      </LiveblocksReactProvider>,
    );

    await waitFor(() => {
      expect(posthogIdentify).toHaveBeenCalledWith("user_abc", {
        email: "test@example.com",
        name: "Test User",
      });
    });

    useUserMock.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      user: null,
    });

    rerender(
      <LiveblocksReactProvider>
        <span>child</span>
      </LiveblocksReactProvider>,
    );

    await waitFor(() => {
      // One reset may occur before re-identify on user switch; signed-out path must reset.
      expect(posthogReset).toHaveBeenCalled();
    });
  });

  it("resets before identifying a different signed-in user", async () => {
    useUserMock.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      user: {
        id: "user_a",
        fullName: "User A",
        primaryEmailAddress: { emailAddress: "a@example.com" },
      },
    });

    const { rerender } = render(
      <LiveblocksReactProvider>
        <span>child</span>
      </LiveblocksReactProvider>,
    );

    await waitFor(() => {
      expect(posthogIdentify).toHaveBeenCalledWith("user_a", expect.any(Object));
    });

    posthogReset.mockClear();
    posthogIdentify.mockClear();

    useUserMock.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      user: {
        id: "user_b",
        fullName: "User B",
        primaryEmailAddress: { emailAddress: "b@example.com" },
      },
    });

    rerender(
      <LiveblocksReactProvider>
        <span>child</span>
      </LiveblocksReactProvider>,
    );

    await waitFor(() => {
      expect(posthogReset).toHaveBeenCalledTimes(1);
      expect(posthogIdentify).toHaveBeenCalledWith("user_b", {
        email: "b@example.com",
        name: "User B",
      });
    });
  });
});
