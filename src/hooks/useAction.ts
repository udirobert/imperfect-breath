import { useState } from 'react';
import { toast } from 'sonner';
import { useCallback } from 'react';
import { LensClient } from '../lib/lens';
import { useLensAccount } from './useLensAccount';

export const useAction = () => {
  const [isActing, setIsActing] = useState(false);
  const [actionError, setActionError] = useState<Error | null>(null);
  const { lensAccount } = useLensAccount();
  
  // Get Lens client instance
  const lensClient = new LensClient(true); // Use testnet by default

  const executeAction = useCallback(async (postId: string, actionType: 'collect' | 'like' | 'react', actionParams: any = {}) => {
    if (!lensAccount) {
      toast.error("You must have a Lens account to perform this action.");
      return;
    }
    
    if (!lensClient.isAuthenticated) {
      toast.error("Please authenticate with Lens first.");
      return;
    }

    setIsActing(true);
    setActionError(null);

    try {
      toast.info(`Processing ${actionType} action...`);
      
      // In Lens V3, we use the executeAction method to perform various actions on posts
      const result = await lensClient.executeAction(postId, actionType, actionParams);
      
      toast.success(`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} transaction sent!`, {
        description: `Transaction hash: ${result.hash}`,
      });
      
      return result.hash;
    } catch (err) {
      console.error(`${actionType} transaction failed:`, err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setActionError(err instanceof Error ? err : new Error(errorMessage));
      toast.error(`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} failed`, {
        description: errorMessage,
      });
    } finally {
      setIsActing(false);
    }
  }, [lensClient, lensAccount]);

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