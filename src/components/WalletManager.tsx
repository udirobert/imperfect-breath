import { useEffect } from "react";
import { useFlow } from "@/hooks/useFlow";
import { useLensService } from "@/hooks/useLensService";
import { Button } from "./ui/button";
import { toast } from "sonner";

export const WalletManager = () => {
  const {
    user: flowUser,
    logIn: flowLogIn,
    logOut: flowLogOut,
    executeTransaction,
  } = useFlow();
  const { isAuthenticated, isLoading, error, authenticate, logout } =
    useLensService();

  useEffect(() => {
    // If Flow user is logged in, ensure their account is set up for NFTs
    if (flowUser.loggedIn) {
      const setupFlowAccount = async () => {
        try {
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
          toast.success("Flow account set up successfully!");
        } catch (error) {
          console.error("Failed to set up Flow account:", error);
          toast.error("Failed to set up Flow account.");
        }
      };
      setupFlowAccount();
    }
  }, [flowUser.loggedIn, executeTransaction]);

  return (
    <div className="flex space-x-2">
      {/* Flow Wallet Management */}
      {flowUser.loggedIn ? (
        <Button variant="destructive" size="sm" onClick={flowLogOut}>
          Disconnect Flow Wallet
        </Button>
      ) : (
        <Button variant="secondary" size="sm" onClick={flowLogIn}>
          Connect Flow Wallet
        </Button>
      )}

      {/* Lens Profile Management */}
      {isAuthenticated ? (
        <Button
          variant="destructive"
          size="sm"
          onClick={logout}
          disabled={isLoading}
        >
          Disconnect Lens Profile
        </Button>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          onClick={authenticate}
          disabled={isLoading}
        >
          Connect Lens Profile
        </Button>
      )}

      {error && (
        <div className="text-sm text-red-600 mt-2">Lens Error: {error}</div>
      )}
    </div>
  );
};
