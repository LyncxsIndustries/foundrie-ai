import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NewProjectButton } from "./NewProjectButton";

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

// Mock GSAP magnetic effect to prevent errors in tests
vi.mock("@/lib/animations/magnetic", () => ({
  createMagneticEffect: vi.fn(() => () => {}),
}));

// Mock ResizeObserver for Radix UI Dialog
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock PointerEvent for Radix UI Dialog
if (typeof global.PointerEvent === 'undefined') {
  global.PointerEvent = class PointerEvent extends Event {} as any;
}
if (typeof global.HTMLElement.prototype.hasPointerCapture === 'undefined') {
  global.HTMLElement.prototype.hasPointerCapture = () => false;
}

beforeEach(() => {
  router.push.mockReset();
  router.refresh.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("NewProjectButton", () => {
  it("creates a project and routes to it on success", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ project: { id: "new1" } }),
    } as Response);

    render(<NewProjectButton />);
    
    // Open dialog
    await userEvent.click(screen.getByRole("button", { name: /New project/i }));
    
    // Wait for dialog to open
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    
    // Type name
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "My Test App" } });
    
    // Submit
    await userEvent.click(screen.getByRole("button", { name: /Create Project/i }));

    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith("/projects/new1");
    });
    
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/projects",
      expect.objectContaining({ 
        method: "POST",
        body: JSON.stringify({ name: "My Test App" })
      }),
    );
  }, 10000);

  it("surfaces the API error and re-enables on failure", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Project limit reached for your plan." }),
    } as Response);

    render(<NewProjectButton />);
    
    // Open dialog
    await userEvent.click(screen.getByRole("button", { name: /New project/i }));
    
    // Wait for dialog to open
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    
    // Submit without changing name
    await userEvent.click(screen.getByRole("button", { name: /Create Project/i }));

    expect(
      await screen.findByText("Project limit reached for your plan."),
    ).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Create Project/i })).toBeEnabled();
  }, 10000);
  
  it("handles network failures fallback", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network Error"));

    render(<NewProjectButton />);
    
    // Open dialog
    await userEvent.click(screen.getByRole("button", { name: /New project/i }));
    
    // Wait for dialog to open
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    
    // Submit
    await userEvent.click(screen.getByRole("button", { name: /Create Project/i }));

    expect(
      await screen.findByText("Could not create the project."),
    ).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
  }, 10000);
});
