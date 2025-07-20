/**
 * Lens Protocol Error Types
 * Standardized error handling for Lens Protocol integration
 */

/**
 * Base Lens error class
 */
export class LensError extends Error {
  code: string;
  context?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "LensError";
    this.code = code;
    this.context = context;
  }
}

/**
 * Authentication-related errors
 */
export class LensAuthenticationError extends LensError {
  constructor(message: string, context?: Record<string, unknown>) {
    super("AUTHENTICATION_ERROR", message, context);
    this.name = "LensAuthenticationError";
  }
}

/**
 * API connection errors
 */
export class LensApiError extends LensError {
  status?: number;

  constructor(
    message: string,
    status?: number,
    context?: Record<string, unknown>,
  ) {
    super("API_ERROR", message, context);
    this.name = "LensApiError";
    this.status = status;
  }
}

/**
 * Social action errors (post, comment, follow)
 */
export class LensSocialActionError extends LensError {
  actionType: string;

  constructor(
    actionType: string,
    message: string,
    context?: Record<string, unknown>,
  ) {
    super("SOCIAL_ACTION_ERROR", message, context);
    this.name = "LensSocialActionError";
    this.actionType = actionType;
  }
}

/**
 * Storage-related errors (Grove)
 */
export class LensStorageError extends LensError {
  constructor(message: string, context?: Record<string, unknown>) {
    super("STORAGE_ERROR", message, context);
    this.name = "LensStorageError";
  }
}

/**
 * Rate limit errors
 */
export class LensRateLimitError extends LensError {
  retryAfter?: number;

  constructor(
    message: string,
    retryAfter?: number,
    context?: Record<string, unknown>,
  ) {
    super("RATE_LIMIT_ERROR", message, context);
    this.name = "LensRateLimitError";
    this.retryAfter = retryAfter;
  }
}

/**
 * Content validation errors
 */
export class LensContentValidationError extends LensError {
  field: string;

  constructor(
    field: string,
    message: string,
    context?: Record<string, unknown>,
  ) {
    super("CONTENT_VALIDATION_ERROR", message, context);
    this.name = "LensContentValidationError";
    this.field = field;
  }
}

/**
 * Check if an error is a specific Lens error type
 */
export function isLensError(error: unknown): error is LensError {
  return error instanceof LensError;
}

/**
 * Format error for logging and reporting
 */
export function formatLensError(error: unknown): {
  code: string;
  message: string;
  details?: unknown;
} {
  if (isLensError(error)) {
    return {
      code: error.code,
      message: error.message,
      details: error.context,
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message: error instanceof Error ? error.message : String(error),
  };
}
