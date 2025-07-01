import { useEffect } from "react";
import { useFlow } from "@/hooks/useFlow";
import { useLens } from "@/hooks/useLens";
import { Button } from "./ui/button";
import { toast } from "sonner";

export const WalletManager = () => {
  const { user: flowUser, logIn: flowLogIn, logOut: flowLogOut, executeTransaction } = useFlow();
  const { lensUser, lensLoggedIn, authenticatingLens, unauthenticatingLens, lensReady, loginLens, logoutLens } = useLens();

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
      {lensReady && (
        lensLoggedIn ? (
          <Button variant="destructive" size="sm" onClick={logoutLens} disabled={unauthenticatingLens}>
            Disconnect Lens Profile
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={loginLens} disabled={authenticatingLens}>
            Connect Lens Profile
          </Button>
        )
      )}
    </div>
  );
};
