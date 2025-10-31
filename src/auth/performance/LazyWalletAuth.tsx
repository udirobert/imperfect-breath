/**
 * Lazy Wallet Auth Component - Performance Optimization
 *
 * PERFORMANT: Lazy loads wallet connectors only when needed
 * CLEAN: Separates wallet auth concerns from main auth flow
 * MODULAR: Composable wallet authentication component
 * UX: Improved visual hierarchy and reduced clutter
 */

import React, { Suspense, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Wallet,
  ChevronLeft,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccount } from "wagmi";

// PERFORMANT: Lazy load wallet connection component
const WalletConnection = React.lazy(() =>
  import("@/components/wallet/WalletConnection").then((module) => ({
    default: module.WalletConnection,
  })),
);

interface LazyWalletAuthProps {
  onSuccess?: () => void;
  onBack?: () => void;
  onError?: (error: string) => void;
  className?: string;
  preload?: boolean;
}

/**
 * PERFORMANT: Wallet auth with lazy loading and preloading
 */
export const LazyWalletAuth: React.FC<LazyWalletAuthProps> = ({
  onSuccess,
  onBack,
  onError,
  className,
  preload = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldLoad, setShouldLoad] = useState(preload);
  const [providerConflictDetected, setProviderConflictDetected] =
    useState(false);
  const { isConnected } = useAccount();

  // Check for wallet provider conflicts on mount
  useEffect(() => {
    const checkProviderConflict = () => {
      try {
        // Check if ethereum property is non-configurable (indicates conflict)
        const descriptor = Object.getOwnPropertyDescriptor(window, "ethereum");
        if (descriptor && !descriptor.configurable) {
          console.warn("LazyWalletAuth: Ethereum provider conflict detected");
          setProviderConflictDetected(true);
        }
      } catch (error) {
        console.warn("LazyWalletAuth: Provider conflict check failed:", error);
        setProviderConflictDetected(true);
      }
    };

    checkProviderConflict();
  }, []);

  // Reset loading state when wallet connects
  useEffect(() => {
    if (isConnected && isLoading) {
      console.log("LazyWalletAuth: Wallet connected, clearing loading state");
      setIsLoading(false);
      setError(null);
    }
  }, [isConnected, isLoading]);

  // PERFORMANT: Preload wallet components when requested
  useEffect(() => {
    if (preload && !shouldLoad) {
      // Preload components in the background
      const preloadTimer = setTimeout(() => {
        setShouldLoad(true);
      }, 100);

      return () => clearTimeout(preloadTimer);
    }
  }, [preload, shouldLoad]);

  const handleWalletConnect = () => {
    console.log("LazyWalletAuth: Wallet connect initiated");

    if (providerConflictDetected) {
      setError(
        "Multiple wallet extensions detected. Please disable conflicting wallet extensions and refresh the page.",
      );
      return;
    }

    if (!shouldLoad) {
      setShouldLoad(true);
    }
    setIsLoading(true);
    setError(null);

    // Set a timeout to prevent infinite loading
    setTimeout(() => {
      if (isLoading && !isConnected) {
        console.warn(
          "LazyWalletAuth: Connection timeout, resetting loading state",
        );
        setIsLoading(false);
        setError(
          "Connection timeout. Please try again or check your wallet extension.",
        );
      }
    }, 30000); // 30 second timeout
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setIsLoading(false);
    onError?.(errorMessage);
  };

  const handleSuccess = useCallback(() => {
    console.log("LazyWalletAuth: handleSuccess called", {
      isConnected,
      isLoading,
      error,
    });
    setIsLoading(false);
    setError(null);
    onSuccess?.();
  }, [isConnected, isLoading, error, onSuccess]);

  // Auto-trigger success when wallet connects and component is ready
  useEffect(() => {
    console.log("LazyWalletAuth: useEffect triggered", {
      isConnected,
      shouldLoad,
      isLoading,
      error,
    });
    if (isConnected && shouldLoad && !isLoading && !error) {
      // Small delay to ensure UI is stable
      const timer = setTimeout(() => {
        console.log("LazyWalletAuth: Auto-triggering success");
        handleSuccess();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isConnected, shouldLoad, isLoading, error, handleSuccess]);

  // PERFORMANT: Loading state while wallet components load
  const WalletLoadingFallback = () => (
    <div className="flex items-center justify-center p-8">
      <div className="flex items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-muted-foreground">Loading wallet options...</span>
      </div>
    </div>
  );

  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-1 h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="text-center flex-1">
            <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Connect Wallet</CardTitle>
            <p className="text-sm text-muted-foreground">
              Connect your wallet to access Web3 features
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

        {!shouldLoad ? (
          // PERFORMANT: Show connect button before loading wallet components
          <div className="space-y-4">
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Ready to connect your wallet and unlock Web3 features?
              </p>
              <Button
                onClick={handleWalletConnect}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </>
                )}
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Supports MetaMask, WalletConnect, Coinbase Wallet, and more
              </p>
            </div>
          </div>
        ) : (
          // Connected state - only show wallet connection details
          <Suspense fallback={<WalletLoadingFallback />}>
            <div className="space-y-4">
              {providerConflictDetected ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Multiple wallet extensions detected. Please disable
                    conflicting extensions and refresh the page.
                    <br />
                    <button
                      onClick={() => window.location.reload()}
                      className="underline mt-1 hover:no-underline"
                    >
                      Refresh Page
                    </button>
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <WalletConnection autoOpen />

                  {/* Success indicator and continue button */}
                  {isConnected && (
                    <div className="flex items-center justify-center gap-2 py-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm text-muted-foreground">
                        Wallet connected successfully
                      </span>
                    </div>
                  )}

                  {/* Connection status and network info */}
                  {isConnected && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <h4 className="font-medium text-green-800 mb-2">
                        Ready for Web3
                      </h4>
                      <p className="text-sm text-green-700 mb-2">
                        Your wallet is connected to Lens Testnet and ready to
                        use social features
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Debug info - remove in production */}
              {process.env.NODE_ENV === "development" && (
                <div className="text-xs bg-gray-100 p-2 rounded">
                  <div>Connected: {isConnected ? "Yes" : "No"}</div>
                  <div>Loading: {isLoading ? "Yes" : "No"}</div>
                  <div>Should Load: {shouldLoad ? "Yes" : "No"}</div>
                  <div>
                    Provider Conflict: {providerConflictDetected ? "Yes" : "No"}
                  </div>
                  <div>Error: {error || "None"}</div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("LazyWalletAuth: Back button clicked");
                    onBack?.();
                  }}
                  className="flex-1"
                  disabled={false}
                >
                  Back
                </Button>
                <Button
                  onClick={() => {
                    console.log("LazyWalletAuth: Continue button clicked");
                    handleSuccess();
                  }}
                  className="flex-1"
                  disabled={!isConnected || providerConflictDetected}
                >
                  Continue
                </Button>
              </div>
            </div>
          </Suspense>
        )}
      </CardContent>
    </Card>
  );
};
