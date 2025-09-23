/**
 * Error Types and Classifications
 * 
 * Defines standard error types with classification for consistent error handling
 * across the application.
 */

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  CAMERA = 'camera',
  WALLET = 'wallet',
  SESSION = 'session',
  AI = 'ai',
  STORAGE = 'storage',
  UNKNOWN = 'unknown',
}

/**
 * Recovery strategies for errors
 */
export enum RecoveryStrategy {
  RETRY = 'retry',
  REFRESH = 'refresh',
  RECONNECT = 'reconnect',
  RESTART = 'restart',
  FALLBACK = 'fallback',
  USER_ACTION = 'user_action',
  IGNORE = 'ignore',
  FATAL = 'fatal',
}

/**
 * Base error interface
 */
export interface ErrorInfo {
  id: string;
  name: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  recovery: RecoveryStrategy;
  timestamp: number;
  context?: Record<string, unknown>;
  stack?: string;
  userMessage: string;
  actionLabel?: string;
  action?: () => void | Promise<void>;
}

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly id: string;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly recovery: RecoveryStrategy;
  public readonly timestamp: number;
  public readonly context: Record<string, unknown>;
  public readonly userMessage: string;
  public readonly actionLabel?: string;
  public readonly action?: () => void | Promise<void>;

  constructor(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    recovery: RecoveryStrategy = RecoveryStrategy.USER_ACTION,
    context: Record<string, unknown> = {},
    userMessage?: string,
    actionLabel?: string,
    action?: () => void | Promise<void>
  ) {
    super(message);
    this.name = 'AppError';
    this.id = this.generateId();
    this.category = category;
    this.severity = severity;
    this.recovery = recovery;
    this.timestamp = Date.now();
    this.context = context;
    this.userMessage = userMessage || this.getDefaultUserMessage();
    this.actionLabel = actionLabel;
    this.action = action;
  }

  private generateId(): string {
    return `${this.category}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultUserMessage(): string {
    switch (this.category) {
      case ErrorCategory.NETWORK:
        return 'Network connection issue. Please check your internet connection.';
      case ErrorCategory.CAMERA:
        return 'Camera access failed. Please check your camera permissions.';
      case ErrorCategory.WALLET:
        return 'Wallet connection issue. Please check your wallet.';
      case ErrorCategory.SESSION:
        return 'Session error occurred. Please try restarting your session.';
      case ErrorCategory.AUTHENTICATION:
        return 'Authentication failed. Please sign in again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  toErrorInfo(): ErrorInfo {
    return {
      id: this.id,
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      recovery: this.recovery,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack,
      userMessage: this.userMessage,
      actionLabel: this.actionLabel,
      action: this.action,
    };
  }
}

/**
 * Network-related errors
 */
export class NetworkError extends AppError {
  constructor(
    message: string,
    context: Record<string, unknown> = {},
    recovery: RecoveryStrategy = RecoveryStrategy.RETRY
  ) {
    super(
      message,
      ErrorCategory.NETWORK,
      ErrorSeverity.MEDIUM,
      recovery,
      context,
      'Connection problem. Please check your internet and try again.',
      recovery === RecoveryStrategy.RETRY ? 'Retry' : undefined
    );
    this.name = 'NetworkError';
  }
}

/**
 * Camera-related errors
 */
export class CameraError extends AppError {
  constructor(
    message: string,
    context: Record<string, unknown> = {},
    recovery: RecoveryStrategy = RecoveryStrategy.USER_ACTION
  ) {
    const userMessage = message.includes('NotAllowedError')
      ? 'Camera access denied. Please allow camera permissions in your browser.'
      : message.includes('NotFoundError')
        ? 'No camera found. Please connect a camera and try again.'
        : 'Camera error occurred. Please check your camera settings.';

    super(
      message,
      ErrorCategory.CAMERA,
      ErrorSeverity.MEDIUM,
      recovery,
      context,
      userMessage,
      'Check Camera'
    );
    this.name = 'CameraError';
  }
}

/**
 * Wallet-related errors
 */
export class WalletError extends AppError {
  constructor(
    message: string,
    context: Record<string, unknown> = {},
    recovery: RecoveryStrategy = RecoveryStrategy.RETRY
  ) {
    const userMessage = message.includes('rejected')
      ? 'Transaction rejected. Please try again if you want to proceed.'
      : message.includes('insufficient')
        ? 'Insufficient funds for this transaction.'
        : 'Wallet connection issue. Please check your wallet.';

    super(
      message,
      ErrorCategory.WALLET,
      ErrorSeverity.MEDIUM,
      recovery,
      context,
      userMessage,
      'Retry'
    );
    this.name = 'WalletError';
  }
}

/**
 * Session-related errors
 */
export class SessionError extends AppError {
  constructor(
    message: string,
    context: Record<string, unknown> = {},
    recovery: RecoveryStrategy = RecoveryStrategy.RESTART
  ) {
    super(
      message,
      ErrorCategory.SESSION,
      ErrorSeverity.MEDIUM,
      recovery,
      context,
      'Session error. Please restart your breathing session.',
      'Restart Session'
    );
    this.name = 'SessionError';
  }
}

/**
 * Authentication errors
 */
export class AuthError extends AppError {
  constructor(
    message: string,
    context: Record<string, unknown> = {},
    recovery: RecoveryStrategy = RecoveryStrategy.USER_ACTION
  ) {
    super(
      message,
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.HIGH,
      recovery,
      context,
      'Authentication failed. Please sign in again.',
      'Sign In'
    );
    this.name = 'AuthError';
  }
}

/**
 * AI-related errors
 */
export class AIError extends AppError {
  constructor(
    message: string,
    context: Record<string, unknown> = {},
    recovery: RecoveryStrategy = RecoveryStrategy.FALLBACK
  ) {
    super(
      message,
      ErrorCategory.AI,
      ErrorSeverity.LOW,
      recovery,
      context,
      'AI features temporarily unavailable. Session will continue without AI assistance.'
    );
    this.name = 'AIError';
  }
}

/**
 * Vision-specific errors
 */
export class VisionError extends AppError {
  constructor(
    message: string,
    context: Record<string, unknown> = {},
    recovery: RecoveryStrategy = RecoveryStrategy.FALLBACK
  ) {
    const userMessage = message.includes('model')
      ? 'Vision model loading failed. Your session will continue without face tracking.'
      : message.includes('landmarks')
        ? 'Face detection temporarily unavailable. Continuing with basic session.'
        : message.includes('camera')
          ? 'Camera vision processing failed. Session continues without tracking.'
          : 'Vision features temporarily unavailable. Your breathing session continues normally.';

    super(
      message,
      ErrorCategory.AI,
      ErrorSeverity.LOW,
      recovery,
      { ...context, visionError: true },
      userMessage,
      'Continue Session'
    );
    this.name = 'VisionError';
  }
}

/**
 * FaceMesh-specific errors
 */
export class FaceMeshError extends AppError {
  constructor(
    message: string,
    context: Record<string, unknown> = {},
    recovery: RecoveryStrategy = RecoveryStrategy.RETRY
  ) {
    const userMessage = message.includes('loading')
      ? 'Face tracking model is loading. This may take a moment on first use.'
      : message.includes('detection')
        ? 'Face detection temporarily unavailable. Please ensure good lighting and face visibility.'
        : message.includes('processing')
          ? 'Face processing error. Your session continues without face tracking.'
          : 'Face tracking features temporarily unavailable.';

    super(
      message,
      ErrorCategory.AI,
      ErrorSeverity.MEDIUM,
      recovery,
      { ...context, faceMeshError: true },
      userMessage,
      'Retry Face Tracking'
    );
    this.name = 'FaceMeshError';
  }
}

/**
 * MediaPipe-specific errors
 */
export class MediaPipeError extends AppError {
  constructor(
    message: string,
    context: Record<string, unknown> = {},
    recovery: RecoveryStrategy = RecoveryStrategy.FALLBACK
  ) {
    super(
      message,
      ErrorCategory.AI,
      ErrorSeverity.MEDIUM,
      recovery,
      { ...context, mediaPipeError: true },
      'MediaPipe vision processing failed. Session continues without advanced tracking.',
      'Continue Without Vision'
    );
    this.name = 'MediaPipeError';
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    field?: string,
    context: Record<string, unknown> = {}
  ) {
    super(
      message,
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      RecoveryStrategy.USER_ACTION,
      { field, ...context },
      `Please check your input: ${message}`
    );
    this.name = 'ValidationError';
  }
}

/**
 * Critical system errors
 */
export class CriticalError extends AppError {
  constructor(
    message: string,
    context: Record<string, unknown> = {}
  ) {
    super(
      message,
      ErrorCategory.UNKNOWN,
      ErrorSeverity.CRITICAL,
      RecoveryStrategy.FATAL,
      context,
      'A critical error occurred. Please refresh the page.',
      'Refresh Page',
      () => window.location.reload()
    );
    this.name = 'CriticalError';
  }
}

/**
 * Utility functions for error handling
 */

/**
 * Create an error with a specific code and context
 */
export function createError(
  code: string,
  message: string,
  context?: Record<string, unknown>
): AppError {
  return new AppError(
    message,
    ErrorCategory.UNKNOWN,
    ErrorSeverity.MEDIUM,
    RecoveryStrategy.USER_ACTION,
    context
  );
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
    return new AppError(
      message,
      ErrorCategory.UNKNOWN,
      ErrorSeverity.MEDIUM,
      RecoveryStrategy.USER_ACTION,
      { originalError: error.message }
    );
  }

  const message = `Unknown error during ${operation}`;
  console.error(message, error);
  return new AppError(
    message,
    ErrorCategory.UNKNOWN,
    ErrorSeverity.MEDIUM,
    RecoveryStrategy.USER_ACTION,
    { originalError: String(error) }
  );
}

/**
 * Handle API errors with proper response formatting
 *
 * @param res The response object
 * @param error The error that occurred
 * @param operation Description of the operation that failed
 * @returns Response with appropriate status code and error details
 */
export function handleApiError(res: { status: (code: number) => { json: (data: any) => any } }, error: unknown, operation: string): unknown {
  console.error(`API Error - ${operation}:`, error);

  // Default to 500 Internal Server Error
  let statusCode = 500;
  let errorMessage = `Error during ${operation}`;
  let errorCode = 'INTERNAL_SERVER_ERROR';

  if (error instanceof AppError) {
    // Map error categories to HTTP status codes
    errorCode = error.category.toUpperCase();
    errorMessage = error.message;

    if (error.category === ErrorCategory.AUTHENTICATION) {
      statusCode = 401;
    } else if (error.category === ErrorCategory.AUTHORIZATION) {
      statusCode = 403;
    } else if (error.category === ErrorCategory.VALIDATION) {
      statusCode = 400;
    } else if (error.category === ErrorCategory.NETWORK) {
      statusCode = 503;
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

/**
 * Error factory for creating typed errors from generic errors
 */
export class ErrorFactory {
  static fromError(error: Error, category?: ErrorCategory, context?: Record<string, unknown>): AppError {
    if (error instanceof AppError) {
      return error;
    }

    // Try to infer category from error properties
    const inferredCategory = category || this.inferCategory(error);
    const severity = this.inferSeverity(error, inferredCategory);
    const recovery = this.inferRecovery(error, inferredCategory);

    return new AppError(
      error.message,
      inferredCategory,
      severity,
      recovery,
      { originalError: error.name, stack: error.stack, ...context }
    );
  }

  static fromNetworkError(error: Error, context?: Record<string, unknown>): NetworkError {
    return new NetworkError(error.message, { originalError: error.name, ...context });
  }

  static fromCameraError(error: Error, context?: Record<string, unknown>): CameraError {
    return new CameraError(error.message, { originalError: error.name, ...context });
  }

  static fromWalletError(error: Error, context?: Record<string, unknown>): WalletError {
    return new WalletError(error.message, { originalError: error.name, ...context });
  }

  static fromVisionError(error: Error, context?: Record<string, unknown>): VisionError {
    return new VisionError(error.message, { originalError: error.name, ...context });
  }

  static fromFaceMeshError(error: Error, context?: Record<string, unknown>): FaceMeshError {
    return new FaceMeshError(error.message, { originalError: error.name, ...context });
  }

  static fromMediaPipeError(error: Error, context?: Record<string, unknown>): MediaPipeError {
    return new MediaPipeError(error.message, { originalError: error.name, ...context });
  }

  private static inferCategory(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (name.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return ErrorCategory.NETWORK;
    }
    if (message.includes('camera') || name.includes('notallowed') || name.includes('notfound')) {
      return ErrorCategory.CAMERA;
    }
    if (message.includes('wallet') || message.includes('ethereum') || message.includes('transaction')) {
      return ErrorCategory.WALLET;
    }
    if (message.includes('auth') || name.includes('unauthorized')) {
      return ErrorCategory.AUTHENTICATION;
    }
    if (message.includes('session')) {
      return ErrorCategory.SESSION;
    }
    if (message.includes('vision') || message.includes('facemesh') || message.includes('landmark') || message.includes('mediapipe')) {
      return ErrorCategory.AI;
    }
    if (message.includes('model') || message.includes('tensorflow') || message.includes('wasm')) {
      return ErrorCategory.AI;
    }

    return ErrorCategory.UNKNOWN;
  }

  private static inferSeverity(error: Error, category: ErrorCategory): ErrorSeverity {
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return ErrorSeverity.CRITICAL;
    }

    switch (category) {
      case ErrorCategory.AUTHENTICATION:
        return ErrorSeverity.HIGH;
      case ErrorCategory.WALLET:
      case ErrorCategory.CAMERA:
      case ErrorCategory.SESSION:
        return ErrorSeverity.MEDIUM;
      case ErrorCategory.AI:
        return ErrorSeverity.LOW;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  private static inferRecovery(error: Error, category: ErrorCategory): RecoveryStrategy {
    switch (category) {
      case ErrorCategory.NETWORK:
        return RecoveryStrategy.RETRY;
      case ErrorCategory.CAMERA:
      case ErrorCategory.WALLET:
        return RecoveryStrategy.USER_ACTION;
      case ErrorCategory.SESSION:
        return RecoveryStrategy.REFRESH;
      case ErrorCategory.AI:
        return RecoveryStrategy.FALLBACK;
      case ErrorCategory.AUTHENTICATION:
        return RecoveryStrategy.USER_ACTION;
      default:
        return RecoveryStrategy.USER_ACTION;
    }
  }
}