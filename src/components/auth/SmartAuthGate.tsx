/**
 * SmartAuthGate - Context-Aware Authentication Wrapper
 *
 * This component implements just-in-time authentication by only showing
 * auth prompts when functionally required, based on user actions and context.
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  AuthType,
  AuthContext,
  getAuthMessage,
  getPromptForContext,
} from "../../config/messaging";
import { useAuth } from "../../hooks/useAuth";
import { useWallet } from "../../hooks/useWallet";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { CheckCircle, X, Users, Coins, BarChart3 } from "lucide-react";

export interface SmartAuthGateProps {
  /** Required authentication level to access the wrapped content */
  required: AuthType;
  /** Context explaining why this auth is needed */
  context: AuthContext;
  /** What to do when auth is not met */
  fallback?: "disable" | "prompt" | "redirect" | "hide";
  /** Explanation of why this auth is beneficial */
  benefits?: string[];
  /** Custom fallback component */
  fallbackComponent?: React.ComponentType<{ onAuth: () => void }>;
  /** Callback when auth is successful */
  onAuthSuccess?: (authType: AuthType) => void;
  /** Children to render when auth requirements are met */
  children: React.ReactNode;
}

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  authType: AuthType;
  context: AuthContext;
  onProceed: () => void;
  onSkip?: () => void;
}

const AuthPromptModal: React.FC<AuthPromptModalProps> = ({
  isOpen,
  onClose,
  authType,
  context,
  onProceed,
  onSkip,
}) => {
  const authMessage = getAuthMessage(authType, context);
  const contextPrompt = getPromptForContext(context);

  if (!authMessage || !contextPrompt) return null;

  const getIcon = () => {
    switch (authType) {
      case "supabase":
        return <BarChart3 className="h-8 w-8 text-blue-500" />;
      case "evm":
        return <Users className="h-8 w-8 text-green-500" />;
      case "flow":
        return <Coins className="h-8 w-8 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {getIcon()}
            <div>
              <DialogTitle>{contextPrompt.title}</DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                {contextPrompt.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">What you'll get:</h4>
            <ul className="space-y-2">
              {authMessage.benefits.map((benefit, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={onProceed} className="w-full">
              {authMessage.cta}
            </Button>
            {onSkip && (
              <Button
                variant="ghost"
                onClick={onSkip}
                className="w-full text-gray-600 hover:text-gray-900"
              >
                {authMessage.skip}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const SmartAuthGate: React.FC<SmartAuthGateProps> = ({
  required,
  context,
  fallback = "prompt",
  benefits,
  fallbackComponent: FallbackComponent,
  onAuthSuccess,
  children,
}) => {
  const { isAuthenticated, loginWithEmail, signUpWithEmail, connectWallet } =
    useAuth();
  const { isConnected: isWalletConnected } = useWallet();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authInProgress, setAuthInProgress] = useState(false);

  // Determine current auth level
  const getCurrentAuthLevel = (): AuthType => {
    if (isWalletConnected && isAuthenticated) {
      // Check if Flow wallet is also connected (would need Flow context)
      return "evm"; // Simplified - would need more sophisticated detection
    }
    if (isAuthenticated) return "supabase";
    return "none";
  };

  const currentAuthLevel = getCurrentAuthLevel();
  const hasRequiredAuth = currentAuthLevel === required || required === "none";

  const handleAuthPrompt = useCallback(() => {
    if (hasRequiredAuth) return;

    switch (fallback) {
      case "prompt":
        setShowAuthPrompt(true);
        break;
      case "redirect":
        // Could implement redirect logic here
        console.log(`Redirecting for ${required} auth`);
        break;
      case "disable":
      case "hide":
        // These are handled in render logic
        break;
    }
  }, [hasRequiredAuth, fallback, required]);

  const handleProceedWithAuth = useCallback(async () => {
    setAuthInProgress(true);
    try {
      switch (required) {
        case "supabase":
          // For now, just trigger the auth hook - would implement signup flow
          console.log("Triggering Supabase auth flow");
          break;
        case "evm":
          await connectWallet();
          break;
        case "flow":
          console.log("Triggering Flow wallet connection");
          break;
      }
      setShowAuthPrompt(false);
      onAuthSuccess?.(required);
    } catch (error) {
      console.error(`Auth failed for ${required}:`, error);
    } finally {
      setAuthInProgress(false);
    }
  }, [required, connectWallet, onAuthSuccess]);

  const handleSkipAuth = useCallback(() => {
    setShowAuthPrompt(false);
    // Could track skip analytics here
    console.log(`User skipped ${required} auth in ${context} context`);
  }, [required, context]);

  // Early return for no auth required
  if (required === "none" || hasRequiredAuth) {
    return <>{children}</>;
  }

  // Handle different fallback strategies
  switch (fallback) {
    case "hide":
      return null;

    case "disable":
      return (
        <div className="relative">
          <div className="opacity-50 pointer-events-none">{children}</div>
          <div className="mt-4 text-center">
            <Card className="max-w-sm mx-auto">
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-sm text-gray-600 mb-3">
                  {getAuthMessage(required, context)?.context ||
                    `${required} authentication required`}
                </p>
                <Button
                  size="sm"
                  onClick={handleAuthPrompt}
                  className="pointer-events-auto"
                >
                  Enable Feature
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );

    case "redirect":
      return (
        <div className="text-center py-8">
          <p>Redirecting for authentication...</p>
        </div>
      );

    case "prompt":
    default:
      if (FallbackComponent) {
        return <FallbackComponent onAuth={handleAuthPrompt} />;
      }

      return (
        <>
          <div onClick={handleAuthPrompt} className="cursor-pointer">
            {children}
          </div>

          <AuthPromptModal
            isOpen={showAuthPrompt}
            onClose={() => setShowAuthPrompt(false)}
            authType={required}
            context={context}
            onProceed={handleProceedWithAuth}
            onSkip={context !== "progress" ? handleSkipAuth : undefined} // Don't allow skip for critical features
          />
        </>
      );
  }
};
