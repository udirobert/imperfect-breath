import { useState } from 'react';
import { LensClient } from '../lib/lens';
import { toast } from 'sonner';
import { useCallback } from 'react';
import { useLensAccount } from './useLensAccount';

export const useRepost = () => {
  const [isReposting, setIsReposting] = useState(false);
  const [repostError, setRepostError] = useState<Error | null>(null);
  const { lensAccount } = useLensAccount();
  
  // Get Lens client instance
  const lensClient = new LensClient(true); // Use testnet by default

  const repost = useCallback(async (postId: string) => {
    if (!postId) {
      toast.error("Invalid post ID.");
      return;
    }
    
    if (!lensAccount) {
      toast.error("You must have a Lens account to repost.");
      return;
    }

    if (!lensClient.isAuthenticated) {
      toast.error("Please authenticate with Lens first.");
      return;
    }

    setIsReposting(true);
    setRepostError(null);

    try {
      toast.info("Processing repost...");
      
      // In Lens V3, we use the repost method which replaces the mirror functionality
      const result = await lensClient.quotePost(postId, "");
      
      toast.success("Repost transaction sent!", {
        description: `Transaction hash: ${result}`,
      });
      
      return result;
    } catch (err) {
      console.error("Repost transaction failed:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setRepostError(err instanceof Error ? err : new Error(errorMessage));
      toast.error("Repost failed", {
        description: errorMessage,
      });
    } finally {
      setIsReposting(false);
    }
  }, [lensClient, lensAccount]);

  return {
    repost,
    isReposting,
    repostError,
  };
};