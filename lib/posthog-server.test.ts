import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockCapture, mockFlush, MockPostHog } = vi.hoisted(() => {
  const mockCapture = vi.fn();
  const mockFlush = vi.fn().mockResolvedValue(undefined);
  const MockPostHog = vi.fn(function MockPostHog() {
    return {
      capture: mockCapture,
      flush: mockFlush,
    };
  });
  return { mockCapture, mockFlush, MockPostHog };
});

vi.mock("posthog-node", () => ({
  PostHog: MockPostHog,
}));

vi.mock("./logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { logger } from "./logger";
import {
  captureServerEvent,
  resetPostHogServerClientForTests,
} from "./posthog-server";

describe("posthog-server", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetPostHogServerClientForTests();
    mockCapture.mockClear();
    mockFlush.mockReset().mockResolvedValue(undefined);
    MockPostHog.mockClear();
    vi.mocked(logger.warn).mockClear();
    vi.mocked(logger.error).mockClear();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetPostHogServerClientForTests();
  });

  it("logs warn and skips capture when PostHog env vars are missing (non-production)", async () => {
    delete process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
    process.env.NODE_ENV = "development";

    await captureServerEvent("user_1", "project_created", { plan: "FREE" });

    expect(logger.warn).toHaveBeenCalledWith(
      "PostHog environment variables missing; PostHog client disabled.",
    );
    expect(MockPostHog).not.toHaveBeenCalled();
    expect(mockCapture).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("captures and flushes when PostHog env vars are present", async () => {
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = "phc_test_token";
    process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://us.i.posthog.com";

    await captureServerEvent("user_1", "project_created", { plan: "PRO" });

    expect(MockPostHog).toHaveBeenCalledWith("phc_test_token", {
      host: "https://us.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
      enableExceptionAutocapture: true,
    });
    expect(mockCapture).toHaveBeenCalledWith({
      distinctId: "user_1",
      event: "project_created",
      properties: { plan: "PRO" },
    });
    expect(mockFlush).toHaveBeenCalledOnce();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("logs error and does not throw when flush rejects", async () => {
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = "phc_test_token";
    process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://us.i.posthog.com";
    mockFlush.mockRejectedValueOnce(new Error("network down"));

    await expect(
      captureServerEvent("user_1", "project_created", { plan: "FREE" }),
    ).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith("PostHog capture error");
  });

  it("logs error when capture throws synchronously", async () => {
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = "phc_test_token";
    process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://us.i.posthog.com";
    mockCapture.mockImplementationOnce(() => {
      throw new Error("invalid event");
    });

    await expect(
      captureServerEvent("user_1", "bad_event", { ok: true }),
    ).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith("PostHog capture error");
  });
});
