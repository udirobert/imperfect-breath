/**
 * CONSOLIDATED AuthGate - Unified Authentication Wrapper
 * 
 * AGGRESSIVE CONSOLIDATION: Merges SmartAuthGate and AuthGate functionality
 * CLEAN: Single auth gate component with all features
 * MODULAR: Supports both legacy and new auth patterns
 * DRY: Eliminates duplicate auth gate logic
 */

import React, { useState, useCallback } from "react";
import { useAuth, type AuthFeatures } from "../useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, Users, Coins, BarChart3, Mail, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

// CLEAN: Unified auth requirement types
export type AuthRequirement = 'none' | 'email' | 'wallet' | 'flow' | 'lens';

export interface ConsolidatedAuthGateProps {
  children: React.ReactNode;
  
  // MODULAR: Support both legacy and new patterns
  required?: AuthRequirement;
  features?: AuthFeatures;
  
  // CLEAN: Flexible fallback strategies
  fallback?: 'hide' | 'disable' | 'prompt' | 'redirect';
  fallbackComponent?: React.ComponentType<{ onAuth: () => void }>;
  
  // UX: Context and messaging
  context?: string;
  title?: string;
  description?: string;
  benefits?: string[];
  
  // Callbacks
  onAuthSuccess?: (authType: string) => void;
  onAuthSkip?: () => void;
  
  // Styling
  className?: string;
  requireAll?: boolean;
}

interface AuthMethodInfo {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isConnected: boolean;
  connect?: () => Promise<{ success: boolean; error?: string }>;
  benefits: string[];
}

/**
 * CONSOLIDATED: Single auth gate with all functionality
 */
