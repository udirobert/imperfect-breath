/**
 * Gentle Error Boundary for Meditation App
 *
 * Provides calming, non-disruptive error handling that maintains
 * the peaceful meditation experience even when technical issues occur.
 */

import React, { Component, ReactNode } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Heart, RefreshCw } from "lucide-react";

interface GentleErrorBoundaryState {
  hasError: boolean;
  errorMessage?: string;
}

interface GentleErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

export class GentleErrorBoundary extends Component<
  GentleErrorBoundaryProps,
  GentleErrorBoundaryState
> {
  constructor(props: GentleErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): GentleErrorBoundaryState {
    // Update state so the next render shows the fallback UI
    return {
      hasError: true,
      errorMessage: error.message,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error silently - don't disrupt the user
    if (process.env.NODE_ENV === "development") {
      console.error("Gentle error caught:", error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg">
          <CardContent className="p-8 text-center space-y-6">
            {/* Calming icon */}
            <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center mx-auto">
              <Heart className="h-8 w-8 text-white" />
            </div>

            {/* Gentle message */}
            <div className="space-y-3">
              <h3 className="text-xl font-light text-gray-800">
                Taking a Mindful Pause
              </h3>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                {this.props.fallbackMessage ||
                  "Your breathing practice continues. Sometimes technology needs a moment to reset, just like we do."}
              </p>
            </div>

            {/* Gentle action */}
            <Button
              onClick={this.handleReset}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Continue Practice
            </Button>

            {/* Breathing reminder */}
            <div className="text-sm text-gray-500 space-y-1">
              <p>While we reset, take three deep breaths:</p>
              <p className="font-light">Inhale... Hold... Exhale...</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default GentleErrorBoundary;
