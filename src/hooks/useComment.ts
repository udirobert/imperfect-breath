import { useState } from 'react';
import { LensClient } from '../lib/lens';
import { toast } from 'sonner';
import { useCallback } from 'react';
import { useLensAccount } from './useLensAccount';

export const useComment = () => {
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentError, setCommentError] = useState<Error | null>(null);
  const { lensAccount } = useLensAccount();
  
  // Get Lens client instance
  const lensClient = new LensClient(true); // Use testnet by default

  const comment = useCallback(async (postId: string, commentText: string) => {
    if (!postId) {
      toast.error("Invalid post ID.");
      return;
    }
    
    if (!commentText || commentText.trim() === '') {
      toast.error("Comment text cannot be empty.");
      return;
    }
    
    if (!lensAccount) {
      toast.error("You must have a Lens account to comment.");
      return;
    }

    if (!lensClient.isAuthenticated) {
      toast.error("Please authenticate with Lens first.");
      return;
    }

    setIsCommenting(true);
    setCommentError(null);

    try {
      toast.info("Processing comment...");
      
      // In Lens V3, we directly use the commentOnPost method from the LensClient
      // The client handles metadata creation, storage, and posting
      const result = await lensClient.commentOnPost(postId, commentText);
      
      toast.success("Comment transaction sent!", {
        description: `Transaction hash: ${result}`,
      });
      
      return result;
    } catch (err) {
      console.error("Comment transaction failed:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setCommentError(err instanceof Error ? err : new Error(errorMessage));
      toast.error("Comment failed", {
        description: errorMessage,
      });
    } finally {
      setIsCommenting(false);
    }
  }, [lensClient, lensAccount]);

  return {
    comment,
    isCommenting,
    commentError,
  };
};