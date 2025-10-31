import React, { useState, useCallback, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth, type AuthFeatures } from "@/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuthPreferences } from "@/hooks/useAuthPreferences";
import { useAuthPerformance } from "@/auth/performance/useAuthPerformance";
import {
  Mail,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  ChevronLeft,
  Users,
  Coins,
  Wallet,
  Star,
  Plus,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AUTH_METHODS,
  getRecommendedAuthMethods,
  getAuthMethodDisplay,
  type AuthContext,
} from "@/auth/auth-methods";
import { AuthMethodCard } from "@/auth/components/AuthMethodCard";

// PERFORMANT: Lazy load wallet auth component
const LazyWalletAuth = React.lazy(() =>
  import("@/auth/performance/LazyWalletAuth").then((module) => ({
    default: module.LazyWalletAuth,
  })),
);

// PERFORMANT: Lazy load Flow auth component
const LazyFlowAuth = React.lazy(() =>
  import("@/auth/components/FlowAuth").then((module) => ({
    default: module.FlowAuth,
  })),
);

// PERFORMANT: Lazy load Lens auth component
const LazyLensAuth = React.lazy(() =>
  import("@/auth/components/LensAuth").then((module) => ({
    default: module.LensAuth,
  })),
);

interface UnifiedAuthFlowProps {
  // MODULAR: Support different auth feature combinations
  features?: AuthFeatures;
  // CLEAN: Clear completion callback with auth type info
  onComplete?: (authType?: string) => void;
  // ORGANIZED: Context-aware auth recommendations
  context?: AuthContext;
  // PERFORMANT: Adaptive display modes
  mode?: "full" | "minimal" | "contextual";
  className?: string;
}

/**
 * ENHANCED UnifiedAuthFlow - Multi-method auth support
 *
 * ENHANCEMENT FIRST: Enhanced existing component vs creating new ones
 * MODULAR: Composable auth methods and features
 * CLEAN: Clear separation between method selection and auth flows
 * PERFORMANT: Adaptive loading and contextual recommendations
 */
