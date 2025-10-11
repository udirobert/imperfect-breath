/**
 * Improved Wallet Manager - Clean, Responsive, Mobile-Optimized
 * 
 * CLEAN: Better visual hierarchy and spacing
 * RESPONSIVE: Mobile-first design with proper text handling
 * UX: Clear status indicators and improved interactions
 * PERFORMANT: Efficient state management and loading states
 */

import { useEffect, useState } from "react";
import { useFlow } from "../../hooks/useFlow";
import { useLens } from "../../hooks/useLens";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card, CardContent } from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Wallet,
  Users,
  LogOut,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Loader2,
  ChevronDown,
  Coins,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { ImprovedWalletConnection } from "./ImprovedWalletConnection";
import { cn } from "@/lib/utils";

interface WalletStatusProps {
  isConnected: boolean;
  isLoading?: boolean;
  address?: string;
  displayName?: string;
  icon: React.ReactNode;
  color: string;
  onConnect: () => void;
  onDisconnect: () => void;
  children?: React.ReactNode;
}

const WalletStatusCard: React.FC<WalletStatusProps> = ({
  isConnected,
  isLoading,
  address,
  displayName,
  icon,
  color,
  onConnect,
  onDisconnect,
  children
}) => {
  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  
  if (!isConnected) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onConnect}
        disabled={isLoading}
        className="flex items-center gap-2 min-w-[120px]"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          icon
        )}
        <span className="truncate">{displayName}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 min-w-[120px] max-w-[160px]"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-white text-xs",
              color
            )}>
              {icon}
            </div>
            <span className="truncate text-sm">
              {address ? formatAddress(address) : displayName}
            </span>
            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
          </div>
          <ChevronDown className="h-3 w-3 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const ImprovedWalletManager = () => {
  const {
    user: flowUser,
    connect: flowLogIn,
    disconnect: flowLogOut,
    executeTransaction,
  } = useFlow();

  const {
    isAuthenticated,
    authenticate,
    logout,
    currentAccount: session,
  } = useLens();

  const { hasWallet, wallet, isWeb3User, currentChain, blockchainEnabled } = useAuth();

  const [isFlowSetupLoading, setIsFlowSetupLoading] = useState(false);
  const [isLensAuthenticating, setIsLensAuthenticating] = useState(false);
  const [showWalletDialog, setShowWalletDialog] = useState(false);

  // FIXED: Flow account setup effect with proper cleanup to prevent React Error #310
  useEffect(() => {
    let isMounted = true;
    
    if (flowUser?.loggedIn && !isFlowSetupLoading) {
      const setupFlowAccount = async () => {
        try {
          if (!isMounted) return; // Early exit if unmounted
          
          setIsFlowSetupLoading(true);
          const txCode = `
            import ImperfectBreath from 0xImperfectBreath
            transaction {
                prepare(signer: AuthAccount) {
                    if signer.borrow<&BreathFlowVision.Collection>(from: BreathFlowVision.CollectionStoragePath) == nil {
                        signer.save(<-BreathFlowVision.createEmptyCollection(), to: BreathFlowVision.CollectionStoragePath)
                        signer.link<&BreathFlowVision.Collection{BreathFlowVision.CollectionPublic}>(
                            BreathFlowVision.CollectionPublicPath,
                            target: BreathFlowVision.CollectionStoragePath
                        )
                    }
                }
            }
          `;
          
          await executeTransaction(txCode);
          
          if (isMounted) {
            toast.success("Flow account ready for breathing NFTs!");
          }
        } catch (error) {
          console.error("Failed to set up Flow account:", error);
          if (isMounted) {
            toast.error("Failed to set up Flow account");
          }
        } finally {
          if (isMounted) {
            setIsFlowSetupLoading(false);
          }
        }
      };
      
      setupFlowAccount();
    }
    
    // Cleanup function to prevent React Error #310
    return () => {
      isMounted = false;
    };
  }, [flowUser?.loggedIn, executeTransaction, isFlowSetupLoading]);

  // Handlers
  const handleLensDisconnect = async () => {
    try {
      await logout();
      toast.success("Disconnected from Lens Protocol");
    } catch (error) {
      toast.error("Failed to disconnect from Lens");
    }
  };

  const handleFlowDisconnect = async () => {
    try {
      await flowLogOut();
      toast.success("Disconnected Flow wallet");
    } catch (error) {
      toast.error("Failed to disconnect Flow wallet");
    }
  };

  const handleLensLogin = async () => {
    try {
      setIsLensAuthenticating(true);
      await authenticate();
      toast.success("Connected to Lens Protocol");
    } catch (error) {
      toast.error("Failed to connect to Lens");
    } finally {
      setIsLensAuthenticating(false);
    }
  };

  const handleCopyAddress = async (address: string, label: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success(`${label} address copied`);
    } catch (error) {
      toast.error("Failed to copy address");
    }
  };

  const getLensDisplayName = () => {
    if (session?.address) return `${session.address.slice(0, 6)}...`;
    return "Lens Profile";
  };

  const getFlowAddress = () => {
    if (!flowUser?.addr) return "";
    return `${flowUser.addr.slice(0, 6)}...${flowUser.addr.slice(-4)}`;
  };

  // Connection status summary
  const getConnectionSummary = () => {
    const connections = [];
    if (hasWallet && currentChain) connections.push(currentChain);
    if (flowUser?.loggedIn) connections.push("Flow");
    if (isAuthenticated) connections.push("Lens");
    return connections.join(" + ") || "Not Connected";
  };

  return (
    <div className="space-y-4">
      {/* Main Wallet Connection */}
      {blockchainEnabled && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Primary Wallet</div>
          {showWalletDialog ? (
            <Card className="p-4">
              <ImprovedWalletConnection />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowWalletDialog(false)}
                className="mt-2 w-full"
              >
                Close
              </Button>
            </Card>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowWalletDialog(true)}
              className="w-full justify-start"
            >
              <Wallet className="h-4 w-4 mr-2" />
              {hasWallet ? "Manage Wallet" : "Connect Wallet"}
            </Button>
          )}
        </div>
      )}

      {/* Protocol Connections */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground">Protocol Connections</div>
        <div className="flex flex-col gap-2">
          {/* Flow Wallet */}
          <WalletStatusCard
            isConnected={flowUser?.loggedIn || false}
            isLoading={isFlowSetupLoading}
            address={flowUser?.addr || undefined}
            displayName="Flow (NFTs)"
            icon={<Coins className="h-3 w-3" />}
            color="bg-green-500"
            onConnect={flowLogIn}
            onDisconnect={handleFlowDisconnect}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Flow Blockchain • NFT Features
            </DropdownMenuLabel>
            <DropdownMenuItem disabled className="flex flex-col items-start space-y-1">
              <span className="font-medium">Connected</span>
              <code className="text-xs text-muted-foreground font-mono">
                {getFlowAddress()}
              </code>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleCopyAddress(flowUser?.addr || "", "Flow")}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Address
            </DropdownMenuItem>
            <DropdownMenuItem className="text-blue-600">
              <Zap className="w-4 h-4 mr-2" />
              Mint Breathing NFTs
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleFlowDisconnect}
              className="text-red-600"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect
            </DropdownMenuItem>
          </WalletStatusCard>

          {/* Lens Protocol */}
          <WalletStatusCard
            isConnected={isAuthenticated}
            isLoading={isLensAuthenticating}
            address={session?.address}
            displayName="Lens (Social)"
            icon={<Users className="h-3 w-3" />}
            color="bg-purple-500"
            onConnect={handleLensLogin}
            onDisconnect={handleLensDisconnect}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Lens Protocol • Social Features
            </DropdownMenuLabel>
            <DropdownMenuItem disabled className="flex flex-col items-start space-y-1">
              <span className="font-medium">{getLensDisplayName()}</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Authenticated
                </Badge>
                {session?.address && (
                  <code className="text-xs text-muted-foreground font-mono">
                    {session.address.slice(0, 10)}...
                  </code>
                )}
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {session?.address && (
              <DropdownMenuItem
                onClick={() => handleCopyAddress(session.address, "Lens")}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Address
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="text-blue-600">
              <Users className="w-4 h-4 mr-2" />
              Social Sharing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLensDisconnect}
              className="text-red-600"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect
            </DropdownMenuItem>
          </WalletStatusCard>
        </div>
      </div>

      {/* Connection Status Summary */}
      {(hasWallet || flowUser?.loggedIn || isAuthenticated) && (
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Status:</span>
            <Badge variant="outline" className="text-xs">
              {getConnectionSummary()}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
};