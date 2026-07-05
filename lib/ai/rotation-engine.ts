// The AI rotation engine: the single entry point for every AI call in
// Foundrie. `callAI` and `callAIStream` resolve a task to a model key, read its
// fallback chain, check provider availability, dispatch through the provider
// adapter, log each attempt, and walk the chain until success or exhaustion.
//
// Boundary note: in Foundrie's full deployed system, key rotation across 50+
// keys / 6 providers runs in the Rust execution layer reached over gRPC, and an
// all-exhausted request is parked in a NATS JetStream queue. This module
// implements the application-layer engine and a key-selection seam; when all
// providers are exhausted it returns a recoverable "queued" state rather than
// throwing a raw provider error, matching that future behavior.

import { getProvider } from "./providers";
import {
  type AICallParams,
  type AIMediaAttachment,
  type AIResponse,
  ProviderCallError,
} from "./providers/types";
import { type ChainEntry, getFallbackChain } from "./fallback-chains";
import { type AITask, type ModelKey, resolveModelKey } from "./model-routing";
import type { Plan } from "./tier";
import { logEvent } from "./log";
import { globalRateLimiter, retryWithBackoff } from "@/lib/utils/rate-limiter";

/** Generation parameters callers supply (model id is resolved by the engine). */
export interface CallOptions {
  systemPrompt: string;
  userPrompt: string;
  /** Subscription plan; drives tier-based primary model selection. */
  plan: Plan;
  maxTokens?: number;
  temperature?: number;
  /** Force a specific model key, bypassing the task default. */
  overrideModelKey?: ModelKey;
  /** Cancellation signal forwarded to the provider fetch. */
  signal?: AbortSignal;
  /** Optional media attachments for vision-capable providers (Feature 08). */
  media?: AIMediaAttachment[];
}

/** Successful resolution of a `callAI` request. */
export interface CallSuccess extends AIResponse {
  status: "ok";
  /** Model key whose chain was walked. */
  modelKey: ModelKey;
  /** Number of provider attempts made (including the successful one). */
  attempts: number;
}

/**
 * Recoverable exhaustion state. Returned (not thrown) when every provider in
 * the chain is unavailable or rate-limited. In the deployed system this maps to
 * a NATS JetStream queue position; here `position` is null because the
 * in-process engine has no queue, but `retryable` signals callers to retry or
 * surface a "queued" indicator instead of an error.
 */
export interface CallQueued {
  status: "queued";
  modelKey: ModelKey;
  attempts: number;
  retryable: true;
  /** Queue position in the deployed system; null in the in-process engine. */
  position: number | null;
  /** Whether exhaustion was caused by rate limiting vs hard failures. */
  rateLimited: boolean;
  /** Last error message observed while walking the chain, for diagnostics. */
  lastError?: string;
}

export type CallResult = CallSuccess | CallQueued;

function toCallParams(
  entry: ChainEntry,
  options: CallOptions,
  stream: boolean,
): AICallParams {
  return {
    model: entry.model,
    systemPrompt: options.systemPrompt,
    userPrompt: options.userPrompt,
    maxTokens: options.maxTokens,
    temperature: options.temperature,
    stream,
    signal: options.signal,
    media: options.media,
  };
}

/**
 * Resolve a task + plan + optional override to the model key and its chain.
 * Shared by `callAI` and `callAIStream`.
 */
function resolveChain(
  task: AITask,
  options: CallOptions,
): { modelKey: ModelKey; chain: ChainEntry[] } {
  const modelKey = resolveModelKey(
    task,
    options.plan,
    options.overrideModelKey,
  );
  return { modelKey, chain: getFallbackChain(modelKey) };
}

/**
 * Execute a task through the rotation engine (non-streaming).
 *
 * Walks the resolved fallback chain. For each entry: skip-and-do-not-count if
 * the provider is unavailable (no key configured); otherwise call it, log the
 * attempt with provider/model/task/success/duration, and return on success.
 * Rate-limit (429) and transient failures continue to the next entry; a
 * non-retryable failure (e.g. malformed request) also continues but is recorded
 * so the chain can still find a working provider. When the chain is exhausted,
 * returns a recoverable `queued` result.
 */
async function updateTriggerMetadata(status: string, logMessage: string) {
  try {
    const sdk = await import("@trigger.dev/sdk");
    if (sdk && sdk.metadata) {
      sdk.metadata.set("status", status);
      sdk.metadata.append("logs", logMessage);
    }
  } catch (e) {
    // Ignore if not in a Trigger task context
  }
}

