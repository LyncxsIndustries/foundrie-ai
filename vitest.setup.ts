import "@testing-library/jest-dom/vitest";
import { afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";

// Mock ResizeObserver for React Flow
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// Unmount React trees and reset the DOM between tests to keep them isolated.
afterEach(() => {
  cleanup();
});
