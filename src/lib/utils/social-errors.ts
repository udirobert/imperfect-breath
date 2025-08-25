/**
 * Custom error classes for social media interactions
 */

import { AppError, ErrorCategory, ErrorSeverity, RecoveryStrategy } from "../errors/error-types";

/**
 * Error thrown when a social operation fails due to authentication issues
 */
export class SocialAuthError extends AppError {
  constructor(message: string) {
    super(message, ErrorCategory.AUTHENTICATION, ErrorSeverity.MEDIUM, RecoveryStrategy.USER_ACTION);
    this.name = "SocialAuthError";
    Object.setPrototypeOf(this, SocialAuthError.prototype);
  }
}

/**
 * Error thrown when a social operation fails due to rate limiting
 */
export class SocialRateLimitError extends AppError {
  constructor(message: string) {
    super(message, ErrorCategory.NETWORK, ErrorSeverity.LOW, RecoveryStrategy.RETRY);
    this.name = "SocialRateLimitError";
    Object.setPrototypeOf(this, SocialRateLimitError.prototype);
  }
}

/**
 * Error thrown when a social operation fails due to content issues
 */
export class SocialContentError extends AppError {
  constructor(message: string) {
    super(message, ErrorCategory.VALIDATION, ErrorSeverity.LOW, RecoveryStrategy.USER_ACTION);
    this.name = "SocialContentError";
    Object.setPrototypeOf(this, SocialContentError.prototype);
  }
}

/**
 * Error thrown when a social operation fails due to permissions issues
 */
export class SocialPermissionError extends AppError {
  constructor(message: string) {
    super(message, ErrorCategory.AUTHORIZATION, ErrorSeverity.MEDIUM, RecoveryStrategy.USER_ACTION);
    this.name = "SocialPermissionError";
    Object.setPrototypeOf(this, SocialPermissionError.prototype);
  }
}

/**
 * Helper function to parse errors from social API responses
 */
export function parseSocialError(error: any): Error {
  if (!error) {
    return new Error("Unknown social error");
  }

  // If it's already one of our custom errors, just return it
  if (
    error instanceof SocialAuthError ||
    error instanceof SocialRateLimitError ||
    error instanceof SocialContentError ||
    error instanceof SocialPermissionError ||
    error instanceof AppError
  ) {
    return error;
  }

  // Parse error message to determine type
  const message = typeof error === "string" ? error : error.message || "Unknown social error";
  
  // Try to determine error type from message
  if (message.includes("auth") || message.includes("token") || message.includes("sign")) {
    return new SocialAuthError(message);
  }
  
  if (message.includes("rate") || message.includes("limit") || message.includes("too many")) {
    return new SocialRateLimitError(message);
  }
  
  if (message.includes("content") || message.includes("format") || message.includes("invalid")) {
    return new SocialContentError(message);
  }
  
  if (message.includes("permission") || message.includes("access") || message.includes("not allowed")) {
    return new SocialPermissionError(message);
  }
  
  // Default to generic AppError
  return new AppError("SOCIAL_ERROR", message);
}

/**
 * Wrapper function to safely execute social API calls with proper error handling
 */
export async function safeSocialCall<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const parsedError = parseSocialError(error);
    console.error(`Social error during ${operation}:`, parsedError);
    throw parsedError;
  }
}