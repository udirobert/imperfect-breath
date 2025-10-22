/**
 * Lazy Wallet Auth Component - Performance Optimization
 * 
 * PERFORMANT: Lazy loads wallet connectors only when needed
 * CLEAN: Separates wallet auth concerns from main auth flow
 * MODULAR: Composable wallet authentication component
 * UX: Improved visual hierarchy and reduced clutter
 */

import React, { Suspense, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Wallet, ChevronLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccount } from 'wagmi';

// PERFORMANT: Lazy load wallet connection component
const WalletConnection = React.lazy(() => 
  import('@/components/wallet/WalletConnection').then(module => ({
    default: module.WalletConnection
  }))
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
  const { isConnected } = useAccount();

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
    if (!shouldLoad) {
      setShouldLoad(true);
    }
    setIsLoading(true);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setIsLoading(false);
    onError?.(errorMessage);
  };

  const handleSuccess = () => {
    setIsLoading(false);
    onSuccess?.();
  };

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
              <WalletConnection autoOpen />
              
              {/* Success indicator and continue button */}
              {isConnected && (
                <div className="flex items-center justify-center gap-2 py-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">Wallet connected successfully</span>
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Back
                </Button>
                {isConnected && (
                  <Button
                    onClick={handleSuccess}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Continue
                  </Button>
                )}
              </div>
            </div>
          </Suspense>
        )}
      </CardContent>
    </Card>
  );
};