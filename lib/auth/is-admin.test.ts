import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isAdmin } from "./is-admin";

describe("isAdmin", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("matches an allowlisted email case-insensitively", () => {
    vi.stubEnv("ADMIN_EMAILS", "founder@example.com, ops@example.com");
    expect(isAdmin("founder@example.com")).toBe(true);
    expect(isAdmin("FOUNDER@EXAMPLE.COM")).toBe(true);
    expect(isAdmin("  ops@example.com  ")).toBe(true);
  });

  it("rejects an email not on the list", () => {
    vi.stubEnv("ADMIN_EMAILS", "founder@example.com");
    expect(isAdmin("intruder@example.com")).toBe(false);
  });

  it("returns false for empty or missing input", () => {
    vi.stubEnv("ADMIN_EMAILS", "founder@example.com");
    expect(isAdmin("")).toBe(false);
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });

  it("returns false when ADMIN_EMAILS is unset or empty", () => {
    vi.stubEnv("ADMIN_EMAILS", "");
    expect(isAdmin("founder@example.com")).toBe(false);
  });

  it("ignores stray commas and whitespace in the env value", () => {
    vi.stubEnv("ADMIN_EMAILS", " , founder@example.com ,, ");
    expect(isAdmin("founder@example.com")).toBe(true);
    expect(isAdmin("")).toBe(false);
  });
});
