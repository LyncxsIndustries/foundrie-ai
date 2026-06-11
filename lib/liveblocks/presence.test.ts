import { describe, it, expect } from "vitest";
import {
  getUserColor,
  getUserInitials,
  DEFAULT_PRESENCE,
} from "./presence";

describe("lib/liveblocks/presence", () => {
  describe("DEFAULT_PRESENCE", () => {
    it("has correct default values", () => {
      expect(DEFAULT_PRESENCE).toEqual({
        cursor: null,
        selectedNodeId: null,
        aiStatus: "idle",
      });
    });
  });

  describe("getUserColor", () => {
    it("returns consistent color for same connectionId", () => {
      const color1 = getUserColor(1);
      const color2 = getUserColor(1);
      expect(color1).toBe(color2);
    });

    it("cycles through available colors", () => {
      const colors = [0, 1, 2, 3, 4].map((id) => getUserColor(id));
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(5);
    });

    it("wraps around after 5 colors", () => {
      const color0 = getUserColor(0);
      const color5 = getUserColor(5);
      expect(color0).toBe(color5);
    });
  });

  describe("getUserInitials", () => {
    it("returns ? for undefined name", () => {
      expect(getUserInitials(undefined)).toBe("?");
    });

    it("returns ? for empty string", () => {
      expect(getUserInitials("")).toBe("?");
    });

    it("returns single letter uppercase for one word", () => {
      expect(getUserInitials("Alice")).toBe("A");
    });

    it("returns first and last initials for multiple words", () => {
      expect(getUserInitials("Alice Bob")).toBe("AB");
      expect(getUserInitials("Alice Bob Cooper")).toBe("AC");
    });

    it("handles extra whitespace", () => {
      expect(getUserInitials("  Alice   Bob  ")).toBe("AB");
    });

    it("converts to uppercase", () => {
      expect(getUserInitials("alice bob")).toBe("AB");
    });
  });
});
