/**
 * Consolidated Story Protocol Hook
 * Single source of truth for all Story Protocol functionality
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { ConsolidatedStoryClient } from '../lib/story';
import type {
  StoryConfig,
  StoryState,
  BreathingPatternIP,
  IPRegistrationResult,
  LicenseRegistrationResult,
  DerivativeRegistrationResult,
  LicenseType,
  CommercialTerms,
  IPAsset,
  IPMetadata,
  StoryError
} from '../lib/story/types';

interface UseStoryConfig {
  isTestnet?: boolean;
  privateKey?: string;
  autoInitialize?: boolean;
}

interface UseStoryReturn {
  // State
  state: StoryState;
  
  // Loading states
  isLoading: boolean;
  isRegistering: boolean;
  isUploading: boolean;
  
  // Error handling
  error: string | null;
  
  // Core actions
  initialize: (config?: Partial<StoryConfig>) => Promise<void>;
  
  // IP Registration
  registerBreathingPatternIP: (
    pattern: BreathingPatternIP,
    licenseType?: LicenseType,
    commercialTerms?: CommercialTerms
  ) => Promise<IPRegistrationResult>;
  
  registerDerivativePattern: (
    originalIpId: string,
    licenseTermsId: string,
    derivativePattern: BreathingPatternIP
  ) => Promise<DerivativeRegistrationResult>;
  
  // License Management
  createLicenseTerms: (
    licenseType: LicenseType,
    commercialTerms?: CommercialTerms
  ) => Promise<LicenseRegistrationResult>;
  
  setLicensingTerms: (
    ipId: string,
    terms: {
      commercial: boolean;
      derivatives: boolean;
      attribution: boolean;
      royaltyPercentage: number;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  
  // IP Management
  getIPAsset: (ipId: string) => Promise<IPAsset | null>;
  getIPMetadata: (ipId: string) => Promise<IPMetadata | null>;
  
  // Revenue
  claimRevenue: (
    ipId: string,
    childIpIds: string[]
  ) => Promise<{ success: boolean; claimedTokens?: string; error?: string }>;
  
  // Utilities
  uploadToGrove: (data: any) => Promise<string>;
  generateHash: (content: string) => string;
  clearError: () => void;
  dispose: () => void;
  
  // Helper functions
  createCommercialRemixTerms: (options: { revShare: number; mintingFee: number }) => CommercialTerms;
  generatePatternImage: (pattern: BreathingPatternIP) => string;
  validatePattern: (pattern: BreathingPatternIP) => { isValid: boolean; errors: string[] };
}

export const useStory = (config: UseStoryConfig = {}): UseStoryReturn => {
  const {
    isTestnet = true,
    privateKey,
    autoInitialize = false
  } = config;
  
  // Client instance
  const storyClient = useRef<ConsolidatedStoryClient>(
    ConsolidatedStoryClient.getInstance(isTestnet, privateKey)
  );
  
  // State
  const [state, setState] = useState<StoryState>({
    isInitialized: false,
    isConnected: false,
    isLoading: false,
    error: null,
    currentNetwork: isTestnet ? 'testnet' : 'mainnet',
    account: null,
  });
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Error handling
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Initialize Story Protocol client
   */
  const initialize = useCallback(async (initConfig: Partial<StoryConfig> = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await storyClient.current.initialize({
        isTestnet,
        privateKey,
        ...initConfig
      });
      
      setState((prev: StoryState) => ({
        ...prev,
        isInitialized: true,
        isConnected: storyClient.current.isReady(),
        account: privateKey ? 'connected' : null,
      }));
      
      console.log('Story Protocol client initialized');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Story Protocol initialization failed';
      setError(errorMessage);
      setState((prev: StoryState) => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isTestnet, privateKey]);
  
  /**
   * Register breathing pattern as IP
   */
  const registerBreathingPatternIP = useCallback(async (
    pattern: BreathingPatternIP,
    licenseType: LicenseType = 'nonCommercial',
    commercialTerms?: CommercialTerms
  ): Promise<IPRegistrationResult> => {
    if (!state.isInitialized) {
      throw new Error('Story Protocol client not initialized');
    }
    
    setIsRegistering(true);
    setError(null);
    
    try {
      // Validate pattern
      const validation = validatePattern(pattern);
      if (!validation.isValid) {
        throw new Error(`Invalid pattern: ${validation.errors.join(', ')}`);
      }
      
      const result = await storyClient.current.registerBreathingPatternIP(
        pattern,
        licenseType,
        commercialTerms
      );
      
      if (!result.success) {
        throw new Error(result.error || 'IP registration failed');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'IP registration failed';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsRegistering(false);
    }
  }, [state.isInitialized]);
  
  /**
   * Register derivative pattern
   */
  const registerDerivativePattern = useCallback(async (
    originalIpId: string,
    licenseTermsId: string,
    derivativePattern: BreathingPatternIP
  ): Promise<DerivativeRegistrationResult> => {
    if (!state.isInitialized) {
      throw new Error('Story Protocol client not initialized');
    }
    
    setIsRegistering(true);
    setError(null);
    
    try {
      const result = await storyClient.current.registerDerivativePattern(
        originalIpId,
        licenseTermsId,
        derivativePattern
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Derivative registration failed');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Derivative registration failed';
      setError(errorMessage);
      return {
        success: false,
        parentIpIds: [originalIpId],
        licenseTermsIds: [licenseTermsId],
        error: errorMessage
      };
    } finally {
      setIsRegistering(false);
    }
  }, [state.isInitialized]);
  
  /**
   * Create license terms
   */
  const createLicenseTerms = useCallback(async (
    licenseType: LicenseType,
    commercialTerms?: CommercialTerms
  ): Promise<LicenseRegistrationResult> => {
    if (!state.isInitialized) {
      throw new Error('Story Protocol client not initialized');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await storyClient.current.createLicenseTerms(licenseType, commercialTerms);
      
      if (!result.success) {
        throw new Error(result.error || 'License terms creation failed');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'License terms creation failed';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [state.isInitialized]);
  
  /**
   * Set licensing terms on an existing IP asset
   */
  const setLicensingTerms = useCallback(async (
    ipId: string,
    terms: {
      commercial: boolean;
      derivatives: boolean;
      attribution: boolean;
      royaltyPercentage: number;
    }
  ): Promise<{ success: boolean; error?: string }> => {
    if (!state.isInitialized) {
      throw new Error('Story Protocol client not initialized');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the client method to set license terms
      const result = await storyClient.current.setIPLicenseTerms(ipId, {
        commercialUse: terms.commercial,
        derivativeWorks: terms.derivatives,
        attributionRequired: terms.attribution,
        royaltyPercent: terms.royaltyPercentage
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set license terms';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [state.isInitialized]);
  
  /**
   * Get IP asset
   */
  const getIPAsset = useCallback(async (ipId: string): Promise<IPAsset | null> => {
    if (!state.isInitialized) {
      return null;
    }
    
    try {
      return await storyClient.current.getIPAsset(ipId);
    } catch (error) {
      console.error('Failed to get IP asset:', error);
      return null;
    }
  }, [state.isInitialized]);
  
  /**
   * Get IP metadata
   */
  const getIPMetadata = useCallback(async (ipId: string): Promise<IPMetadata | null> => {
    // This would fetch metadata from the IP asset
    // For now, return null as it requires additional implementation
    return null;
  }, []);
  
  /**
   * Claim revenue
   */
  const claimRevenue = useCallback(async (
    ipId: string,
    childIpIds: string[]
  ): Promise<{ success: boolean; claimedTokens?: string; error?: string }> => {
    if (!state.isInitialized) {
      throw new Error('Story Protocol client not initialized');
    }
    
    setIsLoading(true);
    try {
      return await storyClient.current.claimRevenue(ipId, childIpIds);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Revenue claim failed';
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [state.isInitialized]);
  
  /**
   * Upload to Grove
   */
  const uploadToGrove = useCallback(async (data: any): Promise<string> => {
    setIsUploading(true);
    try {
      return await storyClient.current.uploadToGrove(data);
    } finally {
      setIsUploading(false);
    }
  }, []);
  
  /**
   * Generate hash
   */
  const generateHash = useCallback((content: string): string => {
    return storyClient.current.generateHash(content);
  }, []);
  
  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
    setState((prev: StoryState) => ({ ...prev, error: null }));
  }, []);
  
  /**
   * Dispose of resources
   */
  const dispose = useCallback(() => {
    storyClient.current.dispose();
    setState({
      isInitialized: false,
      isConnected: false,
      isLoading: false,
      error: null,
      currentNetwork: isTestnet ? 'testnet' : 'mainnet',
      account: null,
    });
    setError(null);
    console.log('Story Protocol client disposed');
  }, [isTestnet]);
  
  /**
   * Helper: Create commercial remix terms
   */
  const createCommercialRemixTerms = useCallback((options: {
    revShare: number;
    mintingFee: number;
  }): CommercialTerms => {
    return {
      revShare: Math.max(0, Math.min(100, options.revShare)),
      mintingFee: Math.max(0, options.mintingFee),
      currency: 'ETH',
      royaltyPolicy: 'default'
    };
  }, []);
  
  /**
   * Helper: Generate pattern image
   */
  const generatePatternImage = useCallback((pattern: BreathingPatternIP): string => {
    const totalTime = pattern.inhale + pattern.hold + pattern.exhale + pattern.rest;
    const svg = `
      <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="200" fill="#3b82f6" rx="10"/>
        <text x="200" y="100" text-anchor="middle" fill="white" font-size="16">
          ${pattern.name}: ${pattern.inhale}-${pattern.hold}-${pattern.exhale}-${pattern.rest}
        </text>
        <text x="200" y="130" text-anchor="middle" fill="white" font-size="12">
          Total: ${totalTime}s
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }, []);
  
  /**
   * Helper: Validate pattern
   */
  const validatePattern = useCallback((pattern: BreathingPatternIP): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];
    
    if (!pattern.name || pattern.name.trim().length === 0) {
      errors.push('Pattern name is required');
    }
    
    if (!pattern.description || pattern.description.trim().length === 0) {
      errors.push('Pattern description is required');
    }
    
    if (!pattern.creator || pattern.creator.trim().length === 0) {
      errors.push('Creator address is required');
    }
    
    if (pattern.inhale <= 0) {
      errors.push('Inhale duration must be positive');
    }
    
    if (pattern.hold < 0) {
      errors.push('Hold duration cannot be negative');
    }
    
    if (pattern.exhale <= 0) {
      errors.push('Exhale duration must be positive');
    }
    
    if (pattern.rest < 0) {
      errors.push('Rest duration cannot be negative');
    }
    
    const totalTime = pattern.inhale + pattern.hold + pattern.exhale + pattern.rest;
    if (totalTime > 300) { // 5 minutes max
      errors.push('Total pattern duration cannot exceed 5 minutes');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);
  
  // Auto-initialize if requested
  useEffect(() => {
    if (autoInitialize && !state.isInitialized) {
      initialize().catch(console.error);
    }
  }, [autoInitialize, state.isInitialized, initialize]);
  
  // Update state when client changes
  useEffect(() => {
    setState((prev: StoryState) => ({
      ...prev,
      isConnected: storyClient.current.isReady(),
    }));
  }, []);
  
  return {
    // State
    state,
    
    // Loading states
    isLoading,
    isRegistering,
    isUploading,
    
    // Error handling
    error,
    
    // Core actions
    initialize,
    
    // IP Registration
    registerBreathingPatternIP,
    registerDerivativePattern,
    
    // License Management
    createLicenseTerms,
    
    // IP Management
    getIPAsset,
    getIPMetadata,
    
    // Revenue
    claimRevenue,
    
    // Utilities
    uploadToGrove,
    generateHash,
    clearError,
    dispose,
    
    // Helper functions
    createCommercialRemixTerms,
    generatePatternImage,
    validatePattern,
    setLicensingTerms,
  };
};