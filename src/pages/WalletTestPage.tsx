import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { useEnhancedWeb3 } from "../providers/EnhancedWeb3Provider";
import {
  ConnectWalletButton,
  SimpleConnectButton,
} from "../components/wallet/ConnectWalletButton";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import {
  CheckCircle,
  XCircle,
  Wallet,
  Link,
  User,
  Database,
  AlertTriangle,
  Info,
  RefreshCw,
  Copy,
  ExternalLink,
  Link2,
} from "lucide-react";
import { toast } from "sonner";

const WalletTestPage: React.FC = () => {
  const {
    hasWallet,
    wallet,
    user,
    isAuthenticated,
    isWeb3User,
    blockchainEnabled,
    currentChain,
    currentChainId,
    connectWallet,
    loginWithWallet,
    disconnectWallet,
    loading,
  } = useAuth();

  const { isConnectKitReady, supportedChainIds, isTestnetMode } =
    useEnhancedWeb3();

  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Run basic connectivity tests
  const runConnectivityTests = useCallback(async () => {
    setIsRunningTests(true);
    const results: Record<string, boolean> = {};

    try {
      // Test 1: ConnectKit Provider
      results.connectKitProvider = isConnectKitReady;

      // Test 2: Blockchain Features Enabled
      results.blockchainEnabled = blockchainEnabled;

      // Test 3: Supported Chains
      results.supportedChains = supportedChainIds.length > 0;

      // Test 4: Environment Variables
      results.envVars = !!(
        import.meta.env.VITE_WALLETCONNECT_PROJECT_ID &&
        import.meta.env.VITE_SUPABASE_URL
      );

      // Test 5: Wallet Detection
      results.walletDetection =
        typeof window !== "undefined" &&
        (!!window.ethereum || !!window.coinbaseWalletExtension);

      setTestResults(results);

      const passed = Object.values(results).filter(Boolean).length;
      const total = Object.keys(results).length;

      if (passed === total) {
        toast.success(`All ${total} tests passed! 🎉`);
      } else {
        toast.warning(`${passed}/${total} tests passed`);
      }
    } catch (error) {
      toast.error("Test execution failed");
      console.error("Test error:", error);
    } finally {
      setIsRunningTests(false);
    }
  }, [isConnectKitReady, blockchainEnabled, supportedChainIds]);

  const handleCopyAddress = async () => {
    if (wallet?.address) {
      try {
        await navigator.clipboard.writeText(wallet.address);
        toast.success("Address copied to clipboard");
      } catch (error) {
        toast.error("Failed to copy address");
      }
    }
  };

  const handleViewOnExplorer = () => {
    if (wallet?.address && currentChainId) {
      const chainExplorers: Record<number, string> = {
        1: "https://etherscan.io",
        11155111: "https://sepolia.etherscan.io",
        137: "https://polygonscan.com",
        42161: "https://arbiscan.io",
        8453: "https://basescan.org",
        37111: "https://explorer.testnet.lens.xyz",
      };

      const explorerUrl = chainExplorers[currentChainId];
      if (explorerUrl) {
        window.open(`${explorerUrl}/address/${wallet.address}`, "_blank");
      }
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getChainBadgeColor = (chainName: string) => {
    const colors: Record<string, string> = {
      ethereum: "bg-blue-100 text-blue-800",
      polygon: "bg-purple-100 text-purple-800",
      arbitrum: "bg-cyan-100 text-cyan-800",
      base: "bg-blue-100 text-blue-800",
      lens: "bg-green-100 text-green-800",
      sepolia: "bg-yellow-100 text-yellow-800",
    };
    return colors[chainName?.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  // Run tests on component mount
  useEffect(() => {
    runConnectivityTests();
  }, [runConnectivityTests]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Wallet Integration Test</h1>
        <p className="text-muted-foreground">
          Test ConnectKit integration and wallet functionality
        </p>
        {isTestnetMode && (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
            Testnet Mode
          </Badge>
        )}
      </div>

      {/* Test Results */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              System Tests
            </CardTitle>
            <CardDescription>
              Basic connectivity and configuration tests
            </CardDescription>
          </div>
          <Button
            onClick={runConnectivityTests}
            disabled={isRunningTests}
            variant="outline"
            size="sm"
          >
            {isRunningTests ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Re-run Tests
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded">
              <span>ConnectKit Provider</span>
              {getStatusIcon(testResults.connectKitProvider)}
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <span>Blockchain Features</span>
              {getStatusIcon(testResults.blockchainEnabled)}
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <span>Supported Chains</span>
              {getStatusIcon(testResults.supportedChains)}
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <span>Environment Config</span>
              {getStatusIcon(testResults.envVars)}
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <span>Wallet Detection</span>
              {getStatusIcon(testResults.walletDetection)}
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <span>Supabase Auth</span>
              {getStatusIcon(!!user)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Connection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasWallet ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Wallet Connected</AlertTitle>
                <AlertDescription>
                  Your wallet is successfully connected and ready to use.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <Link className="h-4 w-4" />
                <AlertTitle>No Wallet Connected</AlertTitle>
                <AlertDescription>
                  Connect your wallet to test blockchain functionality.
                </AlertDescription>
              </Alert>
            )}

            {/* Wallet Details */}
            {wallet && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <span className="text-sm font-medium">Address:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-sm">
                      {formatAddress(wallet.address || "")}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyAddress}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleViewOnExplorer}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {currentChain && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded">
                    <span className="text-sm font-medium">Chain:</span>
                    <Badge className={getChainBadgeColor(currentChain)}>
                      {currentChain} ({currentChainId})
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* Connection Buttons */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <ConnectWalletButton
                  variant="default"
                  size="sm"
                  className="w-full"
                />
                <SimpleConnectButton className="w-full" />
              </div>

              {!hasWallet && (
                <Button
                  onClick={connectWallet}
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={loading}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Manual Connect
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 border rounded">
                <span className="text-sm">Authenticated</span>
                {getStatusIcon(isAuthenticated)}
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <span className="text-sm">Web3 User</span>
                {getStatusIcon(isWeb3User)}
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <span className="text-sm">Has Wallet</span>
                {getStatusIcon(hasWallet)}
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <span className="text-sm">Loading</span>
                {getStatusIcon(!loading)}
              </div>
            </div>

            {user && (
              <div className="space-y-2">
                <div className="p-3 bg-muted rounded">
                  <div className="text-sm font-medium">User ID:</div>
                  <code className="text-xs">{user.id}</code>
                </div>
                {user.email && (
                  <div className="p-3 bg-muted rounded">
                    <div className="text-sm font-medium">Email:</div>
                    <div className="text-sm">{user.email}</div>
                  </div>
                )}
              </div>
            )}

            {/* Web3 Actions */}
            {isAuthenticated && (
              <div className="space-y-2">
                {!hasWallet && (
                  <Button
                    onClick={loginWithWallet}
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={loading}
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Link Wallet to Account
                  </Button>
                )}

                {hasWallet && (
                  <Button
                    onClick={() => disconnectWallet()}
                    variant="destructive"
                    size="sm"
                    className="w-full"
                  >
                    Disconnect Wallet
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Supported Chains */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Supported Chains
          </CardTitle>
          <CardDescription>
            Available blockchain networks for this application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {supportedChainIds.map((chainId) => {
              const chainNames: Record<number, string> = {
                1: "Ethereum",
                11155111: "Sepolia",
                137: "Polygon",
                42161: "Arbitrum",
                8453: "Base",
                37111: "Lens Testnet",
              };

              const chainName = chainNames[chainId] || `Chain ${chainId}`;
              const isCurrentChain = currentChainId === chainId;

              return (
                <div
                  key={chainId}
                  className={`p-3 border rounded text-center ${
                    isCurrentChain ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="font-medium text-sm">{chainName}</div>
                  <div className="text-xs text-muted-foreground">
                    ID: {chainId}
                  </div>
                  {isCurrentChain && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      Current
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Debug Information */}
      {isTestnetMode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Debug Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded overflow-auto">
              {JSON.stringify(
                {
                  hasWallet,
                  isAuthenticated,
                  isWeb3User,
                  currentChain,
                  currentChainId,
                  blockchainEnabled,
                  supportedChainIds,
                  isTestnetMode,
                  wallet: wallet
                    ? {
                        address: wallet.address,
                        chainId: wallet.chainId,
                        chain: wallet.chain,
                      }
                    : null,
                  user: user
                    ? {
                        id: user.id,
                        email: user.email,
                        hasWallet: user.wallet ? true : false,
                      }
                    : null,
                },
                null,
                2,
              )}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WalletTestPage;
