/**
 * Error Utilities
 * 
 * Standardized error handling for the application
 */

/**
 * Standard application error format
 */
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp?: number;
}

/**
 * Handle and format errors in a consistent way
 * @param operation Description of the operation that failed
 * @param error Original error object
 * @returns Formatted AppError
 */
export function handleError(operation: string, error: any): AppError {
  const appError: AppError = {
    code: operation.toUpperCase().replace(/\s/g, '_'),
    message: `Failed to ${operation}`,
    details: error,
    timestamp: Date.now()
  };
  
  // Log the error
  console.error(`[${appError.code}] ${appError.message}`, error);
  
  return appError;
}

/**
 * Create a custom error with standard format
 * @param code Error code
 * @param message Error message
 * @param details Additional error details
 * @returns Formatted AppError
 */
export function createError(code: string, message: string, details?: any): AppError {
  return {
    code,
    message,
    details,
    timestamp: Date.now()
  };
}

/**
 * Check if an object is an AppError
 * @param obj Object to check
 * @returns True if the object is an AppError
 */
export function isAppError(obj: any): obj is AppError {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.code === 'string' &&
    typeof obj.message === 'string'
  );
}