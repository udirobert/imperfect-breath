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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  AUTH_METHODS, 
  getRecommendedAuthMethods, 
  getAuthMethodDisplay,
  type AuthContext 
} from "@/auth/auth-methods";
import { AuthMethodCard } from "@/auth/components/AuthMethodCard";

// PERFORMANT: Lazy load wallet auth component
const LazyWalletAuth = React.lazy(() => 
  import("@/auth/performance/LazyWalletAuth").then(module => ({
    default: module.LazyWalletAuth
  }))
);



interface UnifiedAuthFlowProps {
  // MODULAR: Support different auth feature combinations
  features?: AuthFeatures;
  // CLEAN: Clear completion callback with auth type info
  onComplete?: (authType?: string) => void;
  // ORGANIZED: Context-aware auth recommendations
  context?: AuthContext;
  // PERFORMANT: Adaptive display modes
  mode?: 'full' | 'minimal' | 'contextual';
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
  mode = 'full',
  className,
}) => {
  const isMobile = useIsMobile();
  const auth = useAuth(features);
  const preferences = useAuthPreferences();
  const performance = useAuthPerformance();
  
  // CLEAN: Separate state for method selection vs auth flow
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [authStep, setAuthStep] = useState<'select' | 'authenticate'>('select');

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
    if (preferences.shouldSkipSelection() && preferredMethod && !selectedMethod) {
      setSelectedMethod(preferredMethod.id);
      if (preferredMethod.id !== 'email') {
        setAuthStep('authenticate');
      }
    }
  }, [preferences, preferredMethod, selectedMethod]);

  // ENHANCED: Handle different auth methods with performance tracking
  const handleMethodSelect = useCallback((methodId: string) => {
    // PERFORMANT: Track method selection
    performance.trackMethodSelection(methodId);
    preferences.trackAuthAttempt(methodId);
    preferences.markOptionSeen(methodId as 'wallet' | 'guest');
    
    setSelectedMethod(methodId);
    setError(null);
    
    if (methodId === 'guest') {
      // Guest mode - no auth required
      performance.completeAuthFlow(true, 'guest');
      preferences.trackAuthSuccess('guest');
      onComplete?.('guest');
      return;
    }
    
    if (methodId === 'wallet') {
      // Wallet auth will be handled by LazyWalletAuth component
      setAuthStep('authenticate');
      return;
    }

    // All blockchain-related auth (wallet, lens, flow) now goes through wallet flow
    if (methodId === 'lens' || methodId === 'flow') {
      // These will be handled by wallet auth flow
      setSelectedMethod('wallet');
      setAuthStep('authenticate');
      return;
    }
    
    // Email auth - show form
    setAuthStep('authenticate');
  }, [onComplete, performance, preferences]);
  
  const handleWalletAuthSuccess = useCallback(() => {
    performance.completeAuthFlow(true, 'wallet');
    preferences.trackAuthSuccess('wallet');
    onComplete?.('wallet');
  }, [onComplete, performance, preferences]);
  
  const handleWalletAuthError = useCallback((error: string) => {
    performance.trackError(error, 'wallet-auth');
    setError(error);
  }, [performance]);

  // AGGRESSIVE CONSOLIDATION: Removed handleLensAuth and handleFlowAuth
  // These are now handled by the consolidated wallet auth method
  
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
        performance.completeAuthFlow(true, 'email');
        preferences.trackAuthSuccess('email');
        onComplete?.('email');
      } else {
        performance.trackError(result.error || 'Email auth failed', 'email-auth');
        setError(result.error || "Authentication failed");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Authentication failed";
      performance.trackError(errorMessage, 'email-auth');
      setError(errorMessage);
    }

    setIsLoading(false);
  };
  
  const handleBack = useCallback(() => {
    setSelectedMethod(null);
    setAuthStep('select');
    setError(null);
  }, []);

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
            {auth.user && typeof auth.user === 'object' && auth.user !== null && 'email' in auth.user && auth.user.email && typeof auth.user.email === 'string' && (
              <div className="flex items-center justify-between text-sm">
                <span>Email:</span>
                <span className="text-muted-foreground">{auth.user.email}</span>
              </div>
            )}
            {auth.hasWallet && (
              <div className="flex items-center justify-between text-sm">
                <span>Wallet:</span>
                <span className="text-muted-foreground">
                  {auth.walletAddress?.slice(0, 6)}...{auth.walletAddress?.slice(-4)}
                </span>
              </div>
            )}
            {auth.hasLensProfile && (
              <div className="flex items-center justify-between text-sm">
                <span>Lens:</span>
                <span className="text-muted-foreground">
                  {auth.lensHandle || 'Connected'}
                </span>
              </div>
            )}
            {auth.hasFlowAccount && (
              <div className="flex items-center justify-between text-sm">
                <span>Flow:</span>
                <span className="text-muted-foreground">
                  {auth.flowAddress ? `${auth.flowAddress.slice(0, 6)}...${auth.flowAddress.slice(-4)}` : 'Connected'}
                </span>
              </div>
            )}
          </div>
          <Button onClick={() => onComplete?.()} className="w-full">
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
  if (authStep === 'select' || !selectedMethod) {
    return (
      <div className={cn("w-full max-w-2xl mx-auto", className)}>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">
            {context?.type === 'profile' ? 'Welcome to Imperfect Breath' : 'Choose how to continue'}
          </h2>
          <p className="text-muted-foreground">
            {context?.type === 'profile' 
              ? 'Start your breathing journey with the option that works best for you'
              : 'Select your preferred way to access enhanced features'
            }
          </p>
        </div>
        
        <div className={cn(
          "grid gap-4",
          mode === 'minimal' ? "grid-cols-1" : 
          isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        )}>
          {displayMethods.map((method, index) => {
            // PERFORMANT: Prioritize preferred method
            const isRecommended = method.id === preferredMethod?.id || 
                                 (index === 0 && !preferredMethod);
            
            return (
              <AuthMethodCard
                key={method.id}
                method={method}
                onSelect={handleMethodSelect}
                isRecommended={isRecommended}
                isLoading={isLoading && selectedMethod === method.id}
                variant={mode === 'minimal' ? 'minimal' : isMobile ? 'compact' : 'default'}
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
  if (selectedMethod === 'wallet' && authStep === 'authenticate') {
    return (
      <Suspense fallback={
        <Card className={cn("w-full max-w-md mx-auto", className)}>
          <CardContent className="flex items-center justify-center p-8">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-muted-foreground">Loading wallet options...</span>
            </div>
          </CardContent>
        </Card>
      }>
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
  
  // AGGRESSIVE CONSOLIDATION: Lens and Flow auth now handled by wallet method
  
  // CLEAN: Email authentication form (when email method selected)
  if (selectedMethod === 'email' && authStep === 'authenticate') {
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
              <CardTitle className="text-lg">{isSignUp ? "Create Account" : "Sign In"}</CardTitle>
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
