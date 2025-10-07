/**
 * AI Analysis Error Boundary
 * 
 * ENHANCEMENT FIRST: Wraps AI analysis components to prevent crashes
 * CLEAN: Focused error handling for AI-specific failures
 * MODULAR: Reusable error boundary for AI components
 */

import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class AIAnalysisErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // CLEAN: Update state to trigger fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // ORGANIZED: Log error details for debugging
    console.error('AI Analysis Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    // ENHANCEMENT FIRST: Allow users to retry after error
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // MODULAR: Custom fallback or default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              AI Analysis Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                The AI analysis component encountered an error. This doesn't affect your session data.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                You can try refreshing the analysis or continue without AI insights.
              </p>
              
              <div className="flex gap-2">
                <Button 
                  onClick={this.handleRetry}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry Analysis
                </Button>
              </div>
            </div>

            {/* ORGANIZED: Show error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4">
                <summary className="text-sm font-medium cursor-pointer">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                  {this.state.error.message}
                  {this.state.error.stack && `\n\nStack:\n${this.state.error.stack}`}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default AIAnalysisErrorBoundary;