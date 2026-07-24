import { describe, it, expect, vi, beforeEach } from "vitest";

const { posthogInitMock } = vi.hoisted(() => {
  return { posthogInitMock: { init: vi.fn() } };
});

vi.mock("posthog-js", () => ({
  default: posthogInitMock,
}));

describe("instrumentation-client before_send", () => {
  let beforeSend: (event: any) => any;
  let prevToken: string | undefined;
  let prevHost: string | undefined;
  let prevEnv: string | undefined;

  beforeEach(async () => {
    vi.resetModules();
    posthogInitMock.init.mockClear();

    prevToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
    prevHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    prevEnv = process.env.NODE_ENV;

    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = "phc_test_token_placeholder";
    process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://us.i.posthog.com";
    process.env.NODE_ENV = "production";

    await import("./instrumentation-client");

    expect(posthogInitMock.init).toHaveBeenCalledTimes(1);
    const call = posthogInitMock.init.mock.calls[0]!;
    const config = call[1];
    beforeSend = config.before_send;
    expect(typeof beforeSend).toBe("function");
  });

  it("returns null for null event input (mandatory null-guard)", () => {
    expect(beforeSend(null)).toBeNull();
  });

  it("scrubs properties, $set, and $set_once to empty objects on a populated event", () => {
    const event = {
      uuid: "evt_abc",
      event: "$pageview",
      properties: {
        $current_url: "https://foundrie.ai/projects/xyz?email=leaked@example.com",
        $pathname: "/projects/[projectId]",
        $browser: "Chrome",
        $geoip_city: "San Francisco",
        utm_source: "twitter",
        projectId: "proj_abc",
        $exception_message: "Error: leaked",
      },
      $set: {
        email: "leaked@example.com",
        name: "Leaked User",
        userId: "user_xyz",
      },
      $set_once: {
        $initial_utm_source: "twitter",
        $initial_referrer: "https://t.co/abcd",
        $initial_referring_domain: "t.co",
      },
      timestamp: "2026-07-25T00:00:00.000Z",
    };

    const out = beforeSend(event);

    expect(out).not.toBeNull();
    expect(out).toBe(event);

    expect(out.properties).toEqual({});
    expect(Object.keys(out.properties)).toHaveLength(0);

    expect(out.$set).toEqual({});
    expect(Object.keys(out.$set)).toHaveLength(0);

    expect(out.$set_once).toEqual({});
    expect(Object.keys(out.$set_once)).toHaveLength(0);

    expect(out.uuid).toBe("evt_abc");
    expect(out.event).toBe("$pageview");
    expect(out.timestamp).toBe("2026-07-25T00:00:00.000Z");
  });

  it("handles events missing optional $set / $set_once keys (CaptureResult shape)", () => {
    const event = {
      uuid: "evt_min",
      event: "custom",
      properties: { a: 1, b: ["x"] },
    };
    const out = beforeSend(event);
    expect(out.properties).toEqual({});
    expect(out.$set).toEqual({});
    expect(out.$set_once).toEqual({});
  });

  it("preserves non-scrubbed envelope fields (uuid, event, timestamp)", () => {
    const event = {
      uuid: "evt_preserve",
      event: "$identify",
      properties: { c: 3 },
      timestamp: new Date("2026-01-01"),
    };
    const out = beforeSend(event);
    expect(out.uuid).toBe("evt_preserve");
    expect(out.event).toBe("$identify");
    expect(out.timestamp).toEqual(event.timestamp);
  });
});
