import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useLens } from './useLens';

export const useRepost = () => {
  const [isReposting, setIsReposting] = useState(false);
  const [repostError, setRepostError] = useState<Error | null>(null);
  const { currentAccount, isAuthenticated, createComment } = useLens();

  const repost = useCallback(async (postId: string) => {
    if (!postId) {
      toast.error("Invalid post ID.");
      return;
    }
    
    if (!currentAccount) {
      toast.error("You must have a Lens account to repost.");
      return;
    }

    if (!isAuthenticated) {
      toast.error("Please authenticate with Lens first.");
      return;
    }

    setIsReposting(true);
    setRepostError(null);

    try {
      toast.info("Processing repost...");
      
      // In Lens V3, we use quote/comment functionality for reposts
      // Create an empty comment which acts as a repost/quote
      const result = await createComment(postId, "");
      
      if (result.success) {
        toast.success("Repost transaction sent!", {
          description: `Transaction hash: ${result.hash || "Success"}`,
        });
        return result;
      } else {
        throw new Error(result.error || "Repost failed");
      }
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
  }, [currentAccount, isAuthenticated, createComment]);

  return {
    repost,
    isReposting,
    repostError,
  };
};