/**
 * Story Protocol Hook
 * Provides a unified interface for Story Protocol operations in React components
 */

import { useState, useEffect, useCallback } from 'react';
import { getStoryClient } from './config';
import type {
  StoryConfig,
  StoryState,
  StoryActions,
  IPRegistrationResult,
  DerivativeRegistrationResult,
  LicenseRegistrationResult,
  LicenseType,
  CommercialTerms,
  BreathingPatternIP,
  IPAsset,
  IPMetadata
} from './types';

/**
 * Hook to interact with Story Protocol
 * @param isTestnet Whether to use testnet (default: true)
 * @returns StoryState and StoryActions
 */
export function useStoryProtocol(isTestnet: boolean = true) {
  // Initialize state
  const [state, setState] = useState<StoryState>({
    isInitialized: false,
    isConnected: false,
    isLoading: false,
    error: null,
    currentNetwork: isTestnet ? 'testnet' : 'mainnet',
    account: null
  });

  // Get client instance
  const client = getStoryClient(isTestnet);

  // Initialize client
  const initialize = useCallback(async (config: Partial<StoryConfig> = {}): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Initialize the client
      await client.initialize({
        isTestnet,
        ...config
      });
      
      setState(prev => ({
        ...prev,
        isInitialized: true,
        isConnected: client.isReady(),
        isLoading: false,
        error: null
      }));
      
      // Return void to match StoryActions interface
    } catch (error) {
      console.error('Failed to initialize Story Protocol:', error);
      setState(prev => ({
        ...prev,
        isInitialized: false,
        isConnected: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize Story Protocol'
      }));
      
      // Return void to match StoryActions interface
    }
  }, [client, isTestnet]);

  // Register breathing pattern
  const registerBreathingPatternIP = useCallback(async (
    pattern: BreathingPatternIP,
    licenseType: LicenseType = 'nonCommercial',
    commercialTerms?: CommercialTerms
  ): Promise<IPRegistrationResult> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      if (!client.isReady()) {
        throw new Error('Story Protocol client not initialized');
      }
      
      const result = await client.registerBreathingPatternIP(pattern, licenseType, commercialTerms);
      
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      console.error('Failed to register breathing pattern:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to register breathing pattern'
      }));
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to register breathing pattern'
      };
    }
  }, [client]);

  // Register derivative pattern
  const registerDerivativePattern = useCallback(async (
    originalIpId: string,
    licenseTermsId: string,
    derivativePattern: BreathingPatternIP
  ): Promise<DerivativeRegistrationResult> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      if (!client.isReady()) {
        throw new Error('Story Protocol client not initialized');
      }
      
      const result = await client.registerDerivativePattern(
        originalIpId,
        licenseTermsId,
        derivativePattern
      );
      
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      console.error('Failed to register derivative pattern:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to register derivative pattern'
      }));
      
      return {
        success: false,
        parentIpIds: [originalIpId],
        licenseTermsIds: [licenseTermsId],
        error: error instanceof Error ? error.message : 'Failed to register derivative pattern'
      };
    }
  }, [client]);

  // Create license terms
  const createLicenseTerms = useCallback(async (
    licenseType: LicenseType,
    commercialTerms?: CommercialTerms
  ): Promise<LicenseRegistrationResult> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      if (!client.isReady()) {
        throw new Error('Story Protocol client not initialized');
      }
      
      const result = await client.createLicenseTerms(licenseType, commercialTerms);
      
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      console.error('Failed to create license terms:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create license terms'
      }));
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create license terms'
      };
    }
  }, [client]);

  // Attach license terms to IP
  const attachLicenseTerms = useCallback(async (
    ipId: string,
    licenseTermsId: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      if (!client.isReady()) {
        throw new Error('Story Protocol client not initialized');
      }
      
      // For now, we'll use setIPLicenseTerms as a proxy for attaching
      // since the Story Protocol SDK doesn't have a direct method for this
      const result = await client.setIPLicenseTerms(ipId, {
        commercialUse: true,
        derivativeWorks: true,
        attributionRequired: true,
        royaltyPercent: 0
      });
      
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      console.error('Failed to attach license terms:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to attach license terms'
      }));
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to attach license terms'
      };
    }
  }, [client]);

  // Get IP asset
  const getIPAsset = useCallback(async (ipId: string): Promise<IPAsset | null> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      if (!client.isReady()) {
        throw new Error('Story Protocol client not initialized');
      }
      
      const result = await client.getIPAsset(ipId);
      
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      console.error('Failed to get IP asset:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get IP asset'
      }));
      
      return null;
    }
  }, [client]);

  // Get IP metadata (placeholder)
  const getIPMetadata = useCallback(async (ipId: string): Promise<IPMetadata | null> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      if (!client.isReady()) {
        throw new Error('Story Protocol client not initialized');
      }
      
      // Get the IP asset first to get the metadata URI
      const ipAsset = await client.getIPAsset(ipId);
      
      if (!ipAsset || !ipAsset.metadataURI) {
        throw new Error('IP asset metadata URI not found');
      }
      
      // In a real implementation, we would fetch the metadata from the URI
      // For now, we'll return a placeholder
      const metadata: IPMetadata = {
        title: ipAsset.name || 'Unknown IP Asset',
        description: 'Metadata for IP Asset',
        createdAt: new Date().toISOString(),
        creators: [
          {
            name: 'IP Creator',
            address: ipAsset.owner || '0x0',
            contributionPercent: 100
          }
        ]
      };
      
      setState(prev => ({ ...prev, isLoading: false }));
      return metadata;
    } catch (error) {
      console.error('Failed to get IP metadata:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get IP metadata'
      }));
      
      return null;
    }
  }, [client]);

  // Claim revenue
  const claimRevenue = useCallback(async (
    ipId: string,
    childIpIds: string[]
  ): Promise<{ success: boolean; claimedTokens?: string; error?: string }> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      if (!client.isReady()) {
        throw new Error('Story Protocol client not initialized');
      }
      
      const result = await client.claimRevenue(ipId, childIpIds);
      
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      console.error('Failed to claim revenue:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to claim revenue'
      }));
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to claim revenue'
      };
    }
  }, [client]);

  // Upload to Grove (placeholder)
  const uploadToGrove = useCallback(async (data: any): Promise<string> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // In a real implementation, we would upload to Grove
      // For now, we'll return a placeholder URL
      const uri = `ipfs://placeholder/${Date.now()}`;
      
      setState(prev => ({ ...prev, isLoading: false }));
      return uri;
    } catch (error) {
      console.error('Failed to upload to Grove:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to upload to Grove'
      }));
      
      throw error;
    }
  }, []);

  // Generate hash
  const generateHash = useCallback((content: string): string => {
    try {
      // Use the client's hash function if available
      if (client.generateHash) {
        return client.generateHash(content);
      }
      
      // Otherwise, use a browser-compatible method
      return btoa(content).slice(0, 32);
    } catch (error) {
      console.error('Failed to generate hash:', error);
      
      // Return a fallback hash
      return `hash-${Date.now()}`;
    }
  }, [client]);

  // Initialize on mount if auto-init is true
  useEffect(() => {
    const autoInit = import.meta.env.VITE_STORY_AUTO_INIT === 'true';
    if (autoInit) {
      initialize();
    }
  }, [initialize]);

  // Actions to return
  const actions: StoryActions = {
    initialize,
    registerBreathingPatternIP,
    registerDerivativePattern,
    createLicenseTerms,
    attachLicenseTerms,
    getIPAsset,
    getIPMetadata,
    claimRevenue,
    uploadToGrove,
    generateHash
  };

  return {
    state,
    actions
  };
}

export default useStoryProtocol;