/**
 * Error Boundary Components
 * 
 * React error boundaries with fallback UI and error reporting.
 * Provides different error boundaries for different parts of the app.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppError, ErrorFactory, ErrorCategory, ErrorSeverity } from './error-types';
import { errorReporter } from './error-reporter';

interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
  errorId: string | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: AppError, retry: () => void) => ReactNode;
  onError?: (error: AppError) => void;
  category?: ErrorCategory;
  isolate?: boolean; // If true, prevents error from bubbling up
}

/**
 * Base Error Boundary
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const appError = ErrorFactory.fromError(error);
    
    return {
      hasError: true,
      error: appError,
      errorId: appError.id,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = ErrorFactory.fromError(
      error, 
      this.props.category,
      {
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name,
      }
    );

    // Report error
    errorReporter.reportError(appError);

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(appError);
    }

    // Prevent error from bubbling if isolate is true
    if (this.props.isolate) {
      return;
    }
  }

  retry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.retry);
      }

      return <DefaultErrorFallback error={this.state.error} onRetry={this.retry} />;
    }

    return this.props.children;
  }
}

/**
 * Default Error Fallback Component
 */
interface DefaultErrorFallbackProps {
  error: AppError;
  onRetry: () => void;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({ error, onRetry }) => {
  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 'border-red-500 bg-red-50';
      case ErrorSeverity.HIGH:
        return 'border-orange-500 bg-orange-50';
      case ErrorSeverity.MEDIUM:
        return 'border-yellow-500 bg-yellow-50';
      case ErrorSeverity.LOW:
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const handleAction = async () => {
    if (error.action) {
      try {
        await error.action();
      } catch (actionError) {
        console.error('Error action failed:', actionError);
      }
    } else {
      onRetry();
    }
  };

  return (
    <div className={`border-2 rounded-lg p-6 m-4 ${getSeverityColor(error.severity)}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {error.severity === ErrorSeverity.CRITICAL && (
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          )}
          {error.severity === ErrorSeverity.HIGH && (
            <svg className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {(error.severity === ErrorSeverity.MEDIUM || error.severity === ErrorSeverity.LOW) && (
            <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error.severity === ErrorSeverity.CRITICAL ? 'Critical Error' :
             error.severity === ErrorSeverity.HIGH ? 'Error' :
             'Something went wrong'}
          </h3>
          
          <p className="text-gray-700 mb-4">
            {error.userMessage}
          </p>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleAction}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {error.actionLabel || 'Try Again'}
            </button>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                  Technical Details
                </summary>
                <div className="mt-2 p-2 bg-gray-100 rounded text-gray-800">
                  <p><strong>Error ID:</strong> {error.id}</p>
                  <p><strong>Category:</strong> {error.category}</p>
                  <p><strong>Message:</strong> {error.message}</p>
                  {error.context && Object.keys(error.context).length > 0 && (
                    <div>
                      <strong>Context:</strong>
                      <pre className="text-xs mt-1 overflow-auto">
                        {JSON.stringify(error.context, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Camera Error Boundary
 */
export const CameraErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'category'>> = (props) => {
  return (
    <ErrorBoundary
      {...props}
      category={ErrorCategory.CAMERA}
      fallback={(error, retry) => (
        <div className="aspect-video bg-red-50 rounded-lg flex items-center justify-center border-2 border-red-200">
          <div className="text-center p-4">
            <svg className="h-12 w-12 text-red-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-red-800 mb-2">Camera Error</h3>
            <p className="text-red-600 text-sm mb-4">{error.userMessage}</p>
            <button
              onClick={retry}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Retry Camera
            </button>
          </div>
        </div>
      )}
    />
  );
};

/**
 * Wallet Error Boundary
 */
export const WalletErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'category'>> = (props) => {
  return (
    <ErrorBoundary
      {...props}
      category={ErrorCategory.WALLET}
      fallback={(error, retry) => (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-orange-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-orange-800">Wallet Connection Issue</h3>
              <p className="text-orange-700 text-sm mt-1">{error.userMessage}</p>
            </div>
            <button
              onClick={retry}
              className="ml-4 px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    />
  );
};

/**
 * Session Error Boundary
 */
export const SessionErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'category'>> = (props) => {
  return (
    <ErrorBoundary
      {...props}
      category={ErrorCategory.SESSION}
      fallback={(error, retry) => (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <svg className="h-10 w-10 text-yellow-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Session Error</h3>
          <p className="text-yellow-700 mb-4">{error.userMessage}</p>
          <button
            onClick={retry}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
          >
            Restart Session
          </button>
        </div>
      )}
    />
  );
};

/**
 * Network Error Boundary
 */
export const NetworkErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'category'>> = (props) => {
  return (
    <ErrorBoundary
      {...props}
      category={ErrorCategory.NETWORK}
      isolate={true} // Don't let network errors crash the whole app
      fallback={(error, retry) => (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800">Connection Issue</h3>
              <p className="text-blue-700 text-sm mt-1">{error.userMessage}</p>
            </div>
            <button
              onClick={retry}
              className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    />
  );
};

/**
 * Session Startup Error Boundary (catches session initialization errors)
 */
export const SessionStartupErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'category'>> = (props) => {
  return (
    <ErrorBoundary
      {...props}
      category={ErrorCategory.SESSION}
      isolate={true} // Prevent session errors from crashing the whole app
      fallback={(error, retry) => (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="max-w-md w-full bg-white shadow-xl rounded-lg p-6 mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">Session Starting...</h1>
              <p className="text-gray-600 mb-6">We're preparing your breathing session. This should only take a moment.</p>

              <div className="space-y-3">
                <button
                  onClick={retry}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Retry Session
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Refresh Page
                </button>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <div className="mt-6 text-left">
                  <details className="text-sm">
                    <summary className="cursor-pointer font-medium text-gray-700">Technical Details</summary>
                    <div className="mt-2 p-3 bg-gray-100 rounded text-xs">
                      <p><strong>Error ID:</strong> {error.id}</p>
                      <p><strong>Message:</strong> {error.message}</p>
                      <p><strong>Category:</strong> {error.category}</p>
                      <p><strong>Severity:</strong> {error.severity}</p>
                      {error.stack && (
                        <div>
                          <strong>Stack:</strong>
                          <pre className="mt-1 overflow-auto whitespace-pre-wrap">{error.stack}</pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    />
  );
};

/**
 * Global Error Boundary (catches all unhandled errors)
 */
export const GlobalErrorBoundary: React.FC<ErrorBoundaryProps> = (props) => {
  return (
    <ErrorBoundary
      {...props}
      onError={(error) => {
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Global error caught:', error);
        }

        // Call custom handler if provided
        props.onError?.(error);
      }}
      fallback={(error, retry) => (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <svg className="h-16 w-16 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h1>
              <p className="text-gray-600 mb-6">{error.userMessage}</p>

              <div className="space-y-3">
                <button
                  onClick={retry}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Refresh Page
                </button>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <div className="mt-6 text-left">
                  <details className="text-sm">
                    <summary className="cursor-pointer font-medium text-gray-700">Technical Details</summary>
                    <div className="mt-2 p-3 bg-gray-100 rounded text-xs">
                      <p><strong>Error ID:</strong> {error.id}</p>
                      <p><strong>Message:</strong> {error.message}</p>
                      <p><strong>Category:</strong> {error.category}</p>
                      <p><strong>Severity:</strong> {error.severity}</p>
                      {error.stack && (
                        <div>
                          <strong>Stack:</strong>
                          <pre className="mt-1 overflow-auto whitespace-pre-wrap">{error.stack}</pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    />
  );
};