/**
 * Execute a task through the rotation engine (non-streaming).
 *
 * Walks the resolved fallback chain. For each entry: skip-and-do-not-count if
 * the provider is unavailable (no key configured); otherwise call it, log the
 * attempt with provider/model/task/success/duration, and return on success.
 * Rate-limit (429) and transient failures continue to the next entry; a
 * non-retryable failure (e.g. malformed request) also continues but is recorded
 * so the chain can still find a working provider. When the chain is exhausted,
 * returns a recoverable `queued` result.
 */
export async function callAI(
  task: AITask,
  options: CallOptions,
): Promise<CallResult> {
  // Apply global rate limiting before attempting any AI call
  await globalRateLimiter.throttle();
  
  const startedAt = Date.now();
  const { modelKey, chain } = resolveChain(task, options);

  let attempts = 0;
  let sawRateLimit = false;
  let lastError: string | undefined;

  for (let i = 0; i < chain.length; i++) {
    const entry = chain[i];
    const provider = getProvider(entry.provider);

    // Unavailable providers (no configured key) are skipped without counting as
    // a failed attempt, so an unconfigured provider never consumes the chain.
    if (!(await provider.isAvailable())) {
      logEvent("debug", {
        event: "ai_attempt",
        task,
        modelKey,
        provider: entry.provider,
        model: entry.model,
        success: false,
        durationMs: 0,
        chainIndex: i,
        error: "provider unavailable (skipped)",
      });
      continue;
    }

    attempts += 1;
    const attemptStart = Date.now();
    await updateTriggerMetadata(
      `Contacting ${entry.provider} (${entry.model})...`,
      `Attempt ${attempts}: Connecting to ${entry.provider} using model ${entry.model}`
    );

    try {
      // Wrap provider call with exponential backoff retry
      const response = await retryWithBackoff(
        async () => provider.call(toCallParams(entry, options, false)),
        {
          maxAttempts: 3,
          initialDelayMs: 1000,
          maxDelayMs: 10000,
          backoffFactor: 2,
        }
      );
      
      const durationMs = Date.now() - attemptStart;
      logEvent("info", {
        event: "ai_attempt",
        task,
        modelKey,
        provider: entry.provider,
        model: entry.model,
        success: true,
        durationMs,
        chainIndex: i,
      });
      logEvent("info", {
        event: "ai_outcome",
        task,
        modelKey,
        status: "ok",
        attempts,
        durationMs: Date.now() - startedAt,
        provider: entry.provider,
        model: entry.model,
      });
      
      await updateTriggerMetadata(
        `Response generated`,
        `Successfully received response from ${entry.provider} (${entry.model})`
      );

      return { status: "ok", ...response, modelKey, attempts };
    } catch (error) {
      const durationMs = Date.now() - attemptStart;
      const isProviderError = error instanceof ProviderCallError;
      const rateLimited = isProviderError && error.status === 429;
      if (rateLimited) sawRateLimit = true;
      lastError = error instanceof Error ? error.message : String(error);

      logEvent("warn", {
        event: "ai_attempt",
        task,
        modelKey,
        provider: entry.provider,
        model: entry.model,
        success: false,
        durationMs,
        chainIndex: i,
        error: lastError,
        rateLimited,
      });

      await updateTriggerMetadata(
        `Retrying/Falling back...`,
        `Attempt ${attempts} failed: ${lastError}. Walking rotation chain...`
      );
      // Continue to the next fallback regardless of retryable/non-retryable:
      // the goal is to find any working provider in the chain.
    }
  }

  // Chain exhausted. Surface a recoverable queued state, not a raw error.
  logEvent("warn", {
    event: "ai_outcome",
    task,
    modelKey,
    status: "queued",
    attempts,
    durationMs: Date.now() - startedAt,
  });

  await updateTriggerMetadata(
    `All providers exhausted`,
    `Rotation chain exhausted after ${attempts} attempts. Last error: ${lastError}`
  );

  return {
    status: "queued",
    modelKey,
    attempts,
    retryable: true,
    position: null,
    rateLimited: sawRateLimit,
    lastError,
  };
}

/** Streaming result: a success carries an async-iterable of text deltas. */
export interface StreamSuccess {
  status: "ok";
  modelKey: ModelKey;
  provider: ChainEntry["provider"];
  model: string;
  stream: AsyncIterable<string>;
}

