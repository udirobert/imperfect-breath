/**
 * Retry Policy
 * 
 * Implements exponential backoff, circuit breaker, and jitter for resilient operations.
 * Provides configurable retry strategies for different types of operations.
 */

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
  timeout?: number;
}

export interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringWindow: number;
}

export interface RetryOptions {
  retry?: Partial<RetryConfig>;
  circuitBreaker?: Partial<CircuitBreakerConfig>;
  abortSignal?: AbortSignal;
}

export interface RetryState {
  attempt: number;
  totalDelay: number;
  lastError: Error | null;
  startTime: number;
}

export type RetryPredicate = (error: Error, attempt: number) => boolean;

/**
 * Default retry configurations
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitter: true,
  timeout: 60000,
};

export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  enabled: true,
  failureThreshold: 5,
  recoveryTimeout: 30000,
  monitoringWindow: 300000,
};

/**
 * Common retry predicates
 */
export const RetryPredicates = {
  /**
   * Retry on any error
   */
  always: (): boolean => true,

  /**
   * Never retry
   */
  never: (): boolean => false,

  /**
   * Retry on network errors
   */
  networkErrors: (error: Error): boolean => {
    return error.name === 'NetworkError' ||
           error.name === 'TypeError' ||
           error.message.includes('fetch') ||
           error.message.includes('network');
  },

  /**
   * Retry on temporary errors (5xx status codes)
   */
  temporaryErrors: (error: any): boolean => {
    if (error.status >= 500 && error.status < 600) {
      return true;
    }
    if (error.name === 'TimeoutError') {
      return true;
    }
    return RetryPredicates.networkErrors(error);
  },

  /**
   * Retry on WebSocket connection errors
   */
  websocketErrors: (error: Error): boolean => {
    return error.message.includes('WebSocket') ||
           error.message.includes('connection') ||
           error.name === 'NetworkError';
  },

  /**
   * Custom predicate based on error codes
   */
  errorCodes: (codes: string[]) => (error: any): boolean => {
    return codes.includes(error.code) || codes.includes(error.name);
  },
};

/**
 * Circuit breaker implementation
 */
class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failures: number[] = [];
  private lastFailure: number = 0;
  private successCount: number = 0;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  /**
   * Record a failure
   */
  recordFailure(): void {
    const now = Date.now();
    this.failures.push(now);
    this.lastFailure = now;
    this.successCount = 0;

    // Remove old failures outside monitoring window
    this.failures = this.failures.filter(
      time => now - time < this.config.monitoringWindow
    );

    // Open circuit if threshold exceeded
    if (this.failures.length >= this.config.failureThreshold) {
      this.state = 'open';
    }
  }

  /**
   * Record a success
   */
  recordSuccess(): void {
    this.successCount++;
    
    if (this.state === 'half-open' && this.successCount >= 2) {
      // Close circuit after successful operations
      this.state = 'closed';
      this.failures = [];
      this.successCount = 0;
    }
  }

  /**
   * Check if operation is allowed
   */
  canExecute(): boolean {
    if (!this.config.enabled) {
      return true;
    }

    const now = Date.now();

    switch (this.state) {
      case 'closed':
        return true;

      case 'open':
        // Check if recovery timeout has passed
        if (now - this.lastFailure >= this.config.recoveryTimeout) {
          this.state = 'half-open';
          this.successCount = 0;
          return true;
        }
        return false;

      case 'half-open':
        return true;

      default:
        return false;
    }
  }

  /**
   * Get current state
   */
  getState(): string {
    return this.state;
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = 'closed';
    this.failures = [];
    this.successCount = 0;
    this.lastFailure = 0;
  }
}

/**
 * Retry manager with circuit breaker
 */
export class RetryManager {
  private config: RetryConfig;
  private circuitBreaker: CircuitBreaker;

