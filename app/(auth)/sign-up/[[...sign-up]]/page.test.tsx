import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SignUpPage from "./page";

// Clerk's <SignUp /> requires provider context and network access; mock it to a
// recognizable marker so the test verifies the page mounts the Clerk component.
vi.mock("@clerk/nextjs", () => ({
  SignUp: () => <div data-testid="clerk-sign-up" />,
}));

describe("SignUpPage", () => {
  it("renders the Clerk SignUp component", () => {
    render(<SignUpPage />);
    expect(screen.getByTestId("clerk-sign-up")).toBeInTheDocument();
  });
});
