/**
 * Story Protocol API Client
 * Frontend client that communicates with the backend proxy server
 * instead of directly using the Story Protocol SDK in the browser
 */

import type {
  StoryConfig,
  IPMetadata,
  LicenseTerms,
  BreathingPatternIP,
  IPRegistrationResult,
  LicenseRegistrationResult,
  DerivativeRegistrationResult,
  LicenseType,
  CommercialTerms,
  StoryError
} from '../types';

/**
 * API Client Configuration
 * Extends StoryConfig with API specific options
 */
interface ApiClientConfig extends StoryConfig {
  apiKey?: string;
}

// API endpoint configuration
const API_CONFIG = {
  baseUrl: import.meta.env.VITE_STORY_API_URL || 'http://localhost:3001/api',
  endpoints: {
    health: '/health',
    ipAsset: '/ip-assets',
    ipAssetByOwner: '/ip-assets/by-owner',
    register: '/ip-assets/register',
    license: '/license',
    derivative: '/derivative',
  }
};

/**
 * API-based Story Protocol Client
 * Communicates with the backend proxy server instead of directly using the SDK
 */
export class StoryProtocolApiClient {
  private static instance: StoryProtocolApiClient | null = null;
  private isTestnet: boolean;
  private isInitialized = false;
  private apiKey?: string;
  
  // Utility methods
  generateHash: (content: string) => string = (content: string) => {
    // Browser-compatible hashing (simple for demonstration)
    // In a real app, use a proper browser crypto library
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  };

  // Add ipAsset property for backward compatibility
  ipAsset = {
    get: async (ipId: string) => this.getIPAsset(ipId),
    getByOwner: async (owner: string) => this.getIPAssetsByOwner(owner),
  };

  private constructor(isTestnet: boolean = true) {
    this.isTestnet = isTestnet;
  }

  /**
   * Singleton instance
   */
  static getInstance(isTestnet: boolean = true): StoryProtocolApiClient {
    if (!StoryProtocolApiClient.instance) {
      StoryProtocolApiClient.instance = new StoryProtocolApiClient(isTestnet);
    }
    return StoryProtocolApiClient.instance;
  }

