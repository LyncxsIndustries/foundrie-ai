import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// lib/db.ts builds a Neon driver adapter from DATABASE_URL and caches the client
// on globalThis in non-production. We exercise that wiring without opening a real
// connection (the adapter is lazy; PrismaNeon does not connect at construction).

const POOLED_URL =
  "postgresql://user:pass@ep-test-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";

describe("lib/db", () => {
  const originalUrl = process.env.DATABASE_URL;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).db;
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalUrl;
    vi.unstubAllEnvs();
    (process.env as any).NODE_ENV = originalNodeEnv;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).db;
  });

  it("exports a db client when DATABASE_URL is set", async () => {
    vi.stubEnv("DATABASE_URL", POOLED_URL);
    const { db } = await import("./db");
    expect(db).toBeDefined();
    expect(typeof db.$connect).toBe("function");
  });

  it("throws a clear error when DATABASE_URL is missing", async () => {
    vi.stubEnv("DATABASE_URL", "");
    await expect(import("./db")).rejects.toThrow(/DATABASE_URL is not set/);
  });

  it("caches the client on globalThis outside production", async () => {
    vi.stubEnv("DATABASE_URL", POOLED_URL);
    vi.stubEnv("NODE_ENV", "development");
    const { db } = await import("./db");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((globalThis as any).db).toBe(db);
  });
});
