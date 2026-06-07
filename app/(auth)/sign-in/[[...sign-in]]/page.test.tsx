import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SignInPage from "./page";

// Clerk's <SignIn /> requires provider context and network access; mock it to a
// recognizable marker so the test verifies the page mounts the Clerk component.
vi.mock("@clerk/nextjs", () => ({
  SignIn: () => <div data-testid="clerk-sign-in" />,
}));

describe("SignInPage", () => {
  it("renders the Clerk SignIn component", () => {
    render(<SignInPage />);
    expect(screen.getByTestId("clerk-sign-in")).toBeInTheDocument();
  });
});
