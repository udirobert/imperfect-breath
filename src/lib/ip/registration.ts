import type {
  IPRegistration,
  IPMetadata,
  UserWallet,
  Transaction,
  BlockchainError as BlockchainErrorType,
  LicenseTerms as BlockchainLicenseTerms
} from "../../types/blockchain";
import type { CustomPattern } from "../../lib/ai/providers";
import { storyClient, LicenseTerms, IPAsset } from "../story";
// Make sure we're using the correct LicenseTerms interface
import type { BreathingPatternIP, LicenseTerms as ConsolidatedLicenseTerms } from "../story/types";
import { SimpleCache } from "../utils/cache-utils";

export class IPRegistrationService {
  private static instance: IPRegistrationService;
  private cache = SimpleCache.getInstance(100); // Use singleton cache

  private constructor() {
    // Initialize cache with existing localStorage data if any
    this.migrateLocalStorageToCache();
  }

  static getInstance(): IPRegistrationService {
    if (!IPRegistrationService.instance) {
      IPRegistrationService.instance = new IPRegistrationService();
    }
    return IPRegistrationService.instance;
  }

  /**
   * Register a breathing pattern as intellectual property on the blockchain
   */
  async registerPattern(
    pattern: CustomPattern,
    wallet: UserWallet,
    royaltyPercentage: number = 10,
  ): Promise<IPRegistration> {
    try {
      if (!wallet.address) {
        throw new BlockchainError(
          "WALLET_NOT_CONNECTED",
          "Wallet must be connected to register IP",
          {},
          new Date().toISOString(),
        );
      }

      // Build metadata for the breathing pattern
      const metadata = this.buildIPMetadata(pattern);

      // Validate pattern before registration
      this.validatePattern(pattern);

      // Register with Story Protocol
      console.log(`Registering pattern "${pattern.name}" with Story Protocol...`);
      
      // Convert phases to the format expected by the SDK
      const phases = pattern.phases.map(phase => phase.duration || 0);
      
      // Create a breathing pattern for SDK registration
      const breathingPattern: BreathingPatternIP = {
        name: pattern.name,
        description: pattern.description,
        creator: wallet.address,
        inhale: pattern.phases.find(p => p.name === 'inhale')?.duration || 0,
        hold: pattern.phases.find(p => p.name === 'hold')?.duration || 0,
        exhale: pattern.phases.find(p => p.name === 'exhale')?.duration || 0,
        rest: pattern.phases.find(p => p.name === 'rest')?.duration || 0,
        tags: pattern.tags || []
      };
      
      try {
        // Register the pattern using the Story Protocol SDK service
        const result = await storyClient.registerBreathingPatternIP(breathingPattern);
        
        if (!result.success || !result.ipId) {
          throw new Error(result.error || "IP registration failed");
        }
        
        // Create registration object
        const registration: IPRegistration = {
          ipHash: result.ipId,
          transactionHash: result.txHash || result.ipId,
          creator: wallet.address,
          title: pattern.name,
          description: pattern.description,
          contentHash: this.generateContentHash(pattern),
          timestamp: new Date().toISOString(),
          verified: true,
          royaltyPercent: royaltyPercentage,
          licensingTerms: [],
        };
        
        // Set license terms after registration
        await storyClient.setIPLicenseTerms(result.ipId, {
          commercialUse: true,
          derivativeWorks: true,
          attributionRequired: true,
          royaltyPercent: royaltyPercentage
        });

        // Cache the registration data
        this.cacheRegistration(registration, pattern);

        // As a fallback, also store in localStorage for offline access
        await this.storeRegistration(registration, pattern);

        console.log(
          `✅ Pattern "${pattern.name}" registered as IP:`,
          registration.ipHash,
        );

        return registration;
      } catch (error) {
        console.error("IP Registration failed:", error);
        throw this.handleRegistrationError(error);
      }
    } catch (error) {
      console.error("IP Registration failed:", error);
      throw this.handleRegistrationError(error);
    }
  }

