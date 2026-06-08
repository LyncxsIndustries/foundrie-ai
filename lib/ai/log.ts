// Structured JSON logging for the AI rotation engine.
//
// Foundrie's logging policy (code-standards.md > Logging) forbids `console.log`
// as the logging mechanism and requires structured JSON with scrubbed PII. No
// project-wide logger utility exists yet (the dedicated logging feature is
// future work), so the engine emits its own minimal structured records here.
// When the central aggregator/Pino logger lands, this module is the single
// seam to redirect — call sites already pass structured fields, not strings.

/** Severity levels per code-standards.md. */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Structured record of a single provider call attempt. This is the audit trail
 * the rotation engine must emit per acceptance criteria: provider, model, task,
 * success, error, and duration.
 */
export interface AttemptLogFields {
  event: "ai_attempt";
  task: string;
  modelKey: string;
  provider: string;
  model: string;
  success: boolean;
  durationMs: number;
  /** Position in the fallback chain, 0-indexed. */
  chainIndex: number;
  error?: string;
  /** Set when the attempt failed because the provider was rate-limited. */
  rateLimited?: boolean;
}

/** Structured record emitted once a `callAI` request resolves or exhausts. */
export interface OutcomeLogFields {
  event: "ai_outcome";
  task: string;
  modelKey: string;
  status: "ok" | "queued";
  attempts: number;
  durationMs: number;
  /** The provider that ultimately succeeded, when status is "ok". */
  provider?: string;
  model?: string;
}

type LogFields = AttemptLogFields | OutcomeLogFields;

// Keys whose values must never appear in logs (PII / secret scrubbing). The
// engine never logs prompt bodies, but this guards against accidental misuse.
const REDACTED_KEYS = new Set([
  "systemPrompt",
  "userPrompt",
  "apiKey",
  "authorization",
  "email",
  "token",
]);

function scrub(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (REDACTED_KEYS.has(key)) {
      out[key] = "[redacted]";
    } else {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Emit a structured JSON log line. In production only `warn`/`error` and the
 * always-on attempt/outcome records are emitted; `debug` is dev-only. The
 * single `process.stdout.write` is the structured-logging sink, not ad-hoc
 * `console.log` string logging — it writes one JSON object per line.
 */
export function logEvent(level: LogLevel, fields: LogFields): void {
  const isProd = process.env.NODE_ENV === "production";
  if (level === "debug" && isProd) {
    return;
  }

  const record = {
    level,
    timestamp: new Date().toISOString(),
    component: "ai.rotation-engine",
    ...scrub(fields as unknown as Record<string, unknown>),
  };

  // One JSON object per line. stdout is the structured sink; a future central
  // aggregator (Pino transport) replaces this single write.
  process.stdout.write(`${JSON.stringify(record)}\n`);
}
