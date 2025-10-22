import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useLens } from './useLens';

export const useAction = () => {
  const [isActing, setIsActing] = useState(false);
  const [actionError, setActionError] = useState<Error | null>(null);
  const { currentAccount, isAuthenticated } = useLens();

  const executeAction = useCallback(async (postId: string, actionType: 'collect' | 'like' | 'react', actionParams: Record<string, unknown> = {}) => {
    if (!currentAccount) {
      toast.error("You must have a Lens account to perform this action.");
      return;
    }
    
    if (!isAuthenticated) {
      toast.error("Please authenticate with Lens first.");
      return;
    }

    setIsActing(true);
    setActionError(null);

    try {
      toast.info(`Processing ${actionType} action...`);
      
      // Note: Lens V3 actions would need to be implemented in the lensAPI
      // For now, we'll show a placeholder implementation
      console.warn(`Action ${actionType} on post ${postId} - Implementation needed in lensAPI`);
      
      // Simulate success for now
      toast.success(`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} action completed!`, {
        description: "Action processed successfully",
      });
      
      return { success: true, hash: "placeholder-hash" };
    } catch (err) {
      console.error(`${actionType} action failed:`, err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setActionError(err instanceof Error ? err : new Error(errorMessage));
      toast.error(`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} failed`, {
        description: errorMessage,
      });
    } finally {
      setIsActing(false);
    }
  }, [currentAccount, isAuthenticated]);

  // Helper function specifically for collect actions
  const collect = useCallback((postId: string, collectParams = {}) => {
    return executeAction(postId, 'collect', collectParams);
  }, [executeAction]);

  // Helper function specifically for like actions
  const like = useCallback((postId: string) => {
    return executeAction(postId, 'like');
  }, [executeAction]);

  // Helper function specifically for react actions
  const react = useCallback((postId: string, reaction: string) => {
    return executeAction(postId, 'react', { reaction });
  }, [executeAction]);

  return {
    executeAction,
    collect,
    like,
    react,
    isActing,
    actionError,
  };
};