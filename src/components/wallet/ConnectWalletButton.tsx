import React from "react";
import { ConnectKitButton } from "connectkit";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/button";
import { Wallet, ChevronDown, ExternalLink, Copy, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { useToast } from "../ui/use-toast";
import {
  getChainInfo,
  getExplorerUrl,
  handleWalletError,
} from "../../lib/wagmi";

interface ConnectWalletButtonProps {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "sm" | "default" | "lg";
  className?: string;
  showBalance?: boolean;
  showChainInfo?: boolean;
}

export const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({
  variant = "default",
  size = "default",
  className = "",
  showBalance = false,
  showChainInfo = true,
}) => {
  const {
    hasWallet,
    wallet,
    disconnectWallet,
    currentChain,
    currentChainId,
    isWeb3User,
  } = useAuth();
  const { toast } = useToast();

  const handleCopyAddress = async () => {
    if (wallet?.address) {
      try {
        await navigator.clipboard.writeText(wallet.address);
        toast({
          title: "Address copied",
          description: "Wallet address copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Copy failed",
          description: "Could not copy address to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  const handleViewOnExplorer = () => {
    if (wallet?.address && currentChainId) {
      const chainInfo = getChainInfo(currentChainId);
      if (chainInfo?.blockExplorers?.default?.url) {
        const explorerUrl = `${chainInfo.blockExplorers.default.url}/address/${wallet.address}`;
        window.open(explorerUrl, "_blank");
      }
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      toast({
        title: "Wallet disconnected",
        description: "Your wallet has been disconnected successfully",
      });
    } catch (error) {
      toast({
        title: "Disconnect failed",
        description: handleWalletError(error as Error),
        variant: "destructive",
      });
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getChainBadgeColor = (chainName: string) => {
    switch (chainName?.toLowerCase()) {
      case "ethereum":
      case "mainnet":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "polygon":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "arbitrum":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200";
      case "base":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "lens":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "story":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <ConnectKitButton.Custom>
      {({ isConnected, isConnecting, show, hide, address, ensName, chain }) => {
        if (isConnecting) {
          return (
            <Button
              variant={variant}
              size={size}
              className={className}
              disabled
            >
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Connecting...
              </div>
            </Button>
          );
        }

        if (!isConnected || !hasWallet) {
          return (
            <Button
              onClick={show}
              variant={variant}
              size={size}
              className={className}
            >
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          );
        }

        // Connected state - show dropdown with wallet info
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={variant}
                size={size}
                className={`${className} min-w-[140px] justify-between`}
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-xs">
                      {(ensName || address)?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-mono text-sm">
                    {ensName || formatAddress(address || "")}
                  </span>
                  {showChainInfo && currentChain && (
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getChainBadgeColor(currentChain)}`}
                    >
                      {currentChain}
                    </Badge>
                  )}
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {(ensName || address)?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-mono text-sm">
                    {ensName || formatAddress(address || "")}
                  </span>
                  {currentChain && (
                    <Badge
                      variant="secondary"
                      className={`text-xs w-fit ${getChainBadgeColor(currentChain)}`}
                    >
                      {currentChain}
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleCopyAddress}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Address
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleViewOnExplorer}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View on Explorer
              </DropdownMenuItem>

              <DropdownMenuItem onClick={show}>
                <Wallet className="mr-2 h-4 w-4" />
                Change Wallet
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleDisconnect}
                className="text-red-600 dark:text-red-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }}
    </ConnectKitButton.Custom>
  );
};

// Export a simplified version for quick use
export const SimpleConnectButton: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, isConnecting, show, address, ensName }) => {
        if (isConnecting) {
          return (
            <Button className={className} disabled>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Connecting...
              </div>
            </Button>
          );
        }

        if (!isConnected) {
          return (
            <Button onClick={show} className={className}>
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          );
        }

        return (
          <Button onClick={show} variant="outline" className={className}>
            <Avatar className="mr-2 h-4 w-4">
              <AvatarFallback className="text-xs">
                {(ensName || address)?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {ensName || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
          </Button>
        );
      }}
    </ConnectKitButton.Custom>
  );
};

export default ConnectWalletButton;
