import { useState } from 'react';
import { useLensAccount } from './useLensAccount';
import { LensClient } from '../lib/lens';
import { toast } from 'sonner';
import { useCallback } from 'react';

export const useFollow = () => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followError, setFollowError] = useState<Error | null>(null);
  const { lensAccount } = useLensAccount();
  
  // Get Lens client instance
  const lensClient = new LensClient(true); // Use testnet by default

  const follow = useCallback(async (address: string) => {
    if (!address) {
      toast.error("Invalid account address.");
      return;
    }
    
    if (!lensAccount) {
      toast.error("You must have a Lens account to follow.");
      return;
    }

    if (!lensClient.isAuthenticated) {
      toast.error("Please authenticate with Lens first.");
      return;
    }

    setIsFollowing(true);
    setFollowError(null);

    try {
      toast.info("Processing follow...");
      
      // Use the LensClient to follow the account
      const result = await lensClient.followAccount(address);
      
      toast.success("Follow transaction sent!", {
        description: `Transaction hash: ${result}`,
      });
      
      return result;
    } catch (err) {
      console.error("Follow transaction failed:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setFollowError(err instanceof Error ? err : new Error(errorMessage));
      toast.error("Follow failed", {
        description: errorMessage,
      });
    } finally {
      setIsFollowing(false);
    }
  }, [lensClient, lensAccount]);

  const unfollow = useCallback(async (address: string) => {
    if (!address) {
      toast.error("Invalid account address.");
      return;
    }

    if (!lensAccount) {
      toast.error("You must have a Lens account to unfollow.");
      return;
    }

    if (!lensClient.isAuthenticated) {
      toast.error("Please authenticate with Lens first.");
      return;
    }

    setIsFollowing(true);
    setFollowError(null);

    try {
      toast.info("Processing unfollow...");
      
      // Use the LensClient to unfollow the account
      const result = await lensClient.unfollowAccount(address);
      
      toast.success("Unfollow transaction sent!", {
        description: `Transaction hash: ${result}`,
      });
      
      return result;
    } catch (err) {
      console.error("Unfollow transaction failed:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setFollowError(err instanceof Error ? err : new Error(errorMessage));
      toast.error("Unfollow failed", {
        description: errorMessage,
      });
    } finally {
      setIsFollowing(false);
    }
  }, [lensClient, lensAccount]);

  return {
    follow,
    unfollow,
    isFollowing,
    followError,
  };
};