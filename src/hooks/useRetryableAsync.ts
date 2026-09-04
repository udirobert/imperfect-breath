/**
 * useRetryableAsync — structured retry/recovery for transient async failures.
 *
 * Reintegrated post-consolidation: the full 408-line useErrorHandler was
 * deleted in round 3, but the agent API (PPaaS) and AI analysis paths can
 * fail transiently. This is the lightweight extraction — just wrapAsync
 * + retry-with-backoff + recovery state. No toast coupling (toasts were
 * correctly consolidated to sonner); callers decide how to surface errors.
 *
 * Performance: ~80 lines, no deps. Used by useSecureAIAnalysis and
 * useAttestation callers that need resilient retry.
 */
import { useCallback, useRef, useState } from "react";

export interface RetryableState {
  isRetrying: boolean;
  attempts: number;
  lastError: Error | null;
  canRetry: boolean;
}

export interface RetryableOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** Called on each failed attempt; return false to stop retrying. */
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

const DEFAULT_OPTS: Required<RetryableOptions> = {
  maxAttempts: 3,
  baseDelayMs: 800,
  maxDelayMs: 4000,
  shouldRetry: () => true,
};

function backoff(attempt: number, base: number, max: number): number {
  const delay = Math.min(base * 2 ** attempt, max);
  // Add jitter (±20%) to avoid thundering herd.
  return Math.round(delay * (0.8 + Math.random() * 0.4));
}

export function useRetryableAsync<TArgs extends readonly unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: RetryableOptions = {},
) {
  const opts = { ...DEFAULT_OPTS, ...options };
  const { maxAttempts, baseDelayMs, maxDelayMs, shouldRetry } = opts;
  const [state, setState] = useState<RetryableState>({
    isRetrying: false,
    attempts: 0,
    lastError: null,
    canRetry: true,
  });
  const attemptRef = useRef(0);

  const execute = useCallback(
    async (...args: TArgs): Promise<TResult> => {
      attemptRef.current = 0;
      setState({ isRetrying: false, attempts: 0, lastError: null, canRetry: true });

      while (true) {
        try {
          const result = await fn(...args);
          setState({ isRetrying: false, attempts: attemptRef.current, lastError: null, canRetry: true });
          return result;
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          attemptRef.current += 1;
          const canRetry =
            attemptRef.current < maxAttempts && shouldRetry(err, attemptRef.current);

          setState({
            isRetrying: canRetry,
            attempts: attemptRef.current,
            lastError: err,
            canRetry,
          });

          if (!canRetry) throw err;

          await new Promise((r) => setTimeout(r, backoff(attemptRef.current, baseDelayMs, maxDelayMs)));
        }
      }
    },
    [fn, maxAttempts, baseDelayMs, maxDelayMs, shouldRetry],
  );

  const reset = useCallback(() => {
    attemptRef.current = 0;
    setState({ isRetrying: false, attempts: 0, lastError: null, canRetry: true });
  }, []);

  return { execute, reset, state };
}
