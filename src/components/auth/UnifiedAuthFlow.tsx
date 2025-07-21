import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBasicAuth } from "@/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Mail,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UnifiedAuthFlowProps {
  onComplete?: () => void;
  className?: string;
}

/**
 * Simplified UnifiedAuthFlow - Core auth only
 * Uses new modular auth system
 */
export const UnifiedAuthFlow: React.FC<UnifiedAuthFlowProps> = ({
  onComplete,
  className,
}) => {
  const isMobile = useIsMobile();
  const auth = useBasicAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = isSignUp
        ? await auth.register(email, password)
        : await auth.login(email, password);

      if (result.success) {
        if (onComplete) {
          onComplete();
        }
      } else {
        setError(result.error || "Authentication failed");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Authentication failed"
      );
    }

    setIsLoading(false);
  };

  // If already authenticated, show success
  if (auth.isAuthenticated) {
    return (
      <Card className={cn("w-full max-w-md mx-auto", className)}>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>Welcome back!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            You're signed in and ready to go.
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Email:</span>
              <span className="text-muted-foreground">{auth.user?.email}</span>
            </div>
          </div>
          <Button onClick={onComplete} className="w-full">
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show loading state
  if (auth.isLoading) {
    return (
      <Card className={cn("w-full max-w-md mx-auto", className)}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-muted-foreground">
              Checking authentication...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
          <Mail className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle>{isSignUp ? "Create Account" : "Sign In"}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {isSignUp
            ? "Create your account to save progress and access features"
            : "Welcome back! Sign in to your account"}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="touch-manipulation"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="touch-manipulation"
              disabled={isLoading}
              onKeyPress={(e) => e.key === "Enter" && handleAuth()}
            />
          </div>

          <Button
            onClick={handleAuth}
            disabled={isLoading || !email || !password}
            className="w-full touch-manipulation"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {isSignUp ? "Create Account" : "Sign In"}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
              disabled={isLoading}
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Create one"}
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-center text-muted-foreground">
            By continuing, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnifiedAuthFlow;
