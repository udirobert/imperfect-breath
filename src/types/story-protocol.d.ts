/**
 * Type definitions for Story Protocol SDK integration
 * These types represent the actual structure of the Story Protocol SDK
 * and are used to type-check our integration code.
 */

declare module '@story-protocol/core-sdk' {
  // Main client class
  export class StoryClient {
    constructor(config: StoryClientConfig);
    
    // Client modules
    ipAsset: IPAssetClient;
    license: LicenseClient;
  }
  
  // Configuration for StoryClient
  export interface StoryClientConfig {
    chain: {
      id: number;
    };
    transport: any;
    publicClient?: any;
    walletClient?: any;
  }
  
  // IP Asset module
  export interface IPAssetClient {
    // IP registration
    register(params: RegisterIPParams): Promise<RegisterIPResponse>;
    
    // Derivative registration
    registerDerivative(params: RegisterDerivativeParams): Promise<RegisterDerivativeResponse>;
    
    // IP retrieval
    get(ipId: string): Promise<IPAssetResponse>;
    
    // Get IP assets by owner
    getByOwner(address: string): Promise<IPAssetResponse[]>;
  }
  
  // License module
  export interface LicenseClient {
    // Set license terms
    setTerms(params: SetLicenseTermsParams): Promise<SetLicenseTermsResponse>;
    
    // Get license terms
    getTerms(ipId: string): Promise<LicenseTermsResponse>;
  }
  
  // Parameters for registering IP
  export interface RegisterIPParams {
    tokenURI: string;
    tokenURIType: number;
    royaltyContext?: {
      royaltyPolicy: string;
      royaltyAmount: number;
    };
  }
  
  // Response from IP registration
  export interface RegisterIPResponse {
    txHash?: string;
    hash?: string;
    ipId?: string;
  }
  
  // Parameters for registering a derivative work
  export interface RegisterDerivativeParams {
    parentIpId: string;
    tokenURI: string;
    tokenURIType: number;
    royaltyContext?: {
      royaltyPolicy: string;
      royaltyAmount: number;
    };
  }
  
  // Response from derivative registration
  export interface RegisterDerivativeResponse {
    txHash?: string;
    hash?: string;
    ipId?: string;
  }
  
  // Parameters for setting license terms
  export interface SetLicenseTermsParams {
    ipId: string;
    commercial: boolean;
    derivatives: boolean;
    attribution: boolean;
    royaltyPercentage?: number;
  }
  
  // Response from setting license terms
  export interface SetLicenseTermsResponse {
    txHash?: string;
    success: boolean;
  }
  
  // Response from license terms query
  export interface LicenseTermsResponse {
    commercial: boolean;
    derivatives: boolean;
    attribution: boolean;
    royaltyPercentage?: number;
  }
  
  // Response from IP asset query
  export interface IPAssetResponse {
    ipId: string;
    name: string;
    description: string;
    owner: string;
    registrationDate: number;
  }
  
  // PIL types for licensing
  export enum PIL_TYPE {
    CREATIVE_COMMONS_ATTRIBUTION,
    NON_COMMERCIAL_REMIX,
    COMMERCIAL_USE,
    COMMERCIAL_REMIX,
  }
}