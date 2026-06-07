-- Performance migration (Feature 03): partial indexes for the diagram pipeline
-- plus autovacuum tuning for the two write-heavy tables.
--
-- NOTE: Prisma runs each migration inside a transaction, so CREATE INDEX
-- CONCURRENTLY is NOT used here (it cannot run in a transaction block). For
-- zero-downtime production rollouts, create these indexes CONCURRENTLY out of
-- band instead; the exact statements are documented in prisma/README.md.

-- Partial index: only rows for diagrams still moving through the pipeline.
-- Keeps the "what is still generating for this project?" poll cheap.
CREATE INDEX "idx_diagrams_generating" ON "Diagram" ("projectId", "updatedAt")
  WHERE "status" IN ('QUEUED', 'GENERATING', 'RENDERING', 'CAPTURING');

-- Partial index: only diagrams that have a captured PNG, for export/listing.
CREATE INDEX "idx_diagrams_has_png" ON "Diagram" ("projectId")
  WHERE "pngStorageUrl" IS NOT NULL;

-- Autovacuum tuning. Diagram and Conversation rows update frequently (status
-- transitions, message appends), so we vacuum/analyze them far more eagerly
-- than the Postgres defaults (0.2 / 0.1) to keep planner stats fresh and bloat
-- low.
ALTER TABLE "Diagram" SET (
  autovacuum_vacuum_scale_factor = 0.01,
  autovacuum_analyze_scale_factor = 0.005,
  autovacuum_vacuum_cost_delay = 2
);

ALTER TABLE "Conversation" SET (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_analyze_scale_factor = 0.01,
  autovacuum_vacuum_cost_delay = 2
);
