import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

vi.mock("@neondatabase/serverless", () => ({
  neonConfig: {},
}));

export const mockPrismaNeon = vi.fn();
vi.mock("@prisma/adapter-neon", () => ({
  PrismaNeon: mockPrismaNeon,
}));

// Mock PrismaClient so it accepts our fake adapter without real driver validation
vi.mock("./generated/prisma/client", () => ({
  PrismaClient: class {
    $connect = vi.fn();
    $disconnect = vi.fn();
    $on = vi.fn();
  },
}));

// Mock logger to prevent side-effects in error hooks
vi.mock("./logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));
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

  it("configures Neon adapter with connection-pool options and WebSocket fallback", async () => {
    vi.stubEnv("DATABASE_URL", POOLED_URL);
    
    // Temporarily remove globalThis.WebSocket to test fallback
    const originalWebSocket = (globalThis as any).WebSocket;
    delete (globalThis as any).WebSocket;
    
    await import("./db");
    
    // Fallback to ws when globalThis.WebSocket is missing
    expect(neonConfig.webSocketConstructor).toBe(ws);
    
    // Verify connection-pool options
    expect(mockPrismaNeon).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionString: POOLED_URL,
        idleTimeoutMillis: 20000,
        connectionTimeoutMillis: 10000,
      }),
      expect.objectContaining({
        onPoolError: expect.any(Function),
        onConnectionError: expect.any(Function),
      })
    );

    // Restore WebSocket
    if (originalWebSocket) {
      (globalThis as any).WebSocket = originalWebSocket;
    }
  });
});
