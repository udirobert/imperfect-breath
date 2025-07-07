import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { LensClient } from "../lib/lens";

export interface LensV3Account {
  address: string;
  username?: string;
  name?: string;
  picture?: string;
  followersCount?: number;
  followingCount?: number;
  permissions?: {
    canExecuteTransactions: boolean;
    canTransferTokens: boolean;
    canTransferNative: boolean;
    canSetMetadataUri: boolean;
  };
}

export const useLensAccount = () => {
  const { profile } = useAuth();
  const [lensAccount, setLensAccount] = useState<LensV3Account | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize Lens client
  const lensClient = new LensClient(true); // Use testnet by default

  useEffect(() => {
    const fetchLensAccount = async () => {
      if (!profile?.wallet_address) {
        setLensAccount(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Get available accounts for the wallet address
        const accounts = await lensClient.getAvailableAccounts(profile.wallet_address);
        
        if (!accounts || accounts.length === 0) {
          setLensAccount(null);
          toast.info("No Lens accounts found", {
            description: "The connected wallet doesn't have any Lens accounts.",
          });
          return;
        }

        // Use the first account as the default
        const defaultAccount = accounts[0];
        
        // If we're authenticated, try to get more detailed information
        let followers = 0;
        let following = 0;
        
        if (lensClient.isAuthenticated) {
          try {
            // Get followers count
            const followersData = await lensClient.getFollowers(defaultAccount.address, { limit: 100 });
            followers = followersData?.items?.length || 0;
            
            // Get following count
            const followingData = await lensClient.getFollowing(defaultAccount.address, { limit: 100 });
            following = followingData?.items?.length || 0;
          } catch (e) {
            console.warn("Could not fetch followers/following counts:", e);
            // Continue anyway as this is supplementary information
          }
        }

        // Set the account with the fetched data
        setLensAccount({
          ...defaultAccount,
          followersCount: followers,
          followingCount: following
        });
      } catch (err) {
        console.error("Error fetching Lens account:", err);
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        setError(err instanceof Error ? err : new Error(errorMessage));
        toast.error("Could not fetch Lens account.", {
          description: "There was an error connecting to Lens. Please try again later."
        });
        setLensAccount(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLensAccount();
  }, [profile?.wallet_address, lensClient.isAuthenticated]);

  return { 
    lensAccount, 
    loading,
    error,
    isAuthenticated: lensClient.isAuthenticated
  };
};