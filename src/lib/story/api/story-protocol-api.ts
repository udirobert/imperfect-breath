/**
 * Story Protocol API Client
 * 
 * Uses the REST API instead of the SDK for browser compatibility
 * API Documentation: https://api.storyapis.com
 */

// API Configuration
const API_CONFIG = {
  // Use the local server for backend proxy operations
  baseUrl: process.env.NODE_ENV === 'production'
    ? (process.env.API_URL || 'https://api.imperfectbreath.com')
    : 'http://localhost:3001',
  storyApiUrl: 'https://api.storyapis.com',
  headers: {
    // Use testnet by default, can be overridden
    'X-CHAIN': 'story-aeneid', // 'story' for mainnet, 'story-aeneid' for testnet
    'X-API-Key': process.env.STORY_API_KEY || 'MhBsxkU1z9fG6TofE59KqiiWV-YlYE8Q4awlLQehF3U',
    'Content-Type': 'application/json'
  }
};

// Error types
export interface StoryAPIError {
  code: string;
  message: string;
  details?: any;
}

// Common response type
interface APIResponse<T> {
  data?: T;
  error?: StoryAPIError;
}

/**
 * IP Asset types
 */
export interface IPAsset {
  id: string;
  tokenId: string;
  tokenContract: string;
  owner: string;
  metadata: {
    title?: string;
    description?: string;
    image?: string;
    attributes?: Array<{
      trait_type: string;
      value: string;
    }>;
  };
  createdAt: string;
  // Add other fields as needed based on API response
}

/**
 * License types
 */
export interface IPLicenseTerms {
  id: string;
  ipId: string;
  commercial: boolean;
  derivatives: boolean;
  attribution: boolean;
  reciprocal: boolean;
  commercialRevShare: number;
  // Add other fields as needed
}

/**
 * Story Protocol API Client
 */
export class StoryProtocolAPI {
  private baseUrl: string;
  private headers: Record<string, string>;
  private isTestnet: boolean;

  constructor(options: {
    isTestnet?: boolean;
    apiKey?: string;
  } = {}) {
    this.isTestnet = options.isTestnet ?? true;
    this.baseUrl = API_CONFIG.baseUrl;
    this.headers = {
      ...API_CONFIG.headers,
      'X-CHAIN': this.isTestnet ? 'story-aeneid' : 'story',
    };

    if (options.apiKey) {
      this.headers['X-API-Key'] = options.apiKey;
    }
  }

  /**
   * Execute API request
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any,
    useStoryApi: boolean = false
  ): Promise<APIResponse<T>> {
    try {
      // Determine which base URL to use
      const baseUrl = useStoryApi ? API_CONFIG.storyApiUrl : this.baseUrl;
      const url = `${baseUrl}${endpoint}`;
      
      // Use appropriate headers
      const headers = {...this.headers};
      
      // For our backend proxy, add authentication
      if (!useStoryApi) {
        // If calling our backend, use the API key for authentication
        headers['X-API-Key'] = process.env.API_KEY || this.headers['X-API-Key'];
      }
      
      const options: RequestInit = {
        method,
        headers,
        credentials: !useStoryApi ? 'include' : 'omit' // Use credentials for our own API
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        return {
          error: {
            code: `API_ERROR_${response.status}`,
            message: data.message || `API request failed with status ${response.status}`,
            details: data
          }
        };
      }

      return { data: data as T };
    } catch (error) {
      return {
        error: {
          code: 'API_REQUEST_FAILED',
          message: error instanceof Error ? error.message : 'Unknown API error',
          details: error
        }
      };
    }
  }

  /**
   * Get IP Asset by ID
   */
  async getIPAsset(ipId: string): Promise<APIResponse<IPAsset>> {
    return this.request<IPAsset>(`/ipassets/${ipId}`, 'GET', undefined, true);
  }

