/**
 * Error Handler Hook
 * 
 * Provides standardized error handling with user-friendly feedback,
 * recovery actions, and reporting integration.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { AppError, ErrorFactory, ErrorCategory, ErrorSeverity, RecoveryStrategy } from '../lib/errors/error-types';
import { errorReporter } from '../lib/errors/error-reporter';

export interface ErrorState {
  error: AppError | null;
  isRecovering: boolean;
  recoveryAttempts: number;
  lastErrorTime: number | null;
}

export interface ErrorHandlerOptions {
  maxRecoveryAttempts?: number;
  autoReportErrors?: boolean;
  showErrorToast?: boolean;
  onError?: (error: AppError) => void;
  onRecovery?: (error: AppError, successful: boolean) => void;
}

export interface UseErrorHandlerReturn {
  // State
  error: AppError | null;
  hasError: boolean;
  isRecovering: boolean;
  canRecover: boolean;
  
  // Actions
  handleError: (error: Error | AppError, context?: Record<string, any>) => void;
  clearError: () => void;
  retry: () => Promise<void>;
  
  // Utilities
  reportError: (error: AppError, context?: Record<string, any>) => void;
  wrapAsync: <T extends any[], R>(fn: (...args: T) => Promise<R>) => (...args: T) => Promise<R>;
  wrapSync: <T extends any[], R>(fn: (...args: T) => R) => (...args: T) => R;
}

const DEFAULT_OPTIONS: Required<ErrorHandlerOptions> = {
  maxRecoveryAttempts: 3,
  autoReportErrors: true,
  showErrorToast: true,
  onError: () => {},
  onRecovery: () => {},
};

/**
 * Main error handler hook
 */
export const useErrorHandler = (options: ErrorHandlerOptions = {}): UseErrorHandlerReturn => {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isRecovering: false,
    recoveryAttempts: 0,
    lastErrorTime: null,
  });

  const lastRecoveryAction = useRef<(() => Promise<void>) | null>(null);

  /**
   * Handle an error
   */
  const handleError = useCallback((
    error: Error | AppError,
    context?: Record<string, any>
  ) => {
    const appError = error instanceof AppError 
      ? error 
      : ErrorFactory.fromError(error, undefined, context);

    const newState: ErrorState = {
      error: appError,
      isRecovering: false,
      recoveryAttempts: 0,
      lastErrorTime: Date.now(),
    };

    setErrorState(newState);

    // Report error if enabled
    if (config.autoReportErrors) {
      errorReporter.reportError(appError, context);
    }

    // Call custom error handler
    config.onError(appError);

    // Show toast notification if enabled (would need toast system)
    if (config.showErrorToast) {
      // TODO: Integrate with toast notification system
      console.warn('Error occurred:', appError.userMessage);
    }
  }, [config]);

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isRecovering: false,
      recoveryAttempts: 0,
      lastErrorTime: null,
    });
    lastRecoveryAction.current = null;
  }, []);

  /**
   * Attempt to recover from current error
   */
  const retry = useCallback(async () => {
    if (!errorState.error || errorState.isRecovering) return;

    if (errorState.recoveryAttempts >= config.maxRecoveryAttempts) {
      console.warn('Maximum recovery attempts reached');
      return;
    }

    setErrorState(prev => ({
      ...prev,
      isRecovering: true,
      recoveryAttempts: prev.recoveryAttempts + 1,
    }));

    try {
      let recoverySuccessful = false;

      // Execute recovery strategy
      switch (errorState.error.recovery) {
        case RecoveryStrategy.RETRY:
          if (lastRecoveryAction.current) {
            await lastRecoveryAction.current();
            recoverySuccessful = true;
          }
          break;

        case RecoveryStrategy.REFRESH:
          window.location.reload();
          return;

        case RecoveryStrategy.RECONNECT:
          // Would integrate with connection manager
          recoverySuccessful = true;
          break;

        case RecoveryStrategy.FALLBACK:
          // Clear error and continue with degraded functionality
          recoverySuccessful = true;
          break;

        case RecoveryStrategy.USER_ACTION:
          if (errorState.error.action) {
            await errorState.error.action();
            recoverySuccessful = true;
          }
          break;

        default:
          recoverySuccessful = true;
          break;
      }

      if (recoverySuccessful) {
        clearError();
        config.onRecovery(errorState.error, true);
      } else {
        setErrorState(prev => ({ ...prev, isRecovering: false }));
        config.onRecovery(errorState.error, false);
      }

    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError);
      setErrorState(prev => ({ ...prev, isRecovering: false }));
      config.onRecovery(errorState.error, false);
      
      // Handle recovery error
      handleError(recoveryError as Error, { 
        originalError: errorState.error.id,
        recoveryAttempt: errorState.recoveryAttempts 
      });
    }
  }, [errorState, config, clearError, handleError]);

  /**
   * Report an error without handling it
   */
  const reportError = useCallback((error: AppError, context?: Record<string, any>) => {
    errorReporter.reportError(error, context);
  }, []);

  /**
   * Wrap async function with error handling
   */
  const wrapAsync = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>
  ) => {
    return async (...args: T): Promise<R> => {
      try {
        const result = await fn(...args);
        lastRecoveryAction.current = () => fn(...args);
        return result;
      } catch (error) {
        handleError(error as Error);
        throw error;
      }
    };
  }, [handleError]);

  /**
   * Wrap sync function with error handling
   */
  const wrapSync = useCallback(<T extends any[], R>(
    fn: (...args: T) => R
  ) => {
    return (...args: T): R => {
      try {
        const result = fn(...args);
        lastRecoveryAction.current = () => Promise.resolve(fn(...args));
        return result;
      } catch (error) {
        handleError(error as Error);
        throw error;
      }
    };
  }, [handleError]);

  // Computed values
  const hasError = errorState.error !== null;
  const canRecover = hasError && 
    errorState.recoveryAttempts < config.maxRecoveryAttempts &&
    errorState.error!.recovery !== RecoveryStrategy.FATAL;

  return {
    // State
    error: errorState.error,
    hasError,
    isRecovering: errorState.isRecovering,
    canRecover,
    
    // Actions
    handleError,
    clearError,
    retry,
    
    // Utilities
    reportError,
    wrapAsync,
    wrapSync,
  };
};