  constructor(options: RetryOptions = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...options.retry };
    this.circuitBreaker = new CircuitBreaker({
      ...DEFAULT_CIRCUIT_BREAKER_CONFIG,
      ...options.circuitBreaker,
    });
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number): number {
    let delay = this.config.baseDelay * Math.pow(this.config.backoffFactor, attempt - 1);
    
    // Apply jitter to prevent thundering herd
    if (this.config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return Math.min(delay, this.config.maxDelay);
  }

  /**
   * Sleep for specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute operation with retry logic
   */
  async execute<T>(
    operation: () => Promise<T>,
    predicate: RetryPredicate = RetryPredicates.always,
    abortSignal?: AbortSignal
  ): Promise<T> {
    const state: RetryState = {
      attempt: 0,
      totalDelay: 0,
      lastError: null,
      startTime: Date.now(),
    };

    while (state.attempt < this.config.maxAttempts) {
      // Check if operation is aborted
      if (abortSignal?.aborted) {
        throw new Error('Operation aborted');
      }

      // Check circuit breaker
      if (!this.circuitBreaker.canExecute()) {
        throw new Error('Circuit breaker is open');
      }

      // Check timeout
      if (this.config.timeout && 
          Date.now() - state.startTime > this.config.timeout) {
        throw new Error('Operation timeout');
      }

      state.attempt++;

      try {
        const result = await operation();
        this.circuitBreaker.recordSuccess();
        return result;

      } catch (error) {
        state.lastError = error as Error;
        this.circuitBreaker.recordFailure();

        // Check if we should retry
        if (state.attempt >= this.config.maxAttempts || 
            !predicate(state.lastError, state.attempt)) {
          throw state.lastError;
        }

        // Calculate and apply delay
        const delay = this.calculateDelay(state.attempt);
        state.totalDelay += delay;
        
        await this.sleep(delay);
      }
    }

    throw state.lastError || new Error('Max retry attempts exceeded');
  }

  /**
   * Execute with custom configuration
   */
  async executeWithConfig<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig>,
    predicate?: RetryPredicate,
    abortSignal?: AbortSignal
  ): Promise<T> {
    const originalConfig = this.config;
    this.config = { ...this.config, ...config };

    try {
      return await this.execute(operation, predicate, abortSignal);
    } finally {
      this.config = originalConfig;
    }
  }

  /**
   * Get current circuit breaker state
   */
  getCircuitState(): string {
    return this.circuitBreaker.getState();
  }

  /**
   * Reset circuit breaker
   */
  resetCircuit(): void {
    this.circuitBreaker.reset();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Utility functions for common retry scenarios
 */
export const RetryUtils = {
  /**
   * Create retry manager for network operations
   */
  forNetwork: (options: RetryOptions = {}): RetryManager => {
    return new RetryManager({
      retry: {
        maxAttempts: 3,
        baseDelay: 1000,
        backoffFactor: 2,
        ...options.retry,
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        ...options.circuitBreaker,
      },
    });
  },

  /**
   * Create retry manager for WebSocket operations
   */
  forWebSocket: (options: RetryOptions = {}): RetryManager => {
    return new RetryManager({
      retry: {
        maxAttempts: 10,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffFactor: 1.5,
        ...options.retry,
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 3,
        recoveryTimeout: 10000,
        ...options.circuitBreaker,
      },
    });
  },

  /**
   * Create retry manager for critical operations
   */
  forCritical: (options: RetryOptions = {}): RetryManager => {
    return new RetryManager({
      retry: {
        maxAttempts: 5,
        baseDelay: 500,
        maxDelay: 10000,
        backoffFactor: 1.5,
        ...options.retry,
      },
      circuitBreaker: {
        enabled: false, // Don't give up on critical operations
        ...options.circuitBreaker,
      },
    });
  },

  /**
   * Wrap a function with retry logic
   */
  wrap: <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    retryManager: RetryManager,
    predicate?: RetryPredicate
  ): T => {
    return ((...args: any[]) => {
      return retryManager.execute(() => fn(...args), predicate);
    }) as T;
  },
};

// Export singleton instances for common use cases
export const networkRetry = RetryUtils.forNetwork();
export const websocketRetry = RetryUtils.forWebSocket();
export const criticalRetry = RetryUtils.forCritical();