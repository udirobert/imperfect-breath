import { useState, useEffect, useCallback } from 'react';
import { StoryClient, StoryConfig } from '@story-protocol/core-sdk';
import { config, debugLog } from '@/config/environment';

export interface IPAsset {
  id: string;
  name: string;
  description: string;
  creator: string;
  ipHash: string;
  registrationDate: string;
  licenseTerms?: LicenseTerms;
}

export interface LicenseTerms {
  commercial: boolean;
  derivatives: boolean;
  attribution: boolean;
  royaltyPercentage?: number;
}

export interface DerivativeWork {
  originalId: string;
  derivativeId: string;
  creator: string;
  createdAt: string;
}

export function useStory() {
  const [client, setClient] = useState<StoryClient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userIPAssets, setUserIPAssets] = useState<IPAsset[]>([]);

  // Initialize Story Protocol client
  useEffect(() => {
    const initializeStoryClient = async () => {
      try {
        const storyConfig: StoryConfig = {
          chainId: parseInt(config.story.chainId),
          rpcUrl: config.story.rpcUrl,
        };
        
        const storyClient = StoryClient.newClient(storyConfig);
        setClient(storyClient);
        debugLog('Story Protocol client initialized');
      } catch (err) {
        console.error('Failed to initialize Story Protocol client:', err);
        setError('Failed to initialize Story Protocol client');
      }
    };

    initializeStoryClient();
  }, []);

  const registerBreathingPatternIP = useCallback(async (patternData: {
    name: string;
    description: string;
    creator: string;
    patternPhases: Record<string, number>;
    audioUrl?: string;
  }): Promise<IPAsset | null> => {
    if (!client) {
      throw new Error('Story Protocol client not initialized');
    }

    try {
      setIsLoading(true);
      setError(null);

      debugLog('Registering breathing pattern IP:', patternData);

      // Create IP metadata
      const ipMetadata = {
        name: patternData.name,
        description: patternData.description,
        creator: patternData.creator,
        type: 'breathing_pattern',
        attributes: {
          phases: patternData.patternPhases,
          audioUrl: patternData.audioUrl,
          category: 'wellness',
          subcategory: 'breathing_exercise'
        }
      };

      // TODO: Implement actual IP registration with Story Protocol
      // This is a placeholder implementation
      const mockIPAsset: IPAsset = {
        id: `ip_${Date.now()}`,
        name: patternData.name,
        description: patternData.description,
        creator: patternData.creator,
        ipHash: `hash_${Math.random().toString(36).substr(2, 9)}`,
        registrationDate: new Date().toISOString(),
      };

      // Update user's IP assets
      setUserIPAssets(prev => [...prev, mockIPAsset]);

      debugLog('IP asset registered:', mockIPAsset);
      return mockIPAsset;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register IP';
      setError(errorMessage);
      console.error('Story Protocol registration error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const setLicensingTerms = useCallback(async (
    ipId: string, 
    terms: LicenseTerms
  ): Promise<void> => {
    if (!client) {
      throw new Error('Story Protocol client not initialized');
    }

    try {
      setIsLoading(true);
      setError(null);

      debugLog('Setting licensing terms:', { ipId, terms });

      // TODO: Implement actual licensing terms setting
      // This is a placeholder implementation
      
      // Update local IP asset with license terms
      setUserIPAssets(prev => 
        prev.map(asset => 
          asset.id === ipId 
            ? { ...asset, licenseTerms: terms }
            : asset
        )
      );

      debugLog('Licensing terms set successfully');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set licensing terms';
      setError(errorMessage);
      console.error('Story Protocol licensing error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const trackDerivativeWork = useCallback(async (
    originalId: string,
    derivativeData: {
      name: string;
      description: string;
      creator: string;
    }
  ): Promise<DerivativeWork | null> => {
    if (!client) {
      throw new Error('Story Protocol client not initialized');
    }

    try {
      setIsLoading(true);
      setError(null);

      debugLog('Tracking derivative work:', { originalId, derivativeData });

      // TODO: Implement actual derivative work tracking
      // This is a placeholder implementation
      const derivativeWork: DerivativeWork = {
        originalId,
        derivativeId: `derivative_${Date.now()}`,
        creator: derivativeData.creator,
        createdAt: new Date().toISOString(),
      };

      debugLog('Derivative work tracked:', derivativeWork);
      return derivativeWork;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to track derivative work';
      setError(errorMessage);
      console.error('Story Protocol derivative tracking error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const getIPAsset = useCallback(async (ipId: string): Promise<IPAsset | null> => {
    if (!client) {
      throw new Error('Story Protocol client not initialized');
    }

    try {
      setError(null);

      debugLog('Fetching IP asset:', ipId);

      // TODO: Implement actual IP asset fetching
      // For now, return from local state
      const asset = userIPAssets.find(asset => asset.id === ipId);
      return asset || null;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch IP asset';
      setError(errorMessage);
      console.error('Story Protocol fetch error:', err);
      throw err;
    }
  }, [client, userIPAssets]);

  const getUserIPAssets = useCallback(async (userAddress: string): Promise<IPAsset[]> => {
    if (!client) {
      throw new Error('Story Protocol client not initialized');
    }

    try {
      setError(null);

      debugLog('Fetching user IP assets:', userAddress);

      // TODO: Implement actual user IP assets fetching
      // For now, return local state filtered by creator
      return userIPAssets.filter(asset => asset.creator === userAddress);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user IP assets';
      setError(errorMessage);
      console.error('Story Protocol user assets error:', err);
      throw err;
    }
  }, [client, userIPAssets]);

  const calculateRoyalties = useCallback(async (
    ipId: string,
    revenue: number
  ): Promise<{ creator: number; platform: number }> => {
    try {
      setError(null);

      const asset = await getIPAsset(ipId);
      if (!asset || !asset.licenseTerms) {
        throw new Error('IP asset or license terms not found');
      }

      const royaltyPercentage = asset.licenseTerms.royaltyPercentage || 10;
      const creatorRoyalty = (revenue * royaltyPercentage) / 100;
      const platformFee = revenue - creatorRoyalty;

      debugLog('Royalties calculated:', { 
        ipId, 
        revenue, 
        creatorRoyalty, 
        platformFee 
      });

      return {
        creator: creatorRoyalty,
        platform: platformFee
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate royalties';
      setError(errorMessage);
      console.error('Story Protocol royalty calculation error:', err);
      throw err;
    }
  }, [getIPAsset]);

  return {
    client,
    isLoading,
    error,
    userIPAssets,
    registerBreathingPatternIP,
    setLicensingTerms,
    trackDerivativeWork,
    getIPAsset,
    getUserIPAssets,
    calculateRoyalties,
  };
}