  /**
   * Verify ownership of a pattern by checking if the given wallet address
   * matches the creator/owner address on the blockchain or in our records
   */
  async verifyOwnership(
    patternId: string,
    walletAddress: string,
  ): Promise<boolean> {
    try {
      // First try to verify directly with the blockchain
      // Attempt to get the pattern ID to IP ID mapping
      const patternKey = `pattern_${patternId}`;
      const patternData = localStorage.getItem(patternKey);
      let ipId: string | null = null;
      
      if (patternData) {
        try {
          const pattern = JSON.parse(patternData);
          ipId = pattern.ipHash;
        } catch (parseError) {
          console.warn("Failed to parse pattern data:", parseError);
        }
      }
      
      // If we have an IP ID, check ownership directly
      if (ipId) {
        try {
          const ipAsset = await storyClient.ipAsset?.get(ipId);
          if (ipAsset && ipAsset.owner) {
            return ipAsset.owner.toLowerCase() === walletAddress.toLowerCase();
          }
        } catch (ipError) {
          console.warn("Failed to get IP asset:", ipError);
        }
      }
      
      // If direct verification failed, try to get registration from our service
      const registration = await this.getRegistration(patternId);
      
      if (!registration) {
        return false;
      }

      // Check blockchain ownership - no fallbacks
      const ipAsset = await storyClient.ipAsset?.get(registration.ipHash);
      
      // Verify that the owner matches the wallet address
      return Boolean(
        ipAsset &&
        ipAsset.owner &&
        ipAsset.owner.toLowerCase() === walletAddress.toLowerCase()
      );
    } catch (error) {
      console.error("Ownership verification failed:", error);
      return false;
    }
  }

  /**
   * Transfer ownership of a registered IP pattern to a new owner
   * Uses Story Protocol SDK when available
   */
  async transferOwnership(
    patternId: string,
    newOwner: string,
  ): Promise<Transaction> {
    try {
      const registration = await this.getRegistration(patternId);

      if (!registration) {
        throw new Error("Pattern not found or not registered");
      }

      // Attempt to transfer the IP asset using the Story Protocol SDK
      console.log("Transferring ownership of IP asset:", registration.ipHash, "to", newOwner);
      
      // Only use real blockchain transfers
      let transaction: Transaction;
      
      // Check if transfer method is available
      if (!(storyClient.ipAsset && 'transfer' in storyClient.ipAsset &&
          typeof (storyClient.ipAsset as any).transfer === 'function')) {
        throw new Error("Transfer method not available in the SDK");
      }
      
      // Execute the transfer
      const result = await (storyClient.ipAsset as any).transfer({
        ipId: registration.ipHash,
        to: newOwner as `0x${string}`
      });
      
      if (!result || (!result.txHash && !result.hash)) {
        throw new Error("Transfer failed: No transaction hash returned");
      }
      
      const hash = result.txHash || result.hash;
      
      // Create a transaction record from the real transfer
      transaction = {
        hash: hash,
        from: registration.creator,
        to: newOwner,
        value: "0",
        gasUsed: "21000", // Estimated
        gasPrice: "20000000000", // Estimated
        status: "confirmed" as "confirmed",
        timestamp: new Date().toISOString(),
        blockNumber: 0, // We'll update this when we get the receipt
      };
      
      // Update our cache and local records
      this.updateRegistrationOwner(patternId, newOwner);

      console.log(
        `✅ Ownership transferred for pattern ${patternId}:`,
        transaction.hash,
      );

      return transaction;
    } catch (error) {
      console.error("Ownership transfer failed:", error);
      throw this.handleTransferError(error);
    }
  }

