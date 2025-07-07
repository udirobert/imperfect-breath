import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { useAuth } from "./useAuth";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";
import { lensChain } from "../lib/publicClient";

export const useWalletAuth = () => {
  const { address, isConnected, chain } = useAccount();
  const { user, profile, refreshProfile } = useAuth();
  const { signMessageAsync } = useSignMessage();
  const [loading, setLoading] = useState(false);

  const linkWallet = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first.");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to link a wallet.");
      return;
    }

    if (profile?.wallet_address) {
      toast.info("A wallet is already linked to your account.");
      return;
    }

    // Check if connected to the right network (Lens Chain)
    if (chain && chain.id !== lensChain.id) {
      toast.error(`Please switch to ${lensChain.name} network to continue.`);
      return;
    }

    setLoading(true);
    try {
      const message = `Sign this message to link your wallet to your Imperfect Breath account. Address: ${address}`;
      const signature = await signMessageAsync({ account: address, message });

      const { error } = await supabase
        .from("users")
        .update({ 
          wallet_address: address, 
          wallet_signature: signature,
          wallet_chain_id: lensChain.id,
          wallet_chain_name: lensChain.name
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      await refreshProfile();
      toast.success("Wallet linked successfully!");
    } catch (error: any) {
      console.error("Error linking wallet:", error);
      toast.error("Failed to link wallet.", {
        description: error.message || "An unknown error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  const unlinkWallet = async () => {
    if (!user || !profile?.wallet_address) {
      toast.error("No wallet is linked to this account.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ 
          wallet_address: null, 
          wallet_signature: null,
          wallet_chain_id: null,
          wallet_chain_name: null
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      await refreshProfile();
      toast.success("Wallet unlinked successfully!");
    } catch (error: any) {
      console.error("Error unlinking wallet:", error);
      toast.error("Failed to unlink wallet.", {
        description: error.message || "An unknown error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper to check if wallet is on the correct network (Lens Chain)
  const isOnCorrectNetwork = () => {
    return chain && chain.id === lensChain.id;
  };

  return { 
    linkWallet, 
    unlinkWallet, 
    loading, 
    isLinked: !!profile?.wallet_address,
    isOnCorrectNetwork 
  };
};