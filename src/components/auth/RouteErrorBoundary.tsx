import React from "react";
import { ErrorBoundary } from "@/lib/errors/error-boundary";
import { ErrorCategory } from "@/lib/errors/error-types";

const RouteErrorFallback: React.FC<{ retry: () => void }> = ({ retry }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
    <div className="rounded-full bg-destructive/10 p-4 mb-4">
      <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
    <p className="text-muted-foreground mb-6 max-w-md">
      This page encountered an error. You can try again or go back to the home page.
    </p>
    <div className="flex gap-3">
      <button
        onClick={retry}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm font-medium"
      >
        Try Again
      </button>
      <a
        href="/"
        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 text-sm font-medium"
      >
        Go Home
      </a>
    </div>
  </div>
);

interface RouteErrorBoundaryProps {
  children: React.ReactNode;
}

const RouteErrorBoundary: React.FC<RouteErrorBoundaryProps> = ({ children }) => {
  return (
    <ErrorBoundary
      category={ErrorCategory.UNKNOWN}
      fallback={(_error, retry) => <RouteErrorFallback retry={retry} />}
    >
      {children}
    </ErrorBoundary>
  );
};

export default RouteErrorBoundary;
