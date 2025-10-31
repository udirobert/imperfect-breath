import { useEffect, useState } from "react";
import { useFlowAuth } from "../auth/composables/useFlowAuth";
import { useLens } from "../hooks/useLens";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Wallet,
  Users,
  LogOut,
  Info,
  CheckCircle,
  AlertCircle,
  Link2,
  ExternalLink,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { ConnectWalletButton } from "./wallet/ConnectWalletButton";

export const WalletManager = () => {
  const {
    flowUser,
    login: flowLogIn,
    logout: flowLogOut,
    isLoading: flowIsLoading,
  } = useFlowAuth();

  const {
    isAuthenticated,
    authenticate,
    logout,
    currentAccount: session,
    // profile is unused and doesn't exist in the interface
  } = useLens();

  const { hasWallet, wallet, isWeb3User, currentChain, blockchainEnabled } =
    useAuth();

  const [isFlowSetupLoading, setIsFlowSetupLoading] = useState(false);
  const [isLensAuthenticating, setIsLensAuthenticating] = useState(false);

  useEffect(() => {
    if (flowUser?.loggedIn && !isFlowSetupLoading) {
      // Flow account is ready for use with new Forte capabilities
      toast.success("Flow account connected and ready!");
      setIsFlowSetupLoading(false);
    }
  }, [flowUser?.loggedIn, isFlowSetupLoading]);

  const handleLensDisconnect = async () => {
    try {
      await logout();
      toast.success("Successfully disconnected from Lens");
    } catch (error) {
      toast.error("Failed to disconnect from Lens");
    }
  };

  const handleFlowDisconnect = async () => {
    try {
      await flowLogOut();
      toast.success("Successfully disconnected Flow wallet");
    } catch (error) {
      toast.error("Failed to disconnect Flow wallet");
    }
  };

  // Get display name for Lens profile
  const getLensDisplayName = () => {
    if (session?.address) return `${session.address.slice(0, 6)}...`;
    return "Lens Profile";
  };

  // Get shortened address for Flow
  const getFlowAddress = () => {
    if (!flowUser?.address) return "";
    return `${flowUser.address.slice(0, 6)}...${flowUser.address.slice(-4)}`;
  };

  // Handle wallet address copy
  const handleCopyAddress = async (address: string, label: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success(`${label} address copied to clipboard`);
    } catch (error) {
      toast.error("Failed to copy address");
    }
  };

  // Handle Lens login
  const handleLensLogin = async () => {
    try {
      setIsLensAuthenticating(true);
      await authenticate();
    } catch (error) {
      toast.error("Failed to connect to Lens");
    } finally {
      setIsLensAuthenticating(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {/* ConnectKit Wallet (EVM Chains) */}
      {blockchainEnabled && (
        <ConnectWalletButton variant="outline" size="sm" showChainInfo={true} />
      )}
      {/* Flow Wallet */}
      {flowUser?.loggedIn ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
              disabled={isFlowSetupLoading}
            >
              <Wallet className="w-4 h-4" />
              <span>Flow</span>
              {isFlowSetupLoading ? (
                <AlertCircle className="w-3 h-3 animate-pulse text-yellow-500" />
              ) : (
                <CheckCircle className="w-3 h-3 text-green-500" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Flow Blockchain (NFTs)
            </DropdownMenuLabel>
            <DropdownMenuItem
              disabled
              className="flex flex-col items-start space-y-1"
            >
              <span className="font-medium">Connected</span>
              <span className="text-xs text-muted-foreground font-mono">
                {getFlowAddress()}
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleCopyAddress(flowUser.address || "", "Flow")}
              className="flex items-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Address</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center space-x-2 text-blue-600">
              <Info className="w-4 h-4" />
              <span>Used for breathing NFTs</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleFlowDisconnect}
              className="flex items-center space-x-2 text-red-600"
            >
              <LogOut className="w-4 h-4" />
              <span>Disconnect</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={flowLogIn}
          className="flex items-center space-x-2"
        >
          <Wallet className="w-4 h-4" />
          <span>Flow (NFTs)</span>
        </Button>
      )}

      {/* Lens Social */}
      {isAuthenticated ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
              disabled={isFlowSetupLoading}
            >
              <div className="flex items-center space-x-2">
                <Avatar className="w-4 h-4">
                  <AvatarImage src="" alt={getLensDisplayName()} />
                  <AvatarFallback className="text-xs">
                    {getLensDisplayName().slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-24 truncate">
                  {getLensDisplayName()}
                </span>
                <CheckCircle className="w-3 h-3 text-green-500" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Lens Protocol (Social)
            </DropdownMenuLabel>
            <DropdownMenuItem
              disabled
              className="flex flex-col items-start space-y-1"
            >
              <span className="font-medium">{getLensDisplayName()}</span>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  Authenticated
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {session?.address
                    ? session.address.slice(0, 10) + "..."
                    : "No Address"}
                </Badge>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {session?.address && (
              <DropdownMenuItem
                onClick={() => handleCopyAddress(session.address, "Lens")}
                className="flex items-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Address</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="flex items-center space-x-2 text-blue-600">
              <Info className="w-4 h-4" />
              <span>Used for social features</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLensDisconnect}
              className="flex items-center space-x-2 text-red-600"
              disabled={isFlowSetupLoading}
            >
              <LogOut className="w-4 h-4" />
              <span>Disconnect</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          onClick={handleLensLogin}
          variant="outline"
          size="sm"
          disabled={isLensAuthenticating}
          className="flex items-center space-x-2"
        >
          <Users className="w-4 h-4" />
          <span>Lens (social)</span>
          {isLensAuthenticating && (
            <div className="w-3 h-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </Button>
      )}

      {/* Connection Status Indicator */}
      {(hasWallet || flowUser?.loggedIn || isAuthenticated) && (
        <div className="flex items-center space-x-1">
          <Badge variant="outline" className="text-xs">
            {[
              hasWallet && currentChain,
              flowUser?.loggedIn && "Flow",
              isAuthenticated && "Lens",
            ]
              .filter(Boolean)
              .join(" + ") || "Connected"}
          </Badge>
        </div>
      )}
    </div>
  );
};
