/**
 * Rate Limiter and Retry Utility
 * Prevents API throttling by pacing requests and implementing exponential backoff
 */

interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 5,
  initialDelayMs: 1000,
  maxDelayMs: 32000,
  backoffFactor: 2,
};

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Check if error is rate limit related
      const errorMessage = String(error);
      const isRateLimit = 
        errorMessage.includes('throttled') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('429');
      
      if (!isRateLimit && attempt === opts.maxAttempts) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelayMs * Math.pow(opts.backoffFactor, attempt - 1),
        opts.maxDelayMs
      );
      
      console.warn(
        `[Rate Limiter] Attempt ${attempt}/${opts.maxAttempts} failed. ` +
        `Retrying in ${delay}ms... Error: ${errorMessage.substring(0, 100)}`
      );
      
      await sleep(delay);
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

/**
 * Rate limiter class for controlling request pacing
 */
export class RateLimiter {
  private lastRequestTime = 0;
  private minIntervalMs: number;
  
  constructor(requestsPerSecond: number = 2) {
    this.minIntervalMs = 1000 / requestsPerSecond;
  }
  
  async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minIntervalMs) {
      const waitTime = this.minIntervalMs - timeSinceLastRequest;
      await sleep(waitTime);
    }
    
    this.lastRequestTime = Date.now();
  }
}

// Global rate limiter instance (2 requests per second)
export const globalRateLimiter = new RateLimiter(2);