  /**
   * Initialize client with config
   */
  async initialize(config: Partial<ApiClientConfig> = {}): Promise<void> {
    try {
      this.apiKey = config.apiKey || import.meta.env.VITE_STORY_API_KEY;
      
      // Test the API connection
      const headers: HeadersInit = {};
      
      // Add API key if available
      if (this.apiKey) {
        headers['X-API-Key'] = this.apiKey;
      }
      
      const healthResponse = await fetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.health}`,
        { headers }
      );
      
      if (!healthResponse.ok) {
        throw new Error(`API health check failed: ${healthResponse.status}`);
      }
      
      this.isInitialized = true;
      console.log(`Story Protocol API client initialized for ${this.isTestnet ? 'testnet' : 'mainnet'}`);
    } catch (error) {
      console.error('Failed to initialize Story Protocol API client:', error);
      throw this.createStoryError('API_INIT_FAILED', 'Failed to initialize Story Protocol API client', error);
    }
  }

  /**
   * Create standardized Story error
   */
  private createStoryError(code: string, message: string, originalError?: any): StoryError {
    return {
      code,
      message,
      details: originalError,
    };
  }

  /**
   * Make an API request with proper error handling
   */
  private async apiRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    try {
      const url = `${API_CONFIG.baseUrl}${endpoint}`;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add API key if available
      if (this.apiKey) {
        headers['X-API-Key'] = this.apiKey;
      }
      
      // Add network information
      headers['X-Network'] = this.isTestnet ? 'testnet' : 'mainnet';
      
      const options: RequestInit = {
        method,
        headers,
        credentials: 'include',
      };
      
      // Add body for non-GET requests
      if (method !== 'GET' && data) {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API request failed: ${response.status}`);
      }
      
      return await response.json() as T;
    } catch (error) {
      console.error(`API request to ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Register breathing pattern as IP
   */
  async registerBreathingPatternIP(
    pattern: BreathingPatternIP,
    licenseType: LicenseType = 'nonCommercial',
    commercialTerms?: CommercialTerms
  ): Promise<IPRegistrationResult> {
    if (!this.isInitialized) {
      throw this.createStoryError('CLIENT_NOT_INITIALIZED', 'Story Protocol API client not initialized');
    }

    try {
      const requestData = {
        pattern,
        licenseType,
        commercialTerms
      };
      
      return await this.apiRequest<IPRegistrationResult>(
        API_CONFIG.endpoints.register,
        'POST',
        requestData
      );
    } catch (error) {
      console.error('IP registration failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'IP registration failed'
      };
    }
  }

  /**
   * Register derivative breathing pattern
   */
  async registerDerivativePattern(
    originalIpId: string,
    licenseTermsId: string,
    derivativePattern: BreathingPatternIP
  ): Promise<DerivativeRegistrationResult> {
    if (!this.isInitialized) {
      throw this.createStoryError('CLIENT_NOT_INITIALIZED', 'Story Protocol API client not initialized');
    }

    try {
      const requestData = {
        originalIpId,
        licenseTermsId,
        derivativePattern
      };
      
      return await this.apiRequest<DerivativeRegistrationResult>(
        API_CONFIG.endpoints.derivative,
        'POST',
        requestData
      );
    } catch (error) {
      console.error('Derivative registration failed:', error);
      return {
        success: false,
        parentIpIds: [originalIpId],
        licenseTermsIds: [licenseTermsId],
        error: error instanceof Error ? error.message : 'Derivative registration failed'
      };
    }
  }

  /**
   * Create license terms
   */
  async createLicenseTerms(
    licenseType: LicenseType,
    commercialTerms?: CommercialTerms
  ): Promise<LicenseRegistrationResult> {
    if (!this.isInitialized) {
      throw this.createStoryError('CLIENT_NOT_INITIALIZED', 'Story Protocol API client not initialized');
    }

    try {
      const requestData = {
        licenseType,
        commercialTerms
      };
      
      return await this.apiRequest<LicenseRegistrationResult>(
        API_CONFIG.endpoints.license,
        'POST',
        requestData
      );
    } catch (error) {
      console.error('License terms creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'License terms creation failed'
      };
    }
  }

  /**
   * Transfer an IP asset
   */
  async transferIPAsset(ipId: string, toAddress: string): Promise<{
    success: boolean;
    message: string;
    transferInstructions: string;
    error?: string;
  }> {
    if (!this.isInitialized) {
      throw this.createStoryError('CLIENT_NOT_INITIALIZED', 'Story Protocol API client not initialized');
    }

    try {
      const requestData = {
        ipId,
        toAddress
      };
      
      return await this.apiRequest<{
        success: boolean;
        message: string;
        transferInstructions: string;
        error?: string;
      }>(
        `${API_CONFIG.endpoints.ipAsset}/${ipId}/transfer`,
        'POST',
        requestData
      );
    } catch (error) {
      console.error('Failed to get transfer instructions:', error);
      return {
        success: false,
        message: 'Error preparing transfer instructions',
        transferInstructions: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get IP asset information
   */
  async getIPAsset(ipId: string): Promise<any> {
    if (!this.isInitialized) {
      throw this.createStoryError('CLIENT_NOT_INITIALIZED', 'Story Protocol API client not initialized');
    }

    try {
      return await this.apiRequest<any>(`${API_CONFIG.endpoints.ipAsset}/${ipId}`, 'GET');
    } catch (error) {
      console.error('Failed to get IP asset:', error);
      return null;
    }
  }

  /**
   * Get IP assets by owner
   */
  async getIPAssetsByOwner(owner: string): Promise<any[]> {
    if (!this.isInitialized) {
      throw this.createStoryError('CLIENT_NOT_INITIALIZED', 'Story Protocol API client not initialized');
    }

    try {
      return await this.apiRequest<any[]>(`${API_CONFIG.endpoints.ipAssetByOwner}/${owner}`, 'GET');
    } catch (error) {
      console.error('Failed to get IP assets by owner:', error);
      return [];
    }
  }

  /**
   * Set license terms for an existing IP asset
   */
  async setIPLicenseTerms(
    ipId: string,
    terms: {
      commercialUse: boolean;
      derivativeWorks: boolean;
      attributionRequired: boolean;
      royaltyPercent: number;
    }
  ): Promise<{
    success: boolean;
    licenseTermsId?: string;
    txHash?: string;
    error?: string;
  }> {
    if (!this.isInitialized) {
      throw this.createStoryError('CLIENT_NOT_INITIALIZED', 'Story Protocol API client not initialized');
    }

    try {
      const requestData = {
        ipId,
        terms
      };
      
      return await this.apiRequest<{
        success: boolean;
        licenseTermsId?: string;
        txHash?: string;
        error?: string;
      }>(
        `${API_CONFIG.endpoints.license}/${ipId}`,
        'PUT',
        requestData
      );
    } catch (error) {
      console.error('Failed to set license terms:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set license terms'
      };
    }
  }

  /**
   * Claim revenue from derivatives
   */
  async claimRevenue(ipId: string, childIpIds: string[]): Promise<{
    success: boolean;
    claimedTokens?: string;
    error?: string;
  }> {
    if (!this.isInitialized) {
      throw this.createStoryError('CLIENT_NOT_INITIALIZED', 'Story Protocol API client not initialized');
    }

    try {
      const requestData = {
        ipId,
        childIpIds
      };
      
      return await this.apiRequest<{
        success: boolean;
        claimedTokens?: string;
        error?: string;
      }>(
        `${API_CONFIG.endpoints.ipAsset}/${ipId}/claim-revenue`,
        'POST',
        requestData
      );
    } catch (error) {
      console.error('Revenue claim failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Revenue claim failed'
      };
    }
  }

  /**
   * Check if client is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get network information
   */
  get network() {
    return {
      name: this.isTestnet ? 'Story Aeneid Testnet' : 'Story Mainnet',
      chainId: this.isTestnet ? 1315 : 1,
      rpcUrl: this.isTestnet ? 'https://aeneid.storyrpc.io' : 'https://mainnet.storyrpc.io',
      explorer: this.isTestnet ? 'https://aeneid.explorer.story.foundation' : 'https://explorer.story.foundation',
    };
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.isInitialized = false;
    StoryProtocolApiClient.instance = null;
    console.log('Story Protocol API client disposed');
  }
}

export default StoryProtocolApiClient;