// Prisma 7 configuration (Feature 03).
// Env loading and connection URLs live here, not in schema.prisma. The CLI uses
// `datasource.url` for migrations, so it points at DIRECT_URL (the unpooled Neon
// endpoint). Runtime queries use the pooled DATABASE_URL via lib/db.ts.
import { config } from "dotenv";
config({ path: ".env.local" });

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations require a direct (unpooled) connection; PgBouncer in
    // transaction mode does not support Prisma Migrate's prepared statements.
    url: env("DIRECT_URL"),
  },
});
