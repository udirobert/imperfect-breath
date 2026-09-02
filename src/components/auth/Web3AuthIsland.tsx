import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  Loader2,
  Users,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WalletConnection } from "@/components/wallet/WalletConnection";
import { useBlockchainAuth } from "@/hooks/useBlockchainAuth";
import { EagerWeb3Provider } from "@/providers/EagerWeb3Provider";

interface Web3AuthIslandProps {
  method: "wallet" | "lens";
  className?: string;
  error?: string | null;
  /** Wallet connectors only — no Lens/Flow as peer options. */
  quiet?: boolean;
  onBack: () => void;
  onSelectLens?: () => void;
  onSelectFlow?: () => void;
  onWalletContinue: () => void;
  onLensSuccess?: () => void;
  onLensError?: (error: string) => void;
}

/**
 * Wallet / Lens auth UI plus WagmiProvider. Lazy-loaded so email sign-in
 * never mounts wagmi.
 */
const Web3AuthIsland: React.FC<Web3AuthIslandProps> = (props) => {
  return (
    <EagerWeb3Provider>
      <WalletAuthSteps {...props} />
    </EagerWeb3Provider>
  );
};

const WalletAuthSteps: React.FC<Web3AuthIslandProps> = ({
  method,
  className,
  error,
  onBack,
  onSelectLens,
  onSelectFlow,
  onWalletContinue,
  onLensSuccess,
  onLensError,
  quiet = false,
}) => {
  const blockchainAuth = useBlockchainAuth();

  if (method === "wallet") {
    return (
      <Card className={cn("w-full max-w-md mx-auto", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-1 h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center flex-1">
              <CardTitle className="text-lg">Connect Wallet</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <WalletConnection
            showWeb3Options={!quiet}
            onLensConnect={onSelectLens}
            onFlowConnect={onSelectFlow}
          />
          <Button onClick={onWalletContinue} className="w-full">
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-1 h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center flex-1">
            <CardTitle className="text-lg">Connect to Lens</CardTitle>
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

        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
            <Users className="h-8 w-8 text-purple-600" />
          </div>

          <div>
            <h3 className="font-medium text-lg">Lens Protocol</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Connect your wallet to authenticate with Lens
            </p>
          </div>

          {!blockchainAuth.state.isAuthenticated.lens ? (
            <>
              <WalletConnection
                showWeb3Options={true}
                onLensConnect={() => {}}
                onFlowConnect={onSelectFlow}
              />
              {blockchainAuth.state.isAuthenticating && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating with Lens...
                </div>
              )}
              <Button
                onClick={async () => {
                  try {
                    const result = await blockchainAuth.authenticateLens();
                    if (result.success) {
                      onLensSuccess?.();
                    } else {
                      onLensError?.(result.error || "Lens authentication failed");
                    }
                  } catch (err) {
                    onLensError?.(
                      err instanceof Error ? err.message : "Authentication failed",
                    );
                  }
                }}
                disabled={blockchainAuth.state.isAuthenticating}
                className="w-full"
              >
                {blockchainAuth.state.isAuthenticating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Connect with Lens
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Connected to Lens!</span>
              </div>
            </div>
          )}
        </div>

        <Button onClick={() => onLensSuccess?.()} className="w-full">
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default Web3AuthIsland;
