import { useCallback } from 'react';
import type { BlockchainType } from '../components/blockchain/BlockchainSelector';

export interface PatternCreationHook {
  getAvailableBlockchains: () => BlockchainType[];
  getRecommendedBlockchain: () => BlockchainType;
}

export const usePatternCreation = (): PatternCreationHook => {
  const getAvailableBlockchains = useCallback((): BlockchainType[] => {
    return ['ethereum', 'arbitrum', 'base', 'flow', 'lens'];
  }, []);

  const getRecommendedBlockchain = useCallback((): BlockchainType => {
    return 'ethereum';
  }, []);

  return {
    getAvailableBlockchains,
    getRecommendedBlockchain,
  };
};