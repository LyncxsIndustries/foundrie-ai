// Provider abstraction for the AI rotation engine.
//
// Every external AI call in Foundrie flows through an adapter implementing
// `AIProvider`. Direct calls to provider HTTP APIs are forbidden outside
// `lib/ai/providers/`. The shapes below mirror the provider contract pinned in
// `architecture-context.md` (Provider Abstraction) and are intentionally
// transport-agnostic so the in-process adapters can later be replaced by the
// Rust key-rotation engine reached over gRPC without changing call sites.

/**
 * Stable identifier for each provider backend. Used as the registry key and in
 * fallback-chain entries so a chain can name "OpenRouter Qwen3 free" as the
 * pair `{ provider: "openrouter", model: "qwen/qwen3-..." }`.
 */
export type ProviderId =
  | "anthropic"
  | "gemini"
  | "deepseek"
  | "groq"
  | "openrouter"
  | "nvidia";

/** Parameters passed to a provider for a single completion. */
export interface AIMediaAttachment {
  /** The MIME type of the media (e.g. image/png, image/jpeg, application/pdf). */
  mimeType: string;
  /** The base64-encoded data string (WITHOUT data URL prefix like "data:image/png;base64,"). */
  base64Data: string;
}

export interface AICallParams {
  /** Provider-specific model identifier, pinned in `config/model.yaml`. */
  model: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
  /** Hint only; streaming is performed through `callStream`, not `call`. */
  stream?: boolean;
  /** Optional cancellation/timeout signal forwarded to the underlying fetch. */
  signal?: AbortSignal;
  /** Optional media attachments (images/documents) for vision-capable models. */
  media?: AIMediaAttachment[];
}

/** Normalized successful completion returned by every adapter. */
export interface AIResponse {
  text: string;
  /** Echoes the model that produced the text. */
  model: string;
  /** The provider backend that produced the text. */
  provider: ProviderId;
  /** Total tokens used when the provider reports usage. */
  tokensUsed?: number;
}

/**
 * Provider adapter contract. Adapters own all transport, auth, and
 * request/response normalization for one backend.
 */
export interface AIProvider {
  readonly name: ProviderId;
  /**
   * Cheap, side-effect-free readiness check. Returns false when the provider
   * cannot currently serve traffic (e.g. its API key is not configured). The
   * rotation engine skips unavailable providers without counting them as
   * failed attempts.
   */
  isAvailable(): Promise<boolean>;
  /** Performs a single non-streaming completion. */
  call(params: AICallParams): Promise<AIResponse>;
  /**
   * Performs a streaming completion, yielding text deltas as they arrive.
   * Adapters that cannot stream may emulate it by yielding one final chunk.
   */
  callStream(params: AICallParams): AsyncIterable<string>;
}

/**
 * Error thrown by an adapter when a provider call fails. Carries the provider
 * and model so the engine can log a structured attempt record and decide
 * whether to walk to the next fallback. `retryable` distinguishes transient
 * failures (rate limit, timeout, 5xx) from permanent ones (bad request).
 */
export class ProviderCallError extends Error {
  readonly provider: ProviderId;
  readonly model: string;
  readonly status?: number;
  readonly retryable: boolean;

  constructor(
    message: string,
    options: {
      provider: ProviderId;
      model: string;
      status?: number;
      retryable?: boolean;
      cause?: unknown;
    },
  ) {
    super(message, { cause: options.cause });
    this.name = "ProviderCallError";
    this.provider = options.provider;
    this.model = options.model;
    this.status = options.status;
    // Default to retryable so transient network faults walk the chain rather
    // than aborting the whole request.
    this.retryable = options.retryable ?? true;
  }
}

/** True for HTTP statuses that should trigger a fallback rather than abort. */
export function isRetryableStatus(status: number): boolean {
  // 408 timeout, 409 conflict, 425 too-early, 429 rate-limit, and any 5xx are
  // transient. 4xx client errors (400/401/403/404/422) are permanent.
  return (
    status === 408 ||
    status === 409 ||
    status === 425 ||
    status === 429 ||
    status >= 500
  );
}

/** True for HTTP 429, used to surface the recoverable "queued" state. */
export function isRateLimitStatus(status: number): boolean {
  return status === 429;
}
