/**
 * Retry Utilities
 * Provides functions for retrying operations with exponential backoff
 */

/**
 * Options for retry operations
 */
export interface RetryOptions {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  retryableErrors?: Array<string | RegExp>;
  onRetry?: (attempt: number, error: Error, delayMs: number) => void;
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 500,
  maxDelayMs: 10000,
  backoffFactor: 2,
  retryableErrors: [
    'network error',
    'timeout',
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'fetch failed',
    'rate limit',
    '429',
    '500',
    '502',
    '503',
    '504',
    /^The network connection was lost/,
    /^timeout of .* exceeded$/
  ]
};

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Check if an error is retryable based on options
 */
function isRetryableError(error: Error, options: RetryOptions): boolean {
  const errorStr = error.toString().toLowerCase();
  
  // If no specific errors are defined, all errors are retryable
  if (!options.retryableErrors || options.retryableErrors.length === 0) {
    return true;
  }
  
  // Check if error matches any in the retryable list
  return options.retryableErrors.some(retryableError => {
    if (typeof retryableError === 'string') {
      return errorStr.includes(retryableError.toLowerCase());
    }
    return retryableError.test(errorStr);
  });
}

/**
 * Calculate backoff delay with jitter
 */
function calculateBackoff(attempt: number, options: RetryOptions): number {
  const { initialDelayMs, maxDelayMs = 10000, backoffFactor = 2 } = options;
  
  // Calculate exponential backoff
  const expBackoff = initialDelayMs * Math.pow(backoffFactor, attempt - 1);
  
  // Add jitter (± 20%)
  const jitter = 0.8 + (Math.random() * 0.4);
  const delayWithJitter = expBackoff * jitter;
  
  // Ensure we don't exceed max delay
  return Math.min(delayWithJitter, maxDelayMs);
}

/**
 * Execute an operation with retry logic
 * @param operation The async operation to execute and potentially retry
 * @param options Retry configuration
 * @returns Result of the operation
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  // Merge with default options
  const fullOptions: RetryOptions = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options
  };
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= fullOptions.maxAttempts; attempt++) {
    try {
      // Attempt the operation
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Determine if we should retry
      const isLastAttempt = attempt >= fullOptions.maxAttempts;
      const shouldRetry = !isLastAttempt && isRetryableError(lastError, fullOptions);
      
      if (!shouldRetry) {
        throw lastError;
      }
      
      // Calculate delay for next attempt
      const delayMs = calculateBackoff(attempt, fullOptions);
      
      // Call onRetry callback if provided
      if (fullOptions.onRetry) {
        fullOptions.onRetry(attempt, lastError, delayMs);
      } else {
        console.warn(`Retrying operation (attempt ${attempt}/${fullOptions.maxAttempts}) after ${delayMs}ms due to: ${lastError.message}`);
      }
      
      // Wait before next attempt
      await sleep(delayMs);
    }
  }
  
  // This should never be reached due to the loop structure, but TypeScript needs it
  throw lastError || new Error('Retry operation failed for unknown reason');
}

/**
 * Decorator factory for retrying class methods
 * @param options Retry configuration
 * @returns Method decorator
 */
export function retryable(options: Partial<RetryOptions> = {}) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      return withRetry(() => originalMethod.apply(this, args), options);
    };
    
    return descriptor;
  };
}