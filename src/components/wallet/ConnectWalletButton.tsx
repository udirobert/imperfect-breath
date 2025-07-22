import React from "react";
import { Button } from "../ui/button";
import { Wallet, ChevronDown, ExternalLink, Copy, LogOut, Users, Coins, BarChart3 } from "lucide-react";
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
import { useWallet, useWalletStatus, useWalletActions } from "../../hooks/useWallet";
import { WalletErrorBoundary } from "../../lib/errors/error-boundary";
import { AuthContext, AuthType, getAuthMessage } from "../../config/messaging";

interface ConnectWalletButtonProps {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "sm" | "default" | "lg";
  className?: string;
  showBalance?: boolean;
  showChainInfo?: boolean;
  // Context-aware props
  context?: AuthContext;
  requiredFor?: string; // "share this session" | "mint NFT" | "create course"
  hideUntilNeeded?: boolean;
  showBenefits?: boolean;
  authRequired?: AuthType;
}

const ConnectWalletButtonInner: React.FC<ConnectWalletButtonProps> = ({
  variant = "default",
  size = "default",
  className = "",
  showBalance = false,
  showChainInfo = true,
  context,
  requiredFor,
  hideUntilNeeded = false,
  showBenefits = false,
  authRequired = 'evm',
}) => {
  const { isAvailable, isConnected, isConnecting, shortAddress, chainId, error } = useWalletStatus();
  const { connect, disconnect, clearError } = useWalletActions();
  const { toast } = useToast();

  const authMessage = context ? getAuthMessage(authRequired, context) : null;

  const handleConnect = async () => {
    try {
      clearError();
      await connect();
      
      // Context-aware success messaging
      const successMessage = requiredFor 
        ? `Wallet connected! You can now ${requiredFor.toLowerCase()}`
        : "Your wallet has been connected successfully";
        
      toast({
        title: "Wallet connected",
        description: successMessage,
      });
    } catch (error) {
      toast({
        title: "Connection failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  // Get contextual icon based on use case
  const getContextIcon = () => {
    switch (context) {
      case 'social': return <Users className="mr-2 h-4 w-4" />;
      case 'nft': return <Coins className="mr-2 h-4 w-4" />;
      case 'progress': return <BarChart3 className="mr-2 h-4 w-4" />;
      default: return <Wallet className="mr-2 h-4 w-4" />;
    }
  };

  // Get contextual button text
  const getButtonText = () => {
    if (requiredFor) {
      return `Connect to ${requiredFor}`;
    }
    
    if (authMessage?.cta) {
      return authMessage.cta;
    }
    
    return "Connect Wallet";
  };

  const handleCopyAddress = async () => {
    const { address } = useWalletStatus();
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
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
    const { address } = useWalletStatus();
    if (address && chainId) {
      const explorerUrls: Record<string, string> = {
        '0x1': 'https://etherscan.io',
        '0x89': 'https://polygonscan.com',
        '0xa4b1': 'https://arbiscan.io',
      };
      
      const explorerUrl = explorerUrls[chainId];
      if (explorerUrl) {
        window.open(`${explorerUrl}/address/${address}`, "_blank");
      }
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast({
        title: "Wallet disconnected",
        description: "Your wallet has been disconnected successfully",
      });
    } catch (error) {
      toast({
        title: "Disconnect failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const getChainName = (chainId: string) => {
    const chainNames: Record<string, string> = {
      '0x1': 'Ethereum',
      '0x89': 'Polygon',
      '0xa4b1': 'Arbitrum',
    };
    return chainNames[chainId] || 'Unknown';
  };

  const getChainBadgeColor = (chainName: string) => {
    switch (chainName?.toLowerCase()) {
      case "ethereum":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "polygon":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "arbitrum":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  // Show error state
  if (error) {
    return (
      <Button
        variant="outline"
        size={size}
        className={`${className} border-red-200 text-red-700`}
        onClick={clearError}
      >
        <Wallet className="mr-2 h-4 w-4" />
        Wallet Error - Retry
      </Button>
    );
  }

  // Show connecting state
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

  // Show not available state
  if (!isAvailable) {
    return (
      <Button
        variant="outline"
        size={size}
        className={className}
        disabled
      >
        <Wallet className="mr-2 h-4 w-4" />
        No Wallet Found
      </Button>
    );
  }

  // Hide button if hideUntilNeeded is true and we're not connected
  if (hideUntilNeeded && !isConnected) {
    return null;
  }

  // Show connect button
  if (!isConnected) {
    return (
      <div className="space-y-2">
        <Button
          onClick={handleConnect}
          variant={variant}
          size={size}
          className={className}
        >
          {getContextIcon()}
          {getButtonText()}
        </Button>
        {showBenefits && authMessage && (
          <div className="text-xs text-muted-foreground max-w-xs">
            {authMessage.context}
          </div>
        )}
      </div>
    );
  }

  // Connected state - show dropdown with wallet info
  const chainName = chainId ? getChainName(chainId) : 'Unknown';

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
                {shortAddress?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-mono text-sm">
              {shortAddress}
            </span>
            {showChainInfo && chainId && (
              <Badge
                variant="secondary"
                className={`text-xs ${getChainBadgeColor(chainName)}`}
              >
                {chainName}
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
              {shortAddress?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-mono text-sm">
              {shortAddress}
            </span>
            {chainId && (
              <Badge
                variant="secondary"
                className={`text-xs w-fit ${getChainBadgeColor(chainName)}`}
              >
                {chainName}
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

        <DropdownMenuItem onClick={handleConnect}>
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
};

export const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = (props) => {
  return (
    <WalletErrorBoundary>
      <ConnectWalletButtonInner {...props} />
    </WalletErrorBoundary>
  );
};

// Export a simplified version for quick use
export const SimpleConnectButton: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const { isConnected, isConnecting, shortAddress } = useWalletStatus();
  const { connect } = useWalletActions();

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
      <Button onClick={() => connect()} className={className}>
        <Wallet className="mr-2 h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <Button onClick={() => connect()} variant="outline" className={className}>
      <Avatar className="mr-2 h-4 w-4">
        <AvatarFallback className="text-xs">
          {shortAddress?.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      {shortAddress}
    </Button>
  );
};

export default ConnectWalletButton;