export const ConsolidatedAuthGate: React.FC<ConsolidatedAuthGateProps> = ({
  children,
  required = 'none',
  features = {},
  fallback = 'prompt',
  fallbackComponent: FallbackComponent,
  context,
  title,
  description,
  benefits,
  onAuthSuccess,
  onAuthSkip,
  className,
  requireAll = false,
}) => {
  const auth = useAuth(features);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // CLEAN: Build auth requirements based on props
  const getAuthMethods = (): AuthMethodInfo[] => {
    const methods: AuthMethodInfo[] = [];

    // Always include core auth
    methods.push({
      id: 'email',
      label: 'Account',
      icon: Mail,
      isConnected: auth.hasUser,
      benefits: ['Save progress', 'Sync across devices', 'Personalized experience'],
    });

    // Add blockchain if requested
    if (features.blockchain || required === 'wallet') {
      methods.push({
        id: 'wallet',
        label: 'Wallet',
        icon: Wallet,
        isConnected: auth.hasWallet,
        connect: auth.connectWallet,
        benefits: ['Own your data', 'Web3 features', 'Decentralized identity'],
      });
    }

    // Add Flow if requested
    if (features.flow || required === 'flow') {
      methods.push({
        id: 'flow',
        label: 'Flow Account',
        icon: Coins,
        isConnected: auth.hasFlowAccount,
        connect: auth.loginFlow,
        benefits: ['NFT features', 'Flow ecosystem', 'Digital collectibles'],
      });
    }

    // Add Lens if requested
    if (features.lens || required === 'lens') {
      methods.push({
        id: 'lens',
        label: 'Lens Profile',
        icon: Users,
        isConnected: auth.hasLensProfile,
        benefits: ['Social features', 'Decentralized social', 'Community access'],
      });
    }

    return methods;
  };

  const authMethods = getAuthMethods();
  const unmetRequirements = authMethods.filter(method => !method.isConnected);
  
  // CLEAN: Determine if user has required access
  const hasAccess = (() => {
    if (required === 'none') return true;
    
    // Legacy requirement mapping
    switch (required) {
      case 'email':
        return auth.hasUser;
      case 'wallet':
        return auth.hasWallet;
      case 'flow':
        return auth.hasFlowAccount;
      case 'lens':
        return auth.hasLensProfile;
      default:
        // Feature-based requirements
        return requireAll 
          ? unmetRequirements.length === 0
          : authMethods.some(method => method.isConnected);
    }
  })();

  // PERFORMANT: Handle auth action
  const handleAuth = useCallback(async (method: AuthMethodInfo) => {
    if (!method.connect) {
      // Redirect to auth flow for methods without direct connect
      window.location.href = `/auth?context=${context || 'feature'}&method=${method.id}`;
      return;
    }

    setIsLoading(true);
    try {
      const result = await method.connect();
      if (result.success) {
        onAuthSuccess?.(method.id);
        setShowAuthPrompt(false);
      }
    } catch (error) {
      console.error(`Auth failed for ${method.id}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [context, onAuthSuccess]);

  const handleSkip = useCallback(() => {
    setShowAuthPrompt(false);
    onAuthSkip?.();
  }, [onAuthSkip]);

  // Show loading state
  if (auth.isLoading) {
    return (
      <div className={cn("auth-gate-loading", className)}>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Checking authentication...</span>
        </div>
      </div>
    );
  }

  // Show children if access granted
  if (hasAccess) {
    return <>{children}</>;
  }

  // Handle different fallback strategies
  switch (fallback) {
    case 'hide':
      return null;

    case 'disable':
      return (
        <div className={cn("relative", className)}>
          <div className="opacity-50 pointer-events-none">{children}</div>
          <div className="mt-4 text-center">
            <Card className="max-w-sm mx-auto">
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  {description || `${required} authentication required`}
                </p>
                <Button
                  size="sm"
                  onClick={() => setShowAuthPrompt(true)}
                  className="pointer-events-auto"
                >
                  Enable Feature
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );

    case 'redirect':
      return (
        <div className="text-center py-8">
          <p>Redirecting for authentication...</p>
        </div>
      );

    case 'prompt':
    default:
      if (FallbackComponent) {
        return <FallbackComponent onAuth={() => setShowAuthPrompt(true)} />;
      }

      return (
        <div className={className}>
          <div onClick={() => setShowAuthPrompt(true)} className="cursor-pointer">
            {children}
          </div>

          <Dialog open={showAuthPrompt} onOpenChange={setShowAuthPrompt}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{title || 'Authentication Required'}</DialogTitle>
                <DialogDescription>
                  {description || `Please connect the required services to continue:`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Benefits section */}
                {(benefits || unmetRequirements.length > 0) && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">What you'll get:</h4>
                    <ul className="space-y-2">
                      {(benefits || unmetRequirements.flatMap(m => m.benefits)).map((benefit, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Auth methods */}
                <div className="space-y-3">
                  {authMethods.map((method) => (
                    <div
                      key={method.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        method.isConnected
                          ? "bg-green-50 border-green-200"
                          : "bg-muted/50 border-border"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <method.icon className="h-5 w-5" />
                        <span className="font-medium">{method.label}</span>
                      </div>

                      {method.isConnected ? (
                        <span className="text-sm text-green-600 font-medium">
                          Connected
                        </span>
                      ) : method.connect ? (
                        <Button
                          size="sm"
                          onClick={() => handleAuth(method)}
                          disabled={isLoading}
                        >
                          Connect
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAuth(method)}
                        >
                          Sign In
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {onAuthSkip && (
                    <Button variant="ghost" onClick={handleSkip} className="flex-1">
                      Skip
                    </Button>
                  )}
                  <Button 
                    onClick={() => setShowAuthPrompt(false)} 
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      );
  }
};

// CLEAN: Convenience components for common use cases
export const BasicAuthGate: React.FC<Omit<ConsolidatedAuthGateProps, "required">> = (props) => (
  <ConsolidatedAuthGate {...props} required="email" />
);

export const Web3AuthGate: React.FC<Omit<ConsolidatedAuthGateProps, "features">> = (props) => (
  <ConsolidatedAuthGate {...props} features={{ blockchain: true }} />
);

export const FlowAuthGate: React.FC<Omit<ConsolidatedAuthGateProps, "features">> = (props) => (
  <ConsolidatedAuthGate {...props} features={{ flow: true }} />
);

export const FullAuthGate: React.FC<Omit<ConsolidatedAuthGateProps, "features">> = (props) => (
  <ConsolidatedAuthGate 
    {...props} 
    features={{ blockchain: true, flow: true, lens: true }} 
    requireAll={true}
  />
);

// CLEAN: Default export for main component
export default ConsolidatedAuthGate;