/**
 * Hook for handling errors in a specific category
 */
export const useCategoryErrorHandler = (
  category: ErrorCategory,
  options?: ErrorHandlerOptions
) => {
  const baseHandler = useErrorHandler(options);
  
  const handleError = useCallback((error: Error, context?: Record<string, any>) => {
    const appError = ErrorFactory.fromError(error, category, context);
    baseHandler.handleError(appError, context);
  }, [baseHandler, category]);

  return {
    ...baseHandler,
    handleError,
  };
};

/**
 * Hook for network error handling
 */
export const useNetworkErrorHandler = (options?: ErrorHandlerOptions) => {
  return useCategoryErrorHandler(ErrorCategory.NETWORK, {
    maxRecoveryAttempts: 5,
    ...options,
  });
};

/**
 * Hook for camera error handling
 */
export const useCameraErrorHandler = (options?: ErrorHandlerOptions) => {
  return useCategoryErrorHandler(ErrorCategory.CAMERA, {
    maxRecoveryAttempts: 2,
    ...options,
    onError: (error) => {
      // Provide specific camera error guidance
      console.warn('Camera error guidance:', {
        message: error.userMessage,
        recovery: error.recovery,
      });
      options?.onError?.(error);
    },
  });
};

/**
 * Hook for wallet error handling
 */
export const useWalletErrorHandler = (options?: ErrorHandlerOptions) => {
  return useCategoryErrorHandler(ErrorCategory.WALLET, {
    maxRecoveryAttempts: 3,
    ...options,
  });
};

/**
 * Hook for session error handling
 */
export const useSessionErrorHandler = (options?: ErrorHandlerOptions) => {
  return useCategoryErrorHandler(ErrorCategory.SESSION, options);
};

/**
 * Hook that provides error boundary-like functionality for components
 */
export const useErrorBoundary = (options?: ErrorHandlerOptions) => {
  const errorHandler = useErrorHandler(options);

  useEffect(() => {
    const handleUnhandledError = (event: ErrorEvent) => {
      errorHandler.handleError(new Error(event.message));
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      errorHandler.handleError(new Error(event.reason));
    };

    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [errorHandler]);

  return errorHandler;
};

/**
 * Hook for form validation errors
 */
export const useFormErrorHandler = () => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const setFieldError = useCallback((field: string, message: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const hasFieldError = useCallback((field: string) => {
    return field in fieldErrors;
  }, [fieldErrors]);

  const getFieldError = useCallback((field: string) => {
    return fieldErrors[field] || null;
  }, [fieldErrors]);

  return {
    fieldErrors,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    hasFieldError,
    getFieldError,
    hasErrors: Object.keys(fieldErrors).length > 0,
  };
};