  /**
   * Get registration details for a pattern
   */
  async getRegistration(patternId: string): Promise<IPRegistration | null> {
    try {
      // Check cache first
      const cacheKey = `ip_registration_${patternId}`;
      const cachedRegistration = this.cache.get<IPRegistration>(cacheKey);
      if (cachedRegistration) {
        return cachedRegistration;
      }
      
      // Try to get from local storage as fallback
      const stored = localStorage.getItem(cacheKey);
      const localRegistration = stored ? JSON.parse(stored) : null;
      
      // If we have a registration with an ipHash, try to get latest data from blockchain
      if (localRegistration && localRegistration.ipHash) {
        try {
          // Try to get the IP asset from the blockchain
          const ipAsset = await storyClient.ipAsset?.get(localRegistration.ipHash);
          
          if (ipAsset) {
            // Get license terms if available
            let licenseTerms: BlockchainLicenseTerms[] = [];
            try {
              const terms = await storyClient.getIPAsset(localRegistration.ipHash);
              if (terms && terms.licenseTerms) {
                // Convert license terms to blockchain LicenseTerms format
                licenseTerms = [{
                  id: "standard",
                  // Must use "commercial", "personal", or "exclusive" to match the expected enum
                  type: terms.licenseTerms.commercialUse ? "commercial" : "personal",
                  price: 0,
                  currency: "ETH",
                  attributionRequired: terms.licenseTerms.derivativesAttribution ?? false,
                  derivativeWorks: terms.licenseTerms.derivativesAllowed ?? false,
                  commercialUse: terms.licenseTerms.commercialUse ?? false,
                  royaltyPercent: terms.licenseTerms.commercialRevShare ?? 0
                }];
              }
            } catch (err) {
              console.warn("Failed to get license terms:", err);
            }
            
            // Create an updated registration with blockchain data
            const enhancedRegistration = {
              ...localRegistration,
              creator: ipAsset.owner || localRegistration.creator,
              verified: true,
              licensingTerms: licenseTerms
            };
            
            // Update the cache with the enhanced data
            this.cache.set(cacheKey, enhancedRegistration);
            
            return enhancedRegistration;
          }
        } catch (error) {
          console.warn("Failed to get IP from blockchain, using local data:", error);
          
          // Still cache the local data
          if (localRegistration) {
            this.cache.set(cacheKey, localRegistration);
          }
        }
      }
      
      return localRegistration;
    } catch (error) {
      console.error("Failed to get registration:", error);
      return null;
    }
  }

  /**
   * Get all registrations for a creator
   */
  async getCreatorRegistrations(
    creatorAddress: string,
  ): Promise<IPRegistration[]> {
    try {
      // Check cache first
      const cacheKey = `creator_registrations_${creatorAddress.toLowerCase()}`;
      const cachedRegistrations = this.cache.get<IPRegistration[]>(cacheKey);
      if (cachedRegistrations) {
        return cachedRegistrations;
      }
      
      // Try to get IP assets from the blockchain
      try {
        const ipAssets = await storyClient.ipAsset?.getByOwner(creatorAddress);
        
        if (ipAssets && ipAssets.length > 0) {
          // Convert Story Protocol IP assets to our IPRegistration format
          const registrations = await Promise.all(
            ipAssets.map(async (asset: any) => {
              // Try to get license terms
              let licenseTerms: BlockchainLicenseTerms[] = [];
              try {
                const terms = await storyClient.getIPAsset(asset.ipId);
                if (terms && terms.licenseTerms) {
                  // Convert to blockchain LicenseTerms format
                  licenseTerms = [{
                    id: "standard",
                    // Use "personal" instead of "non-commercial" for compatibility with the enum
                    type: terms.licenseTerms.commercialUse ? "commercial" : "personal",
                    price: 0,
                    currency: "ETH",
                    attributionRequired: terms.licenseTerms.derivativesAttribution ?? false,
                    derivativeWorks: terms.licenseTerms.derivativesAllowed ?? false,
                    commercialUse: terms.licenseTerms.commercialUse ?? false,
                    royaltyPercent: terms.licenseTerms.commercialRevShare ?? 0
                  }];
                }
              } catch (err) {
                console.warn("Failed to get license terms:", err);
              }
              
              return {
                ipHash: asset.ipId,
                transactionHash: asset.transactionHash || "",
                creator: asset.owner || creatorAddress,
                title: asset.name || "Untitled",
                description: asset.description || "",
                contentHash: asset.contentHash || `0x${Math.random().toString(16).substring(2, 64)}`,
                timestamp: asset.registrationDate ? new Date(asset.registrationDate).toISOString() : new Date().toISOString(),
                verified: true,
                royaltyPercent: 10, // Default
                licensingTerms: licenseTerms
              };
            })
          );
          
          // Cache the results
          this.cache.set(cacheKey, registrations);
          
          return registrations;
        }
      } catch (error) {
        console.warn("Failed to get creator registrations from blockchain:", error);
      }
      
      // Fall back to local storage if blockchain fetch fails
      const registrations: IPRegistration[] = [];
      
      // Get from local storage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("ip_registration_")) {
          try {
            const registration = JSON.parse(localStorage.getItem(key) || "{}");
            if (
              registration.creator?.toLowerCase() === creatorAddress.toLowerCase()
            ) {
              registrations.push(registration);
            }
          } catch (parseError) {
            console.error("Failed to parse registration:", parseError);
          }
        }
      }
      