export const UnifiedAuthFlow: React.FC<UnifiedAuthFlowProps> = ({
  features = {},
  onComplete,
  context,
  mode = "full",
  className,
}) => {
  const isMobile = useIsMobile();
  const auth = useAuth(features);
  const preferences = useAuthPreferences();
  const performance = useAuthPerformance();

  // CLEAN: Separate state for method selection vs auth flow
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [authStep, setAuthStep] = useState<"select" | "authenticate">("select");

  // Email auth state (only when needed)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  // PERFORMANT: Get recommended auth methods based on context and preferences
  const recommendedMethods = getRecommendedAuthMethods(context, {
    isAuthenticated: auth.isAuthenticated,
    hasWallet: auth.hasWallet || false,
  });

  const displayMethods = getAuthMethodDisplay(recommendedMethods, mode);

  // PERFORMANT: Get user's preferred method for smart defaults
  const preferredMethod = preferences.getRecommendedMethod(displayMethods);

  // PERFORMANT: Initialize performance tracking
  useEffect(() => {
    if (!auth.isAuthenticated) {
      performance.startAuthFlow();
    }
  }, [auth.isAuthenticated, performance]);

  // PERFORMANT: Trigger wallet preloading based on user behavior
  useEffect(() => {
    if (preferences.shouldPreloadWallet) {
      preferences.triggerWalletPreload();
    }
  }, [preferences]);

  // PERFORMANT: Auto-select preferred method if user wants to skip selection
  useEffect(() => {
    if (
      preferences.shouldSkipSelection() &&
      preferredMethod &&
      !selectedMethod
    ) {
      setSelectedMethod(preferredMethod.id);
      if (preferredMethod.id !== "email") {
        setAuthStep("authenticate");
      }
    }
  }, [preferences, preferredMethod, selectedMethod]);

  // ENHANCED: Handle different auth methods with performance tracking
  const handleMethodSelect = useCallback(
    (methodId: string) => {
      // PERFORMANT: Track method selection
      performance.trackMethodSelection(methodId);
      preferences.trackAuthAttempt(methodId);
      preferences.markOptionSeen(methodId as "wallet" | "guest");

      setSelectedMethod(methodId);
      setError(null);

      if (methodId === "guest") {
        // Guest mode - no auth required
        performance.completeAuthFlow(true, "guest");
        preferences.trackAuthSuccess("guest");
        onComplete?.("guest");
        return;
      }

      if (methodId === "wallet") {
        // Wallet auth will be handled by LazyWalletAuth component
        setAuthStep("authenticate");
        return;
      }

      if (methodId === "lens") {
        // Lens auth will be handled by LazyLensAuth component
        setAuthStep("authenticate");
        return;
      }

      if (methodId === "flow") {
        // Flow auth will be handled by LazyFlowAuth component
        setAuthStep("authenticate");
        return;
      }

      // Email auth - show form
      setAuthStep("authenticate");
    },
    [onComplete, performance, preferences],
  );

  const handleWalletAuthSuccess = useCallback(() => {
    performance.completeAuthFlow(true, "wallet");
    preferences.trackAuthSuccess("wallet");
    onComplete?.("wallet");
  }, [onComplete, performance, preferences]);

  const handleWalletAuthError = useCallback(
    (error: string) => {
      performance.trackError(error, "wallet-auth");
      setError(error);
    },
    [performance],
  );

  const handleFlowAuthSuccess = useCallback(() => {
    performance.completeAuthFlow(true, "flow");
    preferences.trackAuthSuccess("flow");
    onComplete?.("flow");
  }, [onComplete, performance, preferences]);

  const handleFlowAuthError = useCallback(
    (error: string) => {
      performance.trackError(error, "flow-auth");
      setError(error);
    },
    [performance],
  );

  const handleLensAuthSuccess = useCallback(() => {
    performance.completeAuthFlow(true, "lens");
    preferences.trackAuthSuccess("lens");
    onComplete?.("lens");
  }, [onComplete, performance, preferences]);

  const handleLensAuthError = useCallback(
    (error: string) => {
      performance.trackError(error, "lens-auth");
      setError(error);
    },
    [performance],
  );

  const handleEmailAuth = async () => {
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
        performance.completeAuthFlow(true, "email");
        preferences.trackAuthSuccess("email");
        onComplete?.("email");
      } else {
        performance.trackError(
          result.error || "Email auth failed",
          "email-auth",
        );
        setError(result.error || "Authentication failed");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Authentication failed";
      performance.trackError(errorMessage, "email-auth");
      setError(errorMessage);
    }

    setIsLoading(false);
  };

  const handleBack = useCallback(() => {
    setSelectedMethod(null);
    setAuthStep("select");
    setError(null);
  }, []);

  // If already authenticated, show enhanced status
  if (auth.isAuthenticated) {
    const connectedCount = [
      auth.hasUser,
      auth.hasWallet,
      auth.hasLensProfile,
      auth.hasFlowAccount,
    ].filter(Boolean).length;

    return (
      <Card className={cn("w-full max-w-md mx-auto", className)}>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>Welcome back!</CardTitle>
          <p className="text-sm text-muted-foreground">
            {connectedCount}/4 authentication methods connected
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connected services */}
          <div className="space-y-2">
            {auth.hasUser && (
              <div className="flex items-center justify-between text-sm bg-green-50 p-2 rounded">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-green-600" />
                  <span>Account</span>
                </div>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            )}
            {auth.hasWallet && (
              <div className="flex items-center justify-between text-sm bg-green-50 p-2 rounded">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-green-600" />
                  <span>Wallet</span>
                </div>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            )}
            {auth.hasLensProfile && (
              <div className="flex items-center justify-between text-sm bg-green-50 p-2 rounded">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span>Lens Social</span>
                </div>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            )}
            {auth.hasFlowAccount && (
              <div className="flex items-center justify-between text-sm bg-green-50 p-2 rounded">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-green-600" />
                  <span>Flow Blockchain</span>
                </div>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            )}
          </div>

          {/* Multi-auth benefits */}
          {connectedCount > 1 && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">
                  {connectedCount === 4
                    ? "Maximum Access Unlocked!"
                    : "Enhanced Access"}
                </span>
              </div>
              <div className="text-xs text-purple-700">
                {auth.hasLensProfile && auth.hasFlowAccount && (
                  <div>✨ Complete Web3: Social + Onchain features</div>
                )}
                {connectedCount >= 3 && (
                  <div>🎯 Cross-platform compatibility enabled</div>
                )}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            {auth.hasLensProfile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  window.open(`https://lens.xyz/u/${auth.lensHandle}`, "_blank")
                }
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Lens
              </Button>
            )}
            {auth.hasFlowAccount && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  window.open(
                    `https://flowscan.org/account/${auth.flowAddress}`,
                    "_blank",
                  )
                }
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Flow
              </Button>
            )}
          </div>

          <Button
            onClick={() => onComplete?.("authenticated")}
            className="w-full"
          >
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

  // CLEAN: Method selection view
  if (authStep === "select" || !selectedMethod) {
    return (
      <div className={cn("w-full max-w-2xl mx-auto", className)}>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">
            {context?.type === "profile"
              ? "Welcome to Imperfect Breath"
              : "Choose how to continue"}
          </h2>
          <p className="text-muted-foreground">
            {context?.type === "profile"
              ? "Start your breathing journey with the option that works best for you"
              : "Select your preferred way to access enhanced features"}
          </p>

          {/* CLEAN: Multi-auth explanation - only show if not authenticated */}
          {mode === "full" && (
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                💡 Connect multiple for maximum benefits
              </h3>
              <div className="space-y-1 text-xs text-blue-700">
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  <span>
                    <strong>Lens:</strong> Social + community
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Coins className="h-3 w-3" />
                  <span>
                    <strong>Flow:</strong> NFTs + monetization
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-3 w-3" />
                  <span>
                    <strong>Combined:</strong> Complete Web3 experience
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className={cn(
            "grid gap-4",
            mode === "minimal"
              ? "grid-cols-1"
              : isMobile
                ? "grid-cols-1"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
          )}
        >
          {displayMethods.map((method, index) => {
            // PERFORMANT: Prioritize preferred method
            const isRecommended =
              method.id === preferredMethod?.id ||
              (index === 0 && !preferredMethod);

            return (
              <AuthMethodCard
                key={method.id}
                method={method}
                onSelect={handleMethodSelect}
                isRecommended={isRecommended}
                isLoading={isLoading && selectedMethod === method.id}
                variant={
                  mode === "minimal"
                    ? "minimal"
                    : isMobile
                      ? "compact"
                      : "default"
                }
              />
            );
          })}
        </div>

        {/* PERFORMANT: Show performance hints for returning users */}
        {preferences.hasAuthHistory && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              💡 We've remembered your preferences to make sign-in faster
            </p>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    );
  }

  // CLEAN: Wallet authentication (when wallet method selected)
  if (selectedMethod === "wallet" && authStep === "authenticate") {
    return (
      <Suspense
        fallback={
          <Card className={cn("w-full max-w-md mx-auto", className)}>
            <CardContent className="flex items-center justify-center p-8">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-muted-foreground">
                  Loading wallet options...
                </span>
              </div>
            </CardContent>
          </Card>
        }
      >
        <LazyWalletAuth
          onSuccess={handleWalletAuthSuccess}
          onBack={handleBack}
          onError={handleWalletAuthError}
          className={className}
          preload={preferences.shouldPreloadWallet}
        />
      </Suspense>
    );
  }

  // CLEAN: Flow authentication (when flow method selected)
  if (selectedMethod === "flow" && authStep === "authenticate") {
    return (
      <Suspense
        fallback={
          <Card className={cn("w-full max-w-md mx-auto", className)}>
            <CardContent className="flex items-center justify-center p-8">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-muted-foreground">
                  Loading Flow authentication...
                </span>
              </div>
            </CardContent>
          </Card>
        }
      >
        <div className={cn("w-full max-w-md mx-auto", className)}>
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-1 h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold flex-1">Flow Blockchain</h2>
          </div>
          <LazyFlowAuth
            onSuccess={handleFlowAuthSuccess}
            onError={handleFlowAuthError}
          />
        </div>
      </Suspense>
    );
  }

  // CLEAN: Lens authentication (when lens method selected)
  if (selectedMethod === "lens" && authStep === "authenticate") {
    return (
      <Suspense
        fallback={
          <Card className={cn("w-full max-w-md mx-auto", className)}>
            <CardContent className="flex items-center justify-center p-8">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-muted-foreground">
                  Loading Lens authentication...
                </span>
              </div>
            </CardContent>
          </Card>
        }
      >
        <div className={cn("w-full max-w-md mx-auto", className)}>
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-1 h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold flex-1">Lens Protocol</h2>
          </div>
          <LazyLensAuth
            onSuccess={handleLensAuthSuccess}
            onError={handleLensAuthError}
          />
        </div>
      </Suspense>
    );
  }

  // CLEAN: Email authentication form (when email method selected)
  if (selectedMethod === "email" && authStep === "authenticate") {
    return (
      <Card className={cn("w-full max-w-md mx-auto", className)}>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-1 h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center flex-1">
              <div className="mx-auto w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-lg">
                {isSignUp ? "Create Account" : "Sign In"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {isSignUp
                  ? "Create your account to save progress and access features"
                  : "Welcome back! Sign in to your account"}
              </p>
            </div>
          </div>
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
                onKeyPress={(e) => e.key === "Enter" && handleEmailAuth()}
              />
            </div>

            <Button
              onClick={handleEmailAuth}
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
        </CardContent>
      </Card>
    );
  }

  // Fallback - should not reach here
  return null;
};

export default UnifiedAuthFlow;
