// Prisma client singleton (Feature 03).
// Prisma 7 requires a driver adapter. We use the Neon adapter over the pooled
// DATABASE_URL (`-pooler` endpoint) so serverless route handlers reuse PgBouncer
// connections instead of exhausting Neon's direct-connection limit. The client
// is cached on globalThis in development to survive HMR module reloads.
import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "./generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Provide the pooled Neon connection string (the `-pooler` endpoint).",
  );
}

const adapter = new PrismaNeon({ connectionString });

const createPrismaClient = () =>
  new PrismaClient({
    adapter,
    // Dev surfaces query/warn/error for debugging; production stays quiet to
    // avoid leaking query shape and to keep logs to actionable errors only.
    log:
      process.env.NODE_ENV === "production"
        ? ["error"]
        : ["query", "warn", "error"],
  });

const globalForPrisma = globalThis as unknown as {
  db: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.db ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.db = db;
}