export type StreamResult = StreamSuccess | CallQueued;

/**
 * Execute a task through the rotation engine (streaming).
 *
 * Walks the chain to find the first available provider whose stream opens
 * without an immediate error. Because a stream's failures can surface mid-flight
 * (after the first chunk), this establishes the stream by pulling the first
 * chunk eagerly; if opening throws, it logs the attempt and falls back. Once a
 * stream is established it is handed to the caller, with the already-pulled
 * first chunk replayed ahead of the remaining deltas.
 */
export async function callAIStream(
  task: AITask,
  options: CallOptions,
): Promise<StreamResult> {
  // Apply global rate limiting before attempting any AI call
  await globalRateLimiter.throttle();
  
  const startedAt = Date.now();
  const { modelKey, chain } = resolveChain(task, options);

  let attempts = 0;
  let sawRateLimit = false;
  let lastError: string | undefined;

  for (let i = 0; i < chain.length; i++) {
    const entry = chain[i];
    const provider = getProvider(entry.provider);

    if (!(await provider.isAvailable())) {
      logEvent("debug", {
        event: "ai_attempt",
        task,
        modelKey,
        provider: entry.provider,
        model: entry.model,
        success: false,
        durationMs: 0,
        chainIndex: i,
        error: "provider unavailable (skipped)",
      });
      continue;
    }

    attempts += 1;
    const attemptStart = Date.now();
    await updateTriggerMetadata(
      `Contacting ${entry.provider} (${entry.model})...`,
      `Attempt ${attempts}: Connecting to stream on ${entry.provider} (${entry.model})`
    );

    try {
      // Wrap stream creation with exponential backoff retry
      const iterator = await retryWithBackoff(
        async () => provider
          .callStream(toCallParams(entry, options, true))
          [Symbol.asyncIterator](),
        {
          maxAttempts: 3,
          initialDelayMs: 1000,
          maxDelayMs: 10000,
          backoffFactor: 2,
        }
      );

      // Eagerly pull the first chunk so a failure to open the stream falls back
      // rather than surfacing to the caller after they begin consuming.
      const first = await iterator.next();

      logEvent("info", {
        event: "ai_attempt",
        task,
        modelKey,
        provider: entry.provider,
        model: entry.model,
        success: true,
        durationMs: Date.now() - attemptStart,
        chainIndex: i,
      });
      logEvent("info", {
        event: "ai_outcome",
        task,
        modelKey,
        status: "ok",
        attempts,
        durationMs: Date.now() - startedAt,
        provider: entry.provider,
        model: entry.model,
      });

      await updateTriggerMetadata(
        `Streaming response...`,
        `Established connection and streaming response from ${entry.provider} (${entry.model})`
      );

      const stream = replayStream(first, iterator);
      return {
        status: "ok",
        modelKey,
        provider: entry.provider,
        model: entry.model,
        stream,
      };
    } catch (error) {
      const rateLimited =
        error instanceof ProviderCallError && error.status === 429;
      if (rateLimited) sawRateLimit = true;
      lastError = error instanceof Error ? error.message : String(error);
      logEvent("warn", {
        event: "ai_attempt",
        task,
        modelKey,
        provider: entry.provider,
        model: entry.model,
        success: false,
        durationMs: Date.now() - attemptStart,
        chainIndex: i,
        error: lastError,
        rateLimited,
      });

      await updateTriggerMetadata(
        `Retrying/Falling back...`,
        `Attempt ${attempts} failed: ${lastError}. Walking rotation chain...`
      );
    }
  }

  logEvent("warn", {
    event: "ai_outcome",
    task,
    modelKey,
    status: "queued",
    attempts,
    durationMs: Date.now() - startedAt,
  });

  await updateTriggerMetadata(
    `All providers exhausted`,
    `Rotation chain exhausted after ${attempts} attempts. Last error: ${lastError}`
  );

  return {
    status: "queued",
    modelKey,
    attempts,
    retryable: true,
    position: null,
    rateLimited: sawRateLimit,
    lastError,
  };
}

/** Replay an already-pulled first result ahead of the rest of an iterator. */
async function* replayStream(
  first: IteratorResult<string>,
  iterator: AsyncIterator<string>,
): AsyncIterable<string> {
  if (!first.done && first.value.length > 0) {
    yield first.value;
  }
  if (first.done) return;
  while (true) {
    const next = await iterator.next();
    if (next.done) return;
    if (next.value.length > 0) yield next.value;
  }
}
