import { useEffect, useState } from "react";
import { useFlow } from "../hooks/useFlow";
import { useLens } from "../hooks/useLens";
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
} from "lucide-react";
import { toast } from "sonner";

export const WalletManager = () => {
  const {
    user: flowUser,
    connect: flowLogIn,
    disconnect: flowLogOut,
    executeTransaction,
  } = useFlow();

  const {
    isAuthenticated,
    isLoading,
    error,
    authenticate,
    logout,
    currentAccount: session,
    // profile is unused and doesn't exist in the interface
  } = useLens();

  const [isFlowSetupLoading, setIsFlowSetupLoading] = useState(false);

  useEffect(() => {
    // If Flow user is logged in, ensure their account is set up for NFTs
    if (flowUser?.loggedIn && !isFlowSetupLoading) {
      const setupFlowAccount = async () => {
        try {
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
          toast.success("Flow account ready for breathing NFTs!");
        } catch (error) {
          console.error("Failed to set up Flow account:", error);
          // Don't show error toast as this is optional setup
        } finally {
          setIsFlowSetupLoading(false);
        }
      };
      setupFlowAccount();
    }
  }, [flowUser?.loggedIn, executeTransaction, isFlowSetupLoading]);

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
    if (!flowUser?.addr) return "";
    return `${flowUser.addr.slice(0, 6)}...${flowUser.addr.slice(-4)}`;
  };

  return (
    <div className="flex items-center space-x-2">
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
              Flow Blockchain (Wallet)
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
          <span>Flow (wallet)</span>
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
              disabled={isLoading}
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
            <DropdownMenuItem className="flex items-center space-x-2 text-blue-600">
              <Info className="w-4 h-4" />
              <span>Used for social features</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLensDisconnect}
              className="flex items-center space-x-2 text-red-600"
              disabled={isLoading}
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
          onClick={authenticate}
          disabled={isLoading}
          className="flex items-center space-x-2"
        >
          <Users className="w-4 h-4" />
          <span>Lens (social)</span>
          {isLoading && (
            <div className="w-3 h-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </Button>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center space-x-1 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-xs">Connection Error</span>
        </div>
      )}
    </div>
  );
};
