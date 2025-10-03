/**
 * Utility for API retry logic with exponential backoff
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  shouldRetry: (error: any) => {
    // Retry on network errors or 5xx server errors
    if (!error) return false;
    
    const status = error?.status || error?.response?.status;
    
    // Don't retry on client errors (4xx) except 429 (rate limit)
    if (status && status >= 400 && status < 500 && status !== 429) {
      return false;
    }
    
    // Retry on network errors, timeouts, and server errors
    return true;
  },
};

/**
 * Execute a function with retry logic and exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: any;
  let delay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted retries
      if (attempt === opts.maxRetries) {
        break;
      }

      // Check if error is retryable
      if (!opts.shouldRetry(error)) {
        throw error;
      }

      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay for next attempt
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
    }
  }

  throw lastError;
}

/**
 * Wrapper for Supabase function calls with retry logic
 */
export async function invokeWithRetry<T = any>(
  supabase: any,
  functionName: string,
  options: {
    body?: any;
    retryOptions?: RetryOptions;
  } = {}
): Promise<T> {
  return withRetry(
    async () => {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: options.body,
      });

      if (error) throw error;
      return data;
    },
    options.retryOptions
  );
}
