import type {
  IPRegistration,
  IPMetadata,
  TomoWallet,
  Transaction,
  BlockchainError as BlockchainErrorType,
} from "@/types/blockchain";
import type { CustomPattern } from "@/lib/ai/providers";

// Mock Crossmint SDK implementation - replace with actual SDK when installed
const mockCrossmintSDK = {
  registerIP: async (params: {
    content: IPMetadata;
    creator: string;
    title: string;
    description: string;
  }): Promise<IPRegistration> => {
    // Mock implementation - replace with actual Crossmint SDK call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const ipHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    const transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;

    return {
      ipHash,
      transactionHash,
      creator: params.creator,
      title: params.title,
      description: params.description,
      contentHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      timestamp: new Date().toISOString(),
      verified: true,
      royaltyPercentage: 10,
      licensingTerms: [],
    };
  },

  verifyIP: async (ipHash: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return true; // Mock verification
  },

  transferIP: async (
    ipHash: string,
    newOwner: string,
  ): Promise<Transaction> => {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      from: "0x1234567890123456789012345678901234567890",
      to: newOwner,
      value: "0",
      gasUsed: "21000",
      gasPrice: "20000000000",
      status: "confirmed",
      timestamp: new Date().toISOString(),
      blockNumber: Math.floor(Math.random() * 1000000),
    };
  },
};

export class IPRegistrationService {
  private static instance: IPRegistrationService;

  private constructor() {}

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
    wallet: TomoWallet,
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

      // Register with Crossmint/Story Protocol
      const registration = await mockCrossmintSDK.registerIP({
        content: metadata,
        creator: wallet.address,
        title: pattern.name,
        description: pattern.description,
      });

      // Update registration with royalty info
      registration.royaltyPercentage = royaltyPercentage;

      // Store registration in local database/cache
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
  }

  /**
   * Verify ownership of a registered pattern
   */
  async verifyOwnership(
    patternId: string,
    walletAddress: string,
  ): Promise<boolean> {
    try {
      const registration = await this.getRegistration(patternId);

      if (!registration) {
        return false;
      }

      // Check blockchain verification
      const isVerified = await mockCrossmintSDK.verifyIP(registration.ipHash);

      return (
        isVerified &&
        registration.creator.toLowerCase() === walletAddress.toLowerCase()
      );
    } catch (error) {
      console.error("Ownership verification failed:", error);
      return false;
    }
  }

  /**
   * Transfer ownership of a registered pattern
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

      // Execute transfer on blockchain
      const transaction = await mockCrossmintSDK.transferIP(
        registration.ipHash,
        newOwner,
      );

      // Update local records
      await this.updateRegistrationOwner(patternId, newOwner);

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
      // Mock database lookup - replace with actual database call
      const stored = localStorage.getItem(`ip_registration_${patternId}`);
      return stored ? JSON.parse(stored) : null;
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
      // Mock implementation - replace with actual database query
      const registrations: IPRegistration[] = [];

      // Simulate database lookup
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("ip_registration_")) {
          const registration = JSON.parse(localStorage.getItem(key) || "{}");
          if (
            registration.creator?.toLowerCase() === creatorAddress.toLowerCase()
          ) {
            registrations.push(registration);
          }
        }
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

      // Check if content hash exists in registrations
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("ip_registration_")) {
          const registration = JSON.parse(localStorage.getItem(key) || "{}");
          if (registration.contentHash === contentHash) {
            return true;
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
   * Store registration in local database
   */
  private async storeRegistration(
    registration: IPRegistration,
    pattern: CustomPattern,
  ): Promise<void> {
    try {
      // Mock storage - replace with actual database call
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
   * Update registration owner in local database
   */
  private async updateRegistrationOwner(
    patternId: string,
    newOwner: string,
  ): Promise<void> {
    try {
      const registration = await this.getRegistration(patternId);
      if (registration) {
        registration.creator = newOwner;
        localStorage.setItem(
          `ip_registration_${patternId}`,
          JSON.stringify(registration),
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
