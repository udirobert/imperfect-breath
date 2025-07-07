/**
 * Custom application error class with additional context
 */
export class AppError extends Error {
  code: string;
  context?: Record<string, any>;

  constructor(code: string, message: string, context?: Record<string, any>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = context;
  }
}

/**
 * Create an error with a specific code and context
 */
export function createError(
  code: string,
  message: string,
  context?: Record<string, any>
): AppError {
  return new AppError(code, message, context);
}

/**
 * Handle an error by wrapping it with additional context
 * 
 * @param operation The operation that was being performed
 * @param error The original error
 * @returns A new error with additional context
 */
export function handleError(operation: string, error: unknown): Error {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof Error) {
    const message = `Error during ${operation}: ${error.message}`;
    console.error(message, error);
    return new AppError('OPERATION_FAILED', message, { originalError: error.message });
  }
  
  const message = `Unknown error during ${operation}`;
  console.error(message, error);
  return new AppError('UNKNOWN_ERROR', message, { originalError: String(error) });
}

/**
 * Handle API errors with proper response formatting
 *
 * @param res The response object
 * @param error The error that occurred
 * @param operation Description of the operation that failed
 * @returns Response with appropriate status code and error details
 */
export function handleApiError(res: any, error: unknown, operation: string): any {
  console.error(`API Error - ${operation}:`, error);
  
  // Default to 500 Internal Server Error
  let statusCode = 500;
  let errorMessage = `Error during ${operation}`;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  
  if (error instanceof AppError) {
    // Use the code from AppError
    errorCode = error.code;
    errorMessage = error.message;
    
    // Map certain error codes to HTTP status codes
    if (error.code === 'UNAUTHORIZED' || error.code === 'WALLET_NOT_CONNECTED') {
      statusCode = 401;
    } else if (error.code === 'NOT_FOUND') {
      statusCode = 404;
    } else if (error.code === 'VALIDATION_ERROR' || error.code === 'INVALID_INPUT') {
      statusCode = 400;
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }
  
  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: errorMessage
    }
  });
}