  /**
   * List IP Assets owned by an address
   */
  async listIPAssetsByOwner(ownerAddress: string): Promise<APIResponse<IPAsset[]>> {
    return this.request<IPAsset[]>('/ipassets/list', 'POST', {
      owner: ownerAddress,
      limit: 100
    }, true);
  }

  /**
   * Get license terms for an IP
   */
  async getIPLicenseTerms(ipId: string): Promise<APIResponse<IPLicenseTerms>> {
    return this.request<IPLicenseTerms>(`/iplicenseterms/ip/${ipId}`, 'GET', undefined, true);
  }

  /**
   * Get blockchain stats
   * Uses the Storyscan API to get gas price, block time, etc.
   */
  async getBlockchainStats(): Promise<APIResponse<any>> {
    try {
      const response = await fetch('https://www.storyscan.io/api/v2/stats');
      const data = await response.json();
      
      if (!response.ok) {
        return {
          error: {
            code: 'STATS_API_ERROR',
            message: 'Failed to fetch blockchain stats',
            details: data
          }
        };
      }
      
      return { data };
    } catch (error) {
      return {
        error: {
          code: 'STATS_API_REQUEST_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        }
      };
    }
  }

  /**
   * List collections
   */
  async listCollections(limit: number = 10): Promise<APIResponse<any[]>> {
    return this.request<any[]>('/collections/list', 'POST', {
      limit
    });
  }

  /**
   * Get transaction details
   */
  async getTransaction(txHash: string): Promise<APIResponse<any>> {
    return this.request<any>(`/transactions/${txHash}`);
  }
  
  /**
   * Register IP Asset via backend proxy
   * Calls our server-side backend proxy API that performs the actual blockchain transaction
   */
  async registerIPAsset(metadata: any, nftMetadata: any): Promise<APIResponse<any>> {
    return this.request<any>('/backend-proxy/register-ip', 'POST', {
      metadata,
      nftMetadata,
      metadataURI: metadata.uri || ''
    });
  }
  
  /**
   * Set license terms for an IP asset via backend proxy
   */
  async setLicenseTerms(ipId: string, terms: any): Promise<APIResponse<any>> {
    return this.request<any>('/backend-proxy/set-license-terms', 'POST', {
      ipId,
      terms
    });
  }
  
  /**
   * Register derivative relationship via backend proxy
   */
  async registerDerivative(parentIpId: string, childIpId: string, licenseTermsId: string): Promise<APIResponse<any>> {
    return this.request<any>('/backend-proxy/register-derivative', 'POST', {
      parentIpId,
      childIpId,
      licenseTermsId
    });
  }
  
  /**
   * Get transaction status from the backend
   */
  async getTransactionStatus(txHash: string): Promise<APIResponse<any>> {
    return this.request<any>(`/backend-proxy/transaction/${txHash}`);
  }
  
  /**
   * Get IP assets by owner from the backend (server-side SDK implementation)
   */
  async getIPAssetsByOwnerFromBackend(ownerAddress: string): Promise<APIResponse<any>> {
    return this.request<any>(`/backend-proxy/ip-assets/by-owner/${ownerAddress}`);
  }
  
  /**
   * Get IP asset details from the backend (server-side SDK implementation)
   */
  async getIPAssetFromBackend(ipId: string): Promise<APIResponse<any>> {
    return this.request<any>(`/backend-proxy/ip-assets/${ipId}`);
  }
  
  /**
   * Get license terms from the backend (server-side SDK implementation)
   */
  async getLicenseTermsFromBackend(ipId: string): Promise<APIResponse<any>> {
    return this.request<any>(`/backend-proxy/license/${ipId}`);
  }
}

// Create singleton instance
let apiInstance: StoryProtocolAPI | null = null;

/**
 * Get the Story Protocol API client instance
 */
export function getStoryProtocolAPI(options?: {
  isTestnet?: boolean;
  apiKey?: string;
}): StoryProtocolAPI {
  if (!apiInstance) {
    apiInstance = new StoryProtocolAPI(options);
  }
  return apiInstance;
}

export default getStoryProtocolAPI;