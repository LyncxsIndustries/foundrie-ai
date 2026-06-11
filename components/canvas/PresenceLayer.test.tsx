import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { PresenceLayer } from "./PresenceLayer";

const mockUseOthersConnectionIds = vi.fn(() => []);
const mockUseOther = vi.fn(() => null);

vi.mock("@liveblocks/react", () => ({
  useOthersConnectionIds: () => mockUseOthersConnectionIds(),
  useOther: (connectionId: number, selector?: any) => mockUseOther(connectionId, selector),
}));

describe("components/canvas/PresenceLayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing when no other users", () => {
    mockUseOthersConnectionIds.mockReturnValue([]);

    const { container } = render(<PresenceLayer />);
    expect(container).toBeTruthy();
  });

  it("renders cursors for connected users", () => {
    mockUseOthersConnectionIds.mockReturnValue([1, 2]);
    mockUseOther.mockImplementation((connectionId) => {
      if (connectionId === 1) {
        return { cursor: { x: 100, y: 200 }, name: "Alice" };
      }
      if (connectionId === 2) {
        return { cursor: { x: 300, y: 400 }, name: "Bob" };
      }
      return null;
    });

    const { container } = render(<PresenceLayer />);
    const cursors = container.querySelectorAll("svg");
    expect(cursors.length).toBe(2);
  });

  it("does not render cursor when position is null", () => {
    mockUseOthersConnectionIds.mockReturnValue([1]);
    mockUseOther.mockReturnValue({ cursor: null, name: "Alice" });

    const { container } = render(<PresenceLayer />);
    const cursors = container.querySelectorAll("svg");
    expect(cursors.length).toBe(0);
  });

  it("displays user initials in cursor label", () => {
    mockUseOthersConnectionIds.mockReturnValue([1]);
    mockUseOther.mockReturnValue({ cursor: { x: 100, y: 200 }, name: "Alice Bob" });

    const { container } = render(<PresenceLayer />);
    expect(container.textContent).toContain("AB");
  });
});
