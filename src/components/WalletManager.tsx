import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useAuth } from "@/hooks/useAuth";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { Button } from "./ui/button";
import { toast } from "sonner";

export const WalletManager = () => {
  const { isConnected, isConnecting } = useAccount();
  const { isAuthenticated } = useAuth();
  const { linkWallet, unlinkWallet, isLinked, loading } = useWalletAuth();

  useEffect(() => {
    // Automatically prompt to link wallet upon connection if user is logged in
    if (
      isConnected &&
      isAuthenticated &&
      !isLinked &&
      !isConnecting &&
      !loading
    ) {
      toast("Wallet connected.", {
        description: "Would you like to link this wallet to your account?",
        action: {
          label: "Link Wallet",
          onClick: () => linkWallet(),
        },
      });
    }
  }, [
    isConnected,
    isAuthenticated,
    isLinked,
    isConnecting,
    loading,
    linkWallet,
  ]);

  if (!isAuthenticated || !isConnected) {
    return null; // Don't show anything if user is not logged in or wallet is not connected
  }

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        Processing...
      </Button>
    );
  }

  if (isLinked) {
    return (
      <Button variant="destructive" size="sm" onClick={unlinkWallet}>
        Unlink Wallet
      </Button>
    );
  }

  return (
    <Button variant="secondary" size="sm" onClick={linkWallet}>
      Link Wallet to Account
    </Button>
  );
};
