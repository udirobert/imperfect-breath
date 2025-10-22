/**\n * Cross-Network Integration Hook\n * Enables components to use Forte Actions + Lens integration seamlessly\n */

import { useState, useEffect, useCallback } from 'react';
import CrossNetworkIntegration from '../lib/cross-network/cross-network-integration';
import { useFlow } from './useFlow';
import { useLens } from './useLens';

interface CrossNetworkState {
  isLoading: boolean;
  error: string | null;
  lastForteResult: unknown;
  lastLensPost: unknown | null;
  crossNetworkId: string | null;
}

interface UseCrossNetworkReturn {
  state: CrossNetworkState;
  executeForteWithLens: (
    actions: Array<{
      type: 'source' | 'sink' | 'swap' | 'nft_transfer';
      params: Record<string, unknown>;
    }>,
    lensAction: 'purchase' | 'mint' | 'sale',
    nft: unknown
  ) => Promise<unknown>;
  createSocialChallenge: (payload: {
    challengeName: string;
    patternId: string;
    participants: string[];
    duration: number;
    rewards: {
      nftId?: string;
      tokenAmount?: number;
      uniqueId: string;
    };
  }) => Promise<unknown>;
}

export const useCrossNetwork = (): UseCrossNetworkReturn => {
  const [state, setState] = useState<CrossNetworkState>({
    isLoading: false,
    error: null,
    lastForteResult: null,
    lastLensPost: null,
    crossNetworkId: null,
  });

  const flow = useFlow();
  const lens = useLens();

  const executeForteWithLens = useCallback(async (
    actions: Array<{
      type: 'source' | 'sink' | 'swap' | 'nft_transfer';
      params: Record<string, any>;
    }>,
    lensAction: 'purchase' | 'mint' | 'sale',
    nft: any
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const crossNetwork = new CrossNetworkIntegration();
      const result = await crossNetwork.executeForteWithLensIntegration(
        actions,
        lensAction,
        nft
      );
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastForteResult: result.forteResult,
        lastLensPost: result.lensPost,
        crossNetworkId: result.forteResult.txId
      }));
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Cross-network transaction failed';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const createSocialChallenge = useCallback(async (payload: {
    challengeName: string;
    patternId: string;
    participants: string[];
    duration: number;
    rewards: {
      nftId?: string;
      tokenAmount?: number;
      uniqueId: string;
    };
  }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const crossNetwork = new CrossNetworkIntegration();
      const result = await crossNetwork.createSocialBreathingChallenge(payload);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastForteResult: result.forteResult,
        lastLensPost: result.lensAnnouncement,
        crossNetworkId: result.challengeId
      }));
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Social challenge creation failed';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  return {
    state,
    executeForteWithLens,
    createSocialChallenge,
  };
};