      // Cache the results from localStorage
      if (registrations.length > 0) {
        this.cache.set(cacheKey, registrations);
      }
      
      return registrations;
    } catch (error) {
      console.error("Failed to get creator registrations:", error);
      return [];
    }
  }

  /**
   * Check if a pattern is already registered
   */
  async isPatternRegistered(pattern: CustomPattern): Promise<boolean> {
    try {
      const contentHash = this.generateContentHash(pattern);

      // First try to check against blockchain
      if (pattern.creator) {
        try {
          // Get all creator's IP assets
          const creatorAssets = await storyClient.ipAsset?.getByOwner(pattern.creator);
          
          if (creatorAssets && creatorAssets.length > 0) {
            // Check asset metadata for match
            for (const asset of creatorAssets) {
              // Compare name and description for a simple match
              // More advanced matching would require checking the metadata attributes
              if (asset.name === pattern.name &&
                  asset.description === pattern.description) {
                return true;
              }
            }
          }
        } catch (error) {
          console.warn("Failed to check blockchain for pattern registration:", error);
        }
      }

      // Fall back to local check
      // Check if content hash exists in registrations
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("ip_registration_")) {
          try {
            const registration = JSON.parse(localStorage.getItem(key) || "{}");
            if (registration.contentHash === contentHash) {
              return true;
            }
          } catch (parseError) {
            console.error("Failed to parse registration:", parseError);
          }
        }
      }

      return false;
    } catch (error) {
      console.error("Failed to check pattern registration:", error);
      return false;
    }
  }

  /**
   * Build IP metadata for a breathing pattern
   */
  private buildIPMetadata(pattern: CustomPattern): IPMetadata {
    return {
      title: pattern.name,
      description: pattern.description,
      creator: pattern.creator,
      createdAt: new Date().toISOString(),
      contentType: "breathing-pattern",
      attributes: {
        category: pattern.category,
        difficulty: pattern.difficulty,
        duration: pattern.duration,
        phases: pattern.phases,
      },
      version: "1.0.0",
    };
  }

  /**
   * Generate a unique content hash for a pattern
   */
  private generateContentHash(pattern: CustomPattern): string {
    const content = JSON.stringify({
      name: pattern.name,
      phases: pattern.phases,
      category: pattern.category,
      difficulty: pattern.difficulty,
    });

    // Simple hash implementation - replace with proper cryptographic hash
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return `0x${Math.abs(hash).toString(16).padStart(16, "0")}`;
  }

  /**
   * Validate pattern before registration
   */
  private validatePattern(pattern: CustomPattern): void {
    if (!pattern.name?.trim()) {
      throw new Error("Pattern name is required");
    }

    if (!pattern.description?.trim()) {
      throw new Error("Pattern description is required");
    }

    if (!pattern.phases || pattern.phases.length === 0) {
      throw new Error("Pattern must have at least one phase");
    }

    if (!pattern.creator?.trim()) {
      throw new Error("Pattern creator is required");
    }
  }

  /**
   * Store registration in cache
   */
  private cacheRegistration(
    registration: IPRegistration,
    pattern: CustomPattern,
  ): void {
    try {
      // Store in memory cache
      this.cache.set(`ip_registration_${pattern.id}`, registration);
      
      // Store pattern with IP info
      const patternWithIP = {
        ...pattern,
        ipHash: registration.ipHash,
        ipRegistered: true,
        registrationDate: registration.timestamp,
      };
      
      this.cache.set(`pattern_${pattern.id}`, patternWithIP);
      
      // Update creator registrations cache
      if (registration.creator) {
        const creatorKey = `creator_registrations_${registration.creator.toLowerCase()}`;
        const existingRegistrations = this.cache.get<IPRegistration[]>(creatorKey) || [];
        const updatedRegistrations = [
          ...existingRegistrations.filter(r => r.ipHash !== registration.ipHash),
          registration
        ];
        this.cache.set(creatorKey, updatedRegistrations);
      }
    } catch (error) {
      console.error("Failed to cache registration:", error);
    }
  }

  /**
   * Store registration in local storage (as fallback)
   */
  private async storeRegistration(
    registration: IPRegistration,
    pattern: CustomPattern,
  ): Promise<void> {
    try {
      // Store in localStorage as fallback
      localStorage.setItem(
        `ip_registration_${pattern.id}`,
        JSON.stringify(registration),
      );

      // Also store pattern with IP info
      const patternWithIP = {
        ...pattern,
        ipHash: registration.ipHash,
        ipRegistered: true,
        registrationDate: registration.timestamp,
      };

      localStorage.setItem(
        `pattern_${pattern.id}`,
        JSON.stringify(patternWithIP),
      );
    } catch (error) {
      console.error("Failed to store registration:", error);
      throw error;
    }
  }

  /**
   * Update registration owner
   */
  private updateRegistrationOwner(
    patternId: string,
    newOwner: string,
  ): void {
    try {
      // Update in cache
      const cacheKey = `ip_registration_${patternId}`;
      const registration = this.cache.get<IPRegistration>(cacheKey);
      
      if (registration) {
        const updatedRegistration = {
          ...registration,
          creator: newOwner
        };
        
        // Update cache
        this.cache.set(cacheKey, updatedRegistration);
        
        // Update localStorage
        localStorage.setItem(
          cacheKey,
          JSON.stringify(updatedRegistration),
        );
        
        // Update creator registrations caches
        if (registration.creator) {
          const oldCreatorKey = `creator_registrations_${registration.creator.toLowerCase()}`;
          const oldRegistrations = this.cache.get<IPRegistration[]>(oldCreatorKey) || [];
          this.cache.set(
            oldCreatorKey,
            oldRegistrations.filter(r => r.ipHash !== registration.ipHash)
          );
        }
        
        const newCreatorKey = `creator_registrations_${newOwner.toLowerCase()}`;
        const newRegistrations = this.cache.get<IPRegistration[]>(newCreatorKey) || [];
        this.cache.set(
          newCreatorKey,
          [...newRegistrations, {...registration, creator: newOwner}]
        );
      }
    } catch (error) {
      console.error("Failed to update registration owner:", error);
      throw error;
    }
  }

  /**
   * Handle registration errors
   */
  private handleRegistrationError(error: unknown): BlockchainErrorType {
    if (error instanceof Error) {
      return {
        code: "IP_REGISTRATION_FAILED",
        message: error.message,
        details: error,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      code: "UNKNOWN_REGISTRATION_ERROR",
      message: "An unknown error occurred during IP registration",
      details: error,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Handle transfer errors
   */
  private handleTransferError(error: unknown): BlockchainErrorType {
    if (error instanceof Error) {
      return {
        code: "IP_TRANSFER_FAILED",
        message: error.message,
        details: error,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      code: "UNKNOWN_TRANSFER_ERROR",
      message: "An unknown error occurred during ownership transfer",
      details: error,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Set or update licensing terms for an IP asset
   */
  async setLicenseTerms(
    ipId: string,
    terms: LicenseTerms
  ): Promise<void> {
    try {
      console.log("Setting license terms for IP:", ipId);
      
      // Use the Story Protocol service to set license terms
      await storyClient.setIPLicenseTerms(ipId, {
        commercialUse: terms.commercialUse,
        derivativeWorks: terms.derivativeWorks,
        attributionRequired: terms.attributionRequired,
        royaltyPercent: terms.royaltyPercent || 0
      });
      
      // Update local registration if it exists
      // We need to find which pattern ID corresponds to this IP ID
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("ip_registration_")) {
          const registration = JSON.parse(localStorage.getItem(key) || "{}");
          if (registration.ipHash === ipId) {
            const patternId = key.replace("ip_registration_", "");
            
            // Update the licensing terms in the registration
            registration.licensingTerms = [{
              id: "standard",
              type: "commercial",
              price: 0,
              currency: "ETH",
              attributionRequired: terms.attributionRequired ?? false,
              derivativeWorks: terms.derivativeWorks ?? false,
              commercialUse: terms.commercialUse ?? false,
              royaltyPercent: terms.royaltyPercent ?? 0
            }];
            
            // Save the updated registration
            localStorage.setItem(`ip_registration_${patternId}`, JSON.stringify(registration));
            break;
          }
        }
      }
    } catch (error) {
      console.error("Failed to set license terms:", error);
      throw error;
    }
  }
  
  /**
   * Get pattern ID from IP ID
   */
  private getPatternIdFromIpId(ipId: string): string | null {
    // Since SimpleCache doesn't expose a keys() method, we need to check specific keys
    // Try to find in pattern registrations by directly checking with pattern IDs we might know
    
    // Check local storage first to get potential pattern IDs
    const patternIds: string[] = [];
    
    // Get all pattern IDs from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("ip_registration_")) {
        const patternId = key.replace("ip_registration_", "");
        patternIds.push(patternId);
      }
    }
    
    // Now check if any of these patterns match the IP ID
    for (const patternId of patternIds) {
      const cacheKey = `ip_registration_${patternId}`;
      const registration = this.cache.get<IPRegistration>(cacheKey);
      if (registration && registration.ipHash === ipId) {
        return patternId;
      }
    }
    
    // If not found in cache, check localStorage again
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("ip_registration_")) {
        try {
          const registration = JSON.parse(localStorage.getItem(key) || "{}");
          if (registration.ipHash === ipId) {
            return key.replace("ip_registration_", "");
          }
        } catch (error) {
          console.error("Failed to parse registration:", error);
        }
      }
    }
    return null;
  }
  
  /**
   * Migrate existing localStorage data to cache
   */
  /**
   * Migrate existing localStorage data to cache
   * This method is called when the service is initialized
   */
  private migrateLocalStorageToCache(): void {
    try {
      // We only need to iterate through localStorage as we're populating the cache
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("ip_registration_") || key.startsWith("pattern_"))) {
          try {
            const storedData = localStorage.getItem(key);
            if (storedData) {
              const data = JSON.parse(storedData);
              this.cache.set(key, data);
            }
          } catch (error) {
            console.error(`Failed to migrate ${key} to cache:`, error);
          }
        }
      }
    } catch (error) {
      console.error("Failed to migrate localStorage to cache:", error);
    }
  }
}

// Export singleton instance
export const ipRegistrationService = IPRegistrationService.getInstance();

// Export error class
export class BlockchainError extends Error {
  constructor(
    public code: string,
    message: string,
    public details: unknown,
    public timestamp: string,
  ) {
    super(message);
    this.name = "BlockchainError";
  }
}
