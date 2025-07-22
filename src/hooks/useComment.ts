import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useLens } from './useLens';

export const useComment = () => {
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentError, setCommentError] = useState<Error | null>(null);
  const { currentAccount, isAuthenticated, createComment } = useLens();

  const comment = useCallback(async (postId: string, commentText: string) => {
    if (!postId) {
      toast.error("Invalid post ID.");
      return;
    }
    
    if (!commentText || commentText.trim() === '') {
      toast.error("Comment text cannot be empty.");
      return;
    }
    
    if (!currentAccount) {
      toast.error("You must have a Lens account to comment.");
      return;
    }

    if (!isAuthenticated) {
      toast.error("Please authenticate with Lens first.");
      return;
    }

    setIsCommenting(true);
    setCommentError(null);

    try {
      toast.info("Processing comment...");
      
      // Use the modern useLens hook's createComment method
      const result = await createComment(postId, commentText);
      
      if (result.success) {
        toast.success("Comment transaction sent!", {
          description: `Transaction hash: ${result.hash || "Success"}`,
        });
        return result;
      } else {
        throw new Error(result.error || "Comment failed");
      }
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
  }, [currentAccount, isAuthenticated, createComment]);

  return {
    comment,
    isCommenting,
    commentError